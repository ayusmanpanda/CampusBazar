package com.campusbazaar.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "campusbazaar")
public class AppProperties {

    private Jwt jwt = new Jwt();
    private String clientUrl;
    private String collegeEmailDomain;
    private Cloudinary cloudinary = new Cloudinary();
    private SocketIo socketio = new SocketIo();
    private Reports reports = new Reports();

    @Data public static class Jwt {
        private String secret;
        private String refreshSecret;
        private long accessExpiryMinutes;
        private long refreshExpiryDays;
    }
    @Data public static class Cloudinary {
        private String cloudName;
        private String apiKey;
        private String apiSecret;
    }
    @Data public static class SocketIo {
        private String host;
        private int port;
    }
    @Data public static class Reports {
        private int autoBanThreshold;
    }
}
