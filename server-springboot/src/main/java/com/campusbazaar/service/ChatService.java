package com.campusbazaar.service;

import com.campusbazaar.dto.chat.ChatDtos;
import com.campusbazaar.exception.ApiException;
import com.campusbazaar.model.ChatRoom;
import com.campusbazaar.model.Listing;
import com.campusbazaar.model.Message;
import com.campusbazaar.model.Notification;
import com.campusbazaar.model.User;
import com.campusbazaar.repository.ChatRoomRepository;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ChatRoom createOrGetRoom(String userId, ChatDtos.CreateRoomRequest req) {
        Listing listing = listingRepository.findById(req.listingId())
                .orElseThrow(() -> ApiException.notFound("Listing not found"));
        if (listing.getSeller().equals(userId)) {
            throw ApiException.badRequest("You can't chat with yourself about your own listing");
        }
        return chatRoomRepository.findByListingAndBuyerAndSeller(listing.getId(), userId, listing.getSeller())
                .orElseGet(() -> chatRoomRepository.save(
                        ChatRoom.builder()
                                .listing(listing.getId())
                                .buyer(userId)
                                .seller(listing.getSeller())
                                .lastMessageAt(Instant.now())
                                .messages(new ArrayList<>())
                                .build()));
    }

    public List<Map<String, Object>> myChats(String userId) {
        List<ChatRoom> rooms = chatRoomRepository.findAllForUser(userId);
        List<Map<String, Object>> out = new ArrayList<>();
        for (ChatRoom r : rooms) {
            Map<String, Object> m = new HashMap<>();
            m.put("_id", r.getId());
            m.put("lastMessageAt", r.getLastMessageAt());
            listingRepository.findById(r.getListing()).ifPresent(l -> {
                Map<String, Object> lp = new HashMap<>();
                lp.put("_id", l.getId());
                lp.put("title", l.getTitle());
                lp.put("price", l.getPrice());
                lp.put("images", l.getImages());
                lp.put("status", l.getStatus());
                m.put("listing", lp);
            });
            userRepository.findById(r.getBuyer()).ifPresent(u -> m.put("buyer", userMini(u)));
            userRepository.findById(r.getSeller()).ifPresent(u -> m.put("seller", userMini(u)));

            Message last = r.getMessages().isEmpty() ? null : r.getMessages().get(r.getMessages().size() - 1);
            m.put("lastMessage", last);
            long unread = r.getMessages().stream().filter(msg ->
                    !msg.getSender().equals(userId)
                    && (msg.getReadBy() == null || !msg.getReadBy().contains(userId))
            ).count();
            m.put("unreadCount", unread);
            out.add(m);
        }
        return out;
    }

    public Map<String, Object> getMessages(String userId, String roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> ApiException.notFound("Chat room not found"));
        if (!room.getBuyer().equals(userId) && !room.getSeller().equals(userId)) {
            throw ApiException.forbidden("Not a participant");
        }
        boolean dirty = false;
        for (Message m : room.getMessages()) {
            if (m.getReadBy() == null) m.setReadBy(new ArrayList<>());
            if (!m.getReadBy().contains(userId)) {
                m.getReadBy().add(userId);
                dirty = true;
            }
        }
        if (dirty) chatRoomRepository.save(room);

        Map<String, Object> out = new HashMap<>();
        out.put("_id", room.getId());
        out.put("messages", room.getMessages());
        out.put("lastMessageAt", room.getLastMessageAt());
        listingRepository.findById(room.getListing()).ifPresent(l -> {
            Map<String, Object> lp = new HashMap<>();
            lp.put("_id", l.getId());
            lp.put("title", l.getTitle());
            lp.put("images", l.getImages());
            lp.put("price", l.getPrice());
            lp.put("status", l.getStatus());
            lp.put("seller", l.getSeller());
            out.put("listing", lp);
        });
        userRepository.findById(room.getBuyer()).ifPresent(u -> out.put("buyer", userMini(u)));
        userRepository.findById(room.getSeller()).ifPresent(u -> out.put("seller", userMini(u)));
        return out;
    }

    public Message sendOffer(String userId, String roomId, ChatDtos.OfferRequest req) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> ApiException.notFound("Chat room not found"));
        ensureParticipant(room, userId);

        Message msg = Message.builder()
                .sender(userId)
                .type(Message.Type.offer)
                .text(req.text() != null ? req.text() : "Offer: ₹" + req.offerPrice())
                .offerPrice(req.offerPrice())
                .offerStatus(Message.OfferStatus.pending)
                .readBy(new ArrayList<>(List.of(userId)))
                .createdAt(Instant.now())
                .build();
        room.getMessages().add(msg);
        room.setLastMessageAt(Instant.now());
        chatRoomRepository.save(room);

        String recipient = room.getBuyer().equals(userId) ? room.getSeller() : room.getBuyer();
        notificationService.create(recipient, Notification.Type.offer, "New offer",
                "Offer of ₹" + req.offerPrice(), "/chats/" + room.getId());
        return msg;
    }

    public Map<String, Object> respondOffer(String userId, String roomId, String offerId, ChatDtos.OfferActionRequest req) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> ApiException.notFound("Chat room not found"));
        ensureParticipant(room, userId);

        Message offer = room.getMessages().stream()
                .filter(m -> m.getId().equals(offerId) && m.getType() == Message.Type.offer)
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("Offer not found"));
        if (offer.getSender().equals(userId)) throw ApiException.badRequest("You can't respond to your own offer");
        if (offer.getOfferStatus() != Message.OfferStatus.pending) {
            throw ApiException.badRequest("Offer already " + offer.getOfferStatus());
        }

        Message counter = null;
        switch (req.action()) {
            case "accept" -> {
                offer.setOfferStatus(Message.OfferStatus.accepted);
                listingRepository.findById(room.getListing()).ifPresent(l -> {
                    l.setStatus(Listing.Status.sold);
                    listingRepository.save(l);
                });
            }
            case "reject" -> offer.setOfferStatus(Message.OfferStatus.rejected);
            case "counter" -> {
                if (req.counterPrice() == null) throw ApiException.badRequest("counterPrice required");
                offer.setOfferStatus(Message.OfferStatus.countered);
                counter = Message.builder()
                        .sender(userId).type(Message.Type.offer)
                        .text("Counter: ₹" + req.counterPrice())
                        .offerPrice(req.counterPrice())
                        .offerStatus(Message.OfferStatus.pending)
                        .readBy(new ArrayList<>(List.of(userId)))
                        .createdAt(Instant.now())
                        .build();
                room.getMessages().add(counter);
            }
            default -> throw ApiException.badRequest("Invalid action");
        }

        room.setLastMessageAt(Instant.now());
        chatRoomRepository.save(room);

        String recipient = room.getBuyer().equals(userId) ? room.getSeller() : room.getBuyer();
        notificationService.create(recipient, Notification.Type.offer_response,
                "Offer " + offer.getOfferStatus(), "Your offer was " + offer.getOfferStatus(),
                "/chats/" + room.getId());

        Map<String, Object> resp = new HashMap<>();
        resp.put("offer", offer);
        resp.put("counterMessage", counter);
        return resp;
    }

    private void ensureParticipant(ChatRoom room, String userId) {
        if (!room.getBuyer().equals(userId) && !room.getSeller().equals(userId)) {
            throw ApiException.forbidden("Not a participant");
        }
    }

    private Map<String, Object> userMini(User u) {
        Map<String, Object> m = new HashMap<>();
        m.put("_id", u.getId());
        m.put("name", u.getName());
        m.put("profilePhoto", u.getProfilePhoto());
        return m;
    }
}
