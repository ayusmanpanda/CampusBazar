package com.campusbazaar.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("users")
public class User {

    public enum Role { student, admin }

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;
    private String department;
    private Integer year;
    private String profilePhoto;

    @Builder.Default
    private Role role = Role.student;

    @Builder.Default
    private boolean isVerified = false;

    private String otp;
    private Instant otpExpiresAt;

    @Builder.Default
    private double rating = 0;

    @Builder.Default
    private int totalReviews = 0;

    @Builder.Default
    private boolean isBanned = false;

    private String banReason;

    @Builder.Default
    private int reportCount = 0;

    @Builder.Default
    private boolean isDeleted = false;

    private Instant deletedAt;

    @Indexed
    @Builder.Default
    private Instant lastActiveAt = Instant.now();

    @Builder.Default
    private List<String> refreshTokens = new ArrayList<>();

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
