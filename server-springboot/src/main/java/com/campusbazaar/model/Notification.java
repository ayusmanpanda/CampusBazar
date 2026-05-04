package com.campusbazaar.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("notifications")
public class Notification {

    public enum Type { message, offer, offer_response, listing_expired, admin, report }

    @Id
    private String id;

    @Indexed
    private String user;

    private Type type;
    private String title;
    private String body;
    private String link;

    @Builder.Default
    @Indexed
    private boolean read = false;

    @CreatedDate
    private Instant createdAt;
}
