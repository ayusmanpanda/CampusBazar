package com.campusbazaar.repository;

import com.campusbazaar.model.ChatRoom;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends MongoRepository<ChatRoom, String> {
    Optional<ChatRoom> findByListingAndBuyerAndSeller(String listing, String buyer, String seller);

    @Query(value = "{ $or: [ { 'buyer': ?0 }, { 'seller': ?0 } ] }", sort = "{ 'lastMessageAt': -1 }")
    List<ChatRoom> findAllForUser(String userId);
}
