package com.campusbazaar.config;

import com.campusbazaar.model.ChatRoom;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

import java.util.concurrent.TimeUnit;

/**
 * Programmatically creates the TTL index that drops idle ChatRoom docs after 60 days.
 * (Spring Data MongoDB has no annotation-driven TTL, so we add it on startup.)
 */
@Configuration
@RequiredArgsConstructor
public class MongoConfig {

    private final MongoTemplate mongoTemplate;

    @PostConstruct
    public void initIndexes() {
        long sixtyDaysSeconds = TimeUnit.DAYS.toSeconds(60);
        mongoTemplate.indexOps(ChatRoom.class).ensureIndex(
                new Index().on("lastMessageAt", org.springframework.data.domain.Sort.Direction.ASC)
                        .expire(sixtyDaysSeconds)
        );
    }
}
