package com.campusbazaar.service;

import com.campusbazaar.config.AppProperties;
import com.campusbazaar.dto.auth.AuthDtos;
import com.campusbazaar.exception.ApiException;
import com.campusbazaar.model.User;
import com.campusbazaar.repository.UserRepository;
import com.campusbazaar.security.JwtService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final AppProperties props;
    private final ObjectProvider<StringRedisTemplate> redisProvider;

    public void signup(AuthDtos.SignupRequest req) {
        String email = req.email().toLowerCase();
        if (!email.endsWith("@" + props.getCollegeEmailDomain().toLowerCase())) {
            throw ApiException.badRequest("Only @" + props.getCollegeEmailDomain() + " emails are allowed to sign up");
        }

        User existing = userRepository.findByEmail(email).orElse(null);
        if (existing != null && existing.isVerified()) {
            throw ApiException.conflict("Email already registered");
        }

        String otp = generateOtp();
        Instant expiry = Instant.now().plus(Duration.ofMinutes(15));

        User user = existing != null ? existing : User.builder().email(email).build();
        user.setName(req.name());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setDepartment(req.department());
        user.setYear(req.year());
        user.setOtp(otp);
        user.setOtpExpiresAt(expiry);
        user.setVerified(false);
        userRepository.save(user);

        emailService.sendOtpEmail(email, otp);
    }

    public void verifyOtp(AuthDtos.VerifyOtpRequest req) {
        User user = userRepository.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> ApiException.notFound("User not found"));
        if (user.isVerified()) throw ApiException.badRequest("Already verified");
        if (user.getOtp() == null || !user.getOtp().equals(req.otp())) {
            throw ApiException.badRequest("Invalid OTP");
        }
        if (user.getOtpExpiresAt() != null && user.getOtpExpiresAt().isBefore(Instant.now())) {
            throw ApiException.badRequest("OTP expired");
        }
        user.setVerified(true);
        user.setOtp(null);
        user.setOtpExpiresAt(null);
        userRepository.save(user);
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest req) {
        User user = userRepository.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> ApiException.unauthorized("Invalid credentials"));
        if (user.isDeleted()) throw ApiException.unauthorized("Invalid credentials");
        if (user.isBanned()) throw ApiException.forbidden("Account banned");
        if (!user.isVerified()) throw ApiException.forbidden("Email not verified");

        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw ApiException.unauthorized("Invalid credentials");
        }

        String access = jwtService.signAccess(user.getId(), user.getRole().name());
        String refresh = jwtService.signRefresh(user.getId());

        List<String> tokens = user.getRefreshTokens() == null ? new ArrayList<>() : new ArrayList<>(user.getRefreshTokens());
        tokens.add(refresh);
        if (tokens.size() > 5) tokens = tokens.subList(tokens.size() - 5, tokens.size());
        user.setRefreshTokens(tokens);
        user.setLastActiveAt(Instant.now());
        userRepository.save(user);

        StringRedisTemplate redis = redisProvider.getIfAvailable();
        if (redis != null) {
            try { redis.opsForValue().set("session:" + user.getId(), "1", Duration.ofDays(1)); }
            catch (Exception ignored) {}
        }

        return AuthDtos.AuthResponse.from(access, refresh, user);
    }

    public String refreshAccessToken(String refreshToken) {
        try {
            Claims claims = jwtService.parseRefresh(refreshToken);
            User user = userRepository.findById(claims.getSubject())
                    .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));
            if (user.getRefreshTokens() == null || !user.getRefreshTokens().contains(refreshToken)) {
                throw ApiException.unauthorized("Invalid refresh token");
            }
            return jwtService.signAccess(user.getId(), user.getRole().name());
        } catch (Exception e) {
            throw ApiException.unauthorized("Invalid or expired refresh token");
        }
    }

    public void logout(String userId, String refreshToken) {
        userRepository.findById(userId).ifPresent(u -> {
            if (u.getRefreshTokens() != null) {
                u.getRefreshTokens().removeIf(t -> t.equals(refreshToken));
                userRepository.save(u);
            }
        });
        StringRedisTemplate redis = redisProvider.getIfAvailable();
        if (redis != null) {
            try { redis.delete("session:" + userId); } catch (Exception ignored) {}
        }
    }

    private String generateOtp() {
        return String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
    }
}
