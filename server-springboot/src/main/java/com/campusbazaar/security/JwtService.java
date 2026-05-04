package com.campusbazaar.security;

import com.campusbazaar.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final AppProperties props;

    private SecretKey accessKey() {
        return keyFromSecret(props.getJwt().getSecret());
    }

    private SecretKey refreshKey() {
        return keyFromSecret(props.getJwt().getRefreshSecret());
    }

    private SecretKey keyFromSecret(String s) {
        // Accept either base64 or plain text >= 32 bytes
        byte[] bytes;
        try {
            bytes = Decoders.BASE64.decode(s);
            if (bytes.length < 32) bytes = s.getBytes(StandardCharsets.UTF_8);
        } catch (Exception e) {
            bytes = s.getBytes(StandardCharsets.UTF_8);
        }
        return Keys.hmacShaKeyFor(bytes);
    }

    public String signAccess(String userId, String role) {
        Instant now = Instant.now();
        Instant exp = now.plus(Duration.ofMinutes(props.getJwt().getAccessExpiryMinutes()));
        return Jwts.builder()
                .subject(userId)
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(accessKey())
                .compact();
    }

    public String signRefresh(String userId) {
        Instant now = Instant.now();
        Instant exp = now.plus(Duration.ofDays(props.getJwt().getRefreshExpiryDays()));
        return Jwts.builder()
                .subject(userId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(refreshKey())
                .compact();
    }

    public Claims parseAccess(String token) {
        return Jwts.parser().verifyWith(accessKey()).build().parseSignedClaims(token).getPayload();
    }

    public Claims parseRefresh(String token) {
        return Jwts.parser().verifyWith(refreshKey()).build().parseSignedClaims(token).getPayload();
    }
}
