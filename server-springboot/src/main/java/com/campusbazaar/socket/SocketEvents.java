package com.campusbazaar.socket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class SocketEvents {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class JoinRoomPayload {
        private String chatRoomId;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SendMessagePayload {
        private String chatRoomId;
        private String text;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SendOfferPayload {
        private String chatRoomId;
        private Double offerPrice;
        private String text;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OfferResponsePayload {
        private String chatRoomId;
        private String offerId;
        private String action;        // accept | reject | counter
        private Double counterPrice;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TypingPayload {
        private String chatRoomId;
        private Boolean isTyping;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OnlineStatusEvent {
        private String userId;
        private boolean online;
    }
}
