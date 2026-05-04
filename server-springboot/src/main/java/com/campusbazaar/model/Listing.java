package com.campusbazaar.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("listings")
@CompoundIndexes({
        @CompoundIndex(name = "category_status_created", def = "{ 'category': 1, 'status': 1, 'createdAt': -1 }")
})
public class Listing {

    public enum Category { Books, Electronics, Clothing, Furniture, Services, Other }
    public enum Condition { New, Good, Fair }
    public enum Status { active, sold, expired }

    @Id
    private String id;

    @TextIndexed
    private String title;

    @TextIndexed
    private String description;

    private double price;

    @Builder.Default
    private List<String> images = new ArrayList<>();

    private Category category;
    private Condition condition;

    @Indexed
    private String seller;       // User id

    @Builder.Default
    @Indexed
    private Status status = Status.active;

    @Builder.Default
    private long views = 0;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
