package com.campusbazaar.socket;

import com.campusbazaar.config.AppProperties;
import com.corundumstudio.socketio.AuthorizationListener;
import com.corundumstudio.socketio.AuthorizationResult;
import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.HandshakeData;
import com.corundumstudio.socketio.SocketIOServer;
import com.campusbazaar.repository.UserRepository;
import com.campusbazaar.security.JwtService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

import java.util.Map;

@Slf4j
@org.springframework.context.annotation.Configuration
@RequiredArgsConstructor
public class SocketIOConfig {

    private final AppProperties props;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Value("${campusbazaar.client-url}")
    private String clientUrl;

    @Bean(destroyMethod = "stop")
    public SocketIOServer socketIOServer() {
        Configuration cfg = new Configuration();
        cfg.setHostname(props.getSocketio().getHost());
        cfg.setPort(props.getSocketio().getPort());
        cfg.setOrigin(clientUrl);

        cfg.setAuthorizationListener(new AuthorizationListener() {
            @Override
            public AuthorizationResult getAuthorizationResult(HandshakeData data) {
                String token = extractToken(data);
                if (token == null) return AuthorizationResult.FAILED_AUTHORIZATION;
                try {
                    Claims claims = jwtService.parseAccess(token);
                    String userId = claims.getSubject();
                    var userOpt = userRepository.findById(userId);
                    if (userOpt.isEmpty() || userOpt.get().isBanned() || userOpt.get().isDeleted()) {
                        return AuthorizationResult.FAILED_AUTHORIZATION;
                    }
                    // attach userId so handlers can read it later
                    data.getUrlParams().put("userId", java.util.List.of(userId));
                    return new AuthorizationResult(true, Map.of("userId", userId));
                } catch (Exception e) {
                    log.debug("Socket auth rejected: {}", e.getMessage());
                    return AuthorizationResult.FAILED_AUTHORIZATION;
                }
            }
        });

        SocketIOServer server = new SocketIOServer(cfg);
        return server;
    }

    private String extractToken(HandshakeData data) {
        // 1) auth: { token } sent by socket.io-client v4
        Object authObj = data.getAuthToken();
        if (authObj instanceof Map<?, ?> map) {
            Object t = map.get("token");
            if (t != null) return t.toString();
        } else if (authObj instanceof String s) {
            return s;
        }
        // 2) ?token=... query fallback
        String q = data.getSingleUrlParam("token");
        if (q != null) return q;
        // 3) Authorization header fallback
        String header = data.getHttpHeaders() == null ? null : data.getHttpHeaders().get("Authorization");
        if (header != null && header.startsWith("Bearer ")) return header.substring(7);
        return null;
    }
}
