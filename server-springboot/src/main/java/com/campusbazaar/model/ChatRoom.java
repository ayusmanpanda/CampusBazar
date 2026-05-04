package com.campusbazaar.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("chatRooms")
@CompoundIndex(name = "listing_buyer_seller", def = "{ 'listing': 1, 'buyer': 1, 'seller': 1 }", unique = true)
public class ChatRoom {

    @Id
    private String id;

    @Indexed
    private String listing;

    @Indexed
    private String buyer;

    @Indexed
    private String seller;

    @Builder.Default
    private List<Message> messages = new ArrayList<>();

    /**
     * TTL: MongoDB will delete documents 60 days after lastMessageAt.
     * The TTL index itself is created in MongoConfig (with expireAfterSeconds).
     */
    @Builder.Default
    private Instant lastMessageAt = Instant.now();

    @CreatedDate
    private Instant createdAt;
}
