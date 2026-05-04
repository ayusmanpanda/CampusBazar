package com.campusbazaar.dto.chat;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class ChatDtos {

    public record CreateRoomRequest(@NotBlank String listingId) {}

    public record OfferRequest(@Min(0) double offerPrice, String text) {}

    public record OfferActionRequest(@NotBlank String action, Double counterPrice) {}
}
