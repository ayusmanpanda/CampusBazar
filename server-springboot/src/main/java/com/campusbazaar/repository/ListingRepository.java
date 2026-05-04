package com.campusbazaar.repository;

import com.campusbazaar.model.Listing;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface ListingRepository extends MongoRepository<Listing, String> {
    List<Listing> findBySellerOrderByCreatedAtDesc(String seller);
    List<Listing> findByStatusAndCreatedAtBefore(Listing.Status status, Instant cutoff);
}
