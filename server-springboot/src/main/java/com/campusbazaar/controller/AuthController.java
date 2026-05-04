package com.campusbazaar.controller;

import com.campusbazaar.dto.auth.AuthDtos;
import com.campusbazaar.security.CurrentUser;
import com.campusbazaar.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> signup(@Valid @RequestBody AuthDtos.SignupRequest req) {
        authService.signup(req);
        return Map.of("message", "OTP sent to email", "email", req.email());
    }

    @PostMapping("/verify-otp")
    public Map<String, String> verify(@Valid @RequestBody AuthDtos.VerifyOtpRequest req) {
        authService.verifyOtp(req);
        return Map.of("message", "Account verified — you can now log in");
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/refresh-token")
    public Map<String, String> refresh(@Valid @RequestBody AuthDtos.RefreshRequest req) {
        return Map.of("accessToken", authService.refreshAccessToken(req.refreshToken()));
    }

    @PostMapping("/logout")
    public Map<String, String> logout(@AuthenticationPrincipal CurrentUser me,
                                      @RequestBody AuthDtos.LogoutRequest req) {
        authService.logout(me.getId(), req.refreshToken());
        return Map.of("message", "Logged out");
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal CurrentUser me) {
        return Map.of("user", AuthDtos.UserPayload.from(me.getUser()));
    }
}
