package com.campusbazaar.controller;

import com.campusbazaar.dto.chat.ChatDtos;
import com.campusbazaar.model.ChatRoom;
import com.campusbazaar.model.Message;
import com.campusbazaar.security.CurrentUser;
import com.campusbazaar.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChatRoom createOrGet(@AuthenticationPrincipal CurrentUser me,
                                @Valid @RequestBody ChatDtos.CreateRoomRequest req) {
        return chatService.createOrGetRoom(me.getId(), req);
    }

    @GetMapping
    public Map<String, Object> myChats(@AuthenticationPrincipal CurrentUser me) {
        return Map.of("items", chatService.myChats(me.getId()));
    }

    @GetMapping("/{id}/messages")
    public Map<String, Object> getMessages(@AuthenticationPrincipal CurrentUser me,
                                           @PathVariable String id) {
        return chatService.getMessages(me.getId(), id);
    }

    @PostMapping("/{id}/offer")
    @ResponseStatus(HttpStatus.CREATED)
    public Message sendOffer(@AuthenticationPrincipal CurrentUser me,
                             @PathVariable String id,
                             @Valid @RequestBody ChatDtos.OfferRequest req) {
        return chatService.sendOffer(me.getId(), id, req);
    }

    @PutMapping("/{id}/offer/{offerId}")
    public Map<String, Object> respondOffer(@AuthenticationPrincipal CurrentUser me,
                                            @PathVariable String id,
                                            @PathVariable String offerId,
                                            @Valid @RequestBody ChatDtos.OfferActionRequest req) {
        return chatService.respondOffer(me.getId(), id, offerId, req);
    }
}
