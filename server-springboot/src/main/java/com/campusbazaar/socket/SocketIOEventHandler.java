package com.campusbazaar.socket;

import com.campusbazaar.model.ChatRoom;
import com.campusbazaar.model.Message;
import com.campusbazaar.model.Notification;
import com.campusbazaar.repository.ChatRoomRepository;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.service.NotificationService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class SocketIOEventHandler {

    private final SocketIOServer server;
    private final ChatRoomRepository chatRoomRepository;
    private final ListingRepository listingRepository;
    private final NotificationService notificationService;

    /** userId -> set of socket session ids — supports multiple tabs/devices. */
    private final Map<String, Set<String>> online = new ConcurrentHashMap<>();

    @PostConstruct
    public void start() {
        server.addConnectListener(onConnect());
        server.addDisconnectListener(onDisconnect());

        server.addEventListener("joinRoom", String.class, (client, chatRoomId, ack) -> {
            String userId = userId(client);
            if (userId == null || chatRoomId == null) return;
            Optional<ChatRoom> r = chatRoomRepository.findById(chatRoomId);
            if (r.isEmpty()) return;
            if (!r.get().getBuyer().equals(userId) && !r.get().getSeller().equals(userId)) return;
            client.joinRoom("chat:" + chatRoomId);
        });

        server.addEventListener("leaveRoom", String.class, (client, chatRoomId, ack) ->
                client.leaveRoom("chat:" + chatRoomId));

        server.addEventListener("sendMessage", SocketEvents.SendMessagePayload.class, (client, payload, ack) -> {
            String userId = userId(client);
            if (userId == null) return;
            ChatRoom room = chatRoomRepository.findById(payload.getChatRoomId()).orElse(null);
            if (room == null) return;
            if (!room.getBuyer().equals(userId) && !room.getSeller().equals(userId)) return;

            Message msg = Message.builder()
                    .sender(userId)
                    .type(Message.Type.text)
                    .text(payload.getText() == null ? "" :
                            payload.getText().substring(0, Math.min(payload.getText().length(), 4000)))
                    .readBy(new ArrayList<>(List.of(userId)))
                    .createdAt(Instant.now())
                    .build();
            room.getMessages().add(msg);
            room.setLastMessageAt(Instant.now());
            chatRoomRepository.save(room);

            Map<String, Object> outgoing = new HashMap<>();
            outgoing.put("chatRoomId", room.getId());
            outgoing.put("message", msg);
            server.getRoomOperations("chat:" + room.getId()).sendEvent("newMessage", outgoing);

            String recipient = room.getBuyer().equals(userId) ? room.getSeller() : room.getBuyer();
            String preview = msg.getText() == null ? "" :
                    msg.getText().substring(0, Math.min(msg.getText().length(), 80));
            notificationService.create(recipient, Notification.Type.message, "New message",
                    preview, "/chats/" + room.getId());
            sendToUser(recipient, "newNotification", Map.of(
                    "type", "message",
                    "chatRoomId", room.getId(),
                    "preview", preview
            ));
        });

        server.addEventListener("sendOffer", SocketEvents.SendOfferPayload.class, (client, payload, ack) -> {
            String userId = userId(client);
            if (userId == null || payload.getOfferPrice() == null) return;
            ChatRoom room = chatRoomRepository.findById(payload.getChatRoomId()).orElse(null);
            if (room == null) return;
            if (!room.getBuyer().equals(userId) && !room.getSeller().equals(userId)) return;

            Message msg = Message.builder()
                    .sender(userId)
                    .type(Message.Type.offer)
                    .text(payload.getText() != null ? payload.getText() : "Offer: ₹" + payload.getOfferPrice())
                    .offerPrice(payload.getOfferPrice())
                    .offerStatus(Message.OfferStatus.pending)
                    .readBy(new ArrayList<>(List.of(userId)))
                    .createdAt(Instant.now())
                    .build();
            room.getMessages().add(msg);
            room.setLastMessageAt(Instant.now());
            chatRoomRepository.save(room);

            server.getRoomOperations("chat:" + room.getId()).sendEvent("newMessage", Map.of(
                    "chatRoomId", room.getId(), "message", msg));

            String recipient = room.getBuyer().equals(userId) ? room.getSeller() : room.getBuyer();
            notificationService.create(recipient, Notification.Type.offer, "New offer",
                    "Offer of ₹" + payload.getOfferPrice(), "/chats/" + room.getId());
            sendToUser(recipient, "newNotification", Map.of(
                    "type", "offer",
                    "chatRoomId", room.getId(),
                    "offerPrice", payload.getOfferPrice()
            ));
        });

        server.addEventListener("offerResponse", SocketEvents.OfferResponsePayload.class, (client, payload, ack) -> {
            String userId = userId(client);
            if (userId == null) return;
            ChatRoom room = chatRoomRepository.findById(payload.getChatRoomId()).orElse(null);
            if (room == null) return;
            if (!room.getBuyer().equals(userId) && !room.getSeller().equals(userId)) return;

            Message offer = room.getMessages().stream()
                    .filter(m -> m.getId().equals(payload.getOfferId()) && m.getType() == Message.Type.offer)
                    .findFirst().orElse(null);
            if (offer == null || offer.getSender().equals(userId)) return;

            Message countered = null;
            switch (payload.getAction() == null ? "" : payload.getAction()) {
                case "accept" -> {
                    offer.setOfferStatus(Message.OfferStatus.accepted);
                    listingRepository.findById(room.getListing()).ifPresent(l -> {
                        l.setStatus(com.campusbazaar.model.Listing.Status.sold);
                        listingRepository.save(l);
                    });
                }
                case "reject" -> offer.setOfferStatus(Message.OfferStatus.rejected);
                case "counter" -> {
                    if (payload.getCounterPrice() == null) return;
                    offer.setOfferStatus(Message.OfferStatus.countered);
                    countered = Message.builder()
                            .sender(userId).type(Message.Type.offer)
                            .text("Counter: ₹" + payload.getCounterPrice())
                            .offerPrice(payload.getCounterPrice())
                            .offerStatus(Message.OfferStatus.pending)
                            .readBy(new ArrayList<>(List.of(userId)))
                            .createdAt(Instant.now())
                            .build();
                    room.getMessages().add(countered);
                }
                default -> { return; }
            }
            room.setLastMessageAt(Instant.now());
            chatRoomRepository.save(room);

            Map<String, Object> evt = new HashMap<>();
            evt.put("chatRoomId", room.getId());
            evt.put("offerId", offer.getId());
            evt.put("status", offer.getOfferStatus().name());
            evt.put("counterMessage", countered);
            server.getRoomOperations("chat:" + room.getId()).sendEvent("offerUpdated", evt);
        });

        server.addEventListener("typing", SocketEvents.TypingPayload.class, (client, payload, ack) -> {
            String userId = userId(client);
            if (userId == null || payload.getChatRoomId() == null) return;
            // Broadcast to others in the chat room (not back to the sender)
            client.getNamespace().getRoomOperations("chat:" + payload.getChatRoomId())
                    .getClients().stream()
                    .filter(c -> !c.getSessionId().equals(client.getSessionId()))
                    .forEach(c -> c.sendEvent("typing", Map.of(
                            "chatRoomId", payload.getChatRoomId(),
                            "userId", userId,
                            "isTyping", Boolean.TRUE.equals(payload.getIsTyping())
                    )));
        });

        server.start();
        log.info("[socket.io] started on port {}", server.getConfiguration().getPort());
    }

    @PreDestroy
    public void stop() {
        server.stop();
    }

    private ConnectListener onConnect() {
        return client -> {
            String userId = userId(client);
            if (userId == null) {
                client.disconnect();
                return;
            }
            online.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(client.getSessionId().toString());
            client.joinRoom("user:" + userId);
            server.getBroadcastOperations().sendEvent("onlineStatus", Map.of(
                    "userId", userId, "online", true));
        };
    }

    private DisconnectListener onDisconnect() {
        return client -> {
            String userId = userId(client);
            if (userId == null) return;
            Set<String> set = online.get(userId);
            if (set != null) {
                set.remove(client.getSessionId().toString());
                if (set.isEmpty()) {
                    online.remove(userId);
                    server.getBroadcastOperations().sendEvent("onlineStatus", Map.of(
                            "userId", userId, "online", false));
                }
            }
        };
    }

    private void sendToUser(String userId, String event, Object data) {
        server.getRoomOperations("user:" + userId).sendEvent(event, data);
    }

    /**
     * The userId was attached by {@link SocketIOConfig}'s authorization listener.
     * We placed it under {@code urlParams["userId"]} so it survives across handler invocations.
     */
    private String userId(SocketIOClient client) {
        var params = client.getHandshakeData().getUrlParams();
        if (params == null) return null;
        var ids = params.get("userId");
        return (ids == null || ids.isEmpty()) ? null : ids.get(0);
    }
}
