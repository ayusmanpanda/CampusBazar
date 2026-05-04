package com.campusbazaar.service;

import com.campusbazaar.exception.ApiException;
import com.campusbazaar.model.Listing;
import com.campusbazaar.model.User;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    public Map<String, Object> publicProfile(String userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        Query q = new Query(Criteria.where("seller").is(userId).and("status").is(Listing.Status.active));
        q.with(Sort.by(Sort.Direction.DESC, "createdAt")).limit(50);
        List<Listing> listings = mongoTemplate.find(q, Listing.class);

        Map<String, Object> userOut = new HashMap<>();
        userOut.put("_id", u.getId());
        userOut.put("name", u.getName());
        userOut.put("profilePhoto", u.getProfilePhoto());
        userOut.put("department", u.getDepartment());
        userOut.put("year", u.getYear());
        userOut.put("rating", u.getRating());
        userOut.put("totalReviews", u.getTotalReviews());
        userOut.put("createdAt", u.getCreatedAt());

        Map<String, Object> response = new HashMap<>();
        response.put("user", userOut);
        response.put("listings", listings);
        return response;
    }
}
