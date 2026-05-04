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
@Document("reports")
public class Report {

    public enum TargetType { listing, user }
    public enum Status { pending, reviewed, resolved }

    @Id
    private String id;

    @Indexed
    private String reporter;

    private TargetType targetType;

    @Indexed
    private String targetId;

    private String reason;
    private String description;

    @Builder.Default
    @Indexed
    private Status status = Status.pending;

    private String adminNote;

    @CreatedDate
    private Instant createdAt;
}
