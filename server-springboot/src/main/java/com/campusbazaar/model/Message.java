package com.campusbazaar.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    public enum Type { text, offer }
    public enum OfferStatus { pending, accepted, rejected, countered }

    @Builder.Default
    private String id = UUID.randomUUID().toString();

    private String sender;     // User id
    private String text;

    @Builder.Default
    private Type type = Type.text;

    private Double offerPrice;

    @Builder.Default
    private OfferStatus offerStatus = OfferStatus.pending;

    @Builder.Default
    private List<String> readBy = new ArrayList<>();

    @Builder.Default
    private Instant createdAt = Instant.now();
}
