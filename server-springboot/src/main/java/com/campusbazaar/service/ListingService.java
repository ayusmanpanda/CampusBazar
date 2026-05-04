package com.campusbazaar.service;

import com.campusbazaar.dto.listing.ListingDtos;
import com.campusbazaar.exception.ApiException;
import com.campusbazaar.model.Listing;
import com.campusbazaar.model.User;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.TextCriteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final MongoTemplate mongoTemplate;

    public ListingDtos.PaginatedResponse<Map<String, Object>> search(
            String q, Listing.Category category, Listing.Condition condition,
            Double minPrice, Double maxPrice, String sort, int page, int limit) {

        page = Math.max(1, page);
        limit = Math.min(50, Math.max(1, limit));

        Query query = new Query();
        query.addCriteria(Criteria.where("status").is(Listing.Status.active));
        if (category != null) query.addCriteria(Criteria.where("category").is(category));
        if (condition != null) query.addCriteria(Criteria.where("condition").is(condition));
        if (minPrice != null || maxPrice != null) {
            Criteria priceC = Criteria.where("price");
            if (minPrice != null) priceC.gte(minPrice);
            if (maxPrice != null) priceC.lte(maxPrice);
            query.addCriteria(priceC);
        }
        if (q != null && !q.isBlank()) {
            query.addCriteria(TextCriteria.forDefaultLanguage().matching(q));
        }

        Sort sortBy = switch (sort == null ? "recent" : sort) {
            case "price_asc"  -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "popular"    -> Sort.by(Sort.Direction.DESC, "views");
            default           -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
        query.with(sortBy);

        long total = mongoTemplate.count(query, Listing.class);
        query.skip((long) (page - 1) * limit).limit(limit);
        List<Listing> items = mongoTemplate.find(query, Listing.class);

        List<Map<String, Object>> withSeller = items.stream().map(this::populateSeller).toList();

        long pages = (total + limit - 1) / limit;
        return new ListingDtos.PaginatedResponse<>(
                withSeller,
                new ListingDtos.Pagination(page, limit, total, pages)
        );
    }

    public Map<String, Object> getById(String id) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Listing not found"));
        return populateSeller(listing);
    }

    public Listing create(String userId, ListingDtos.CreateRequest req, List<MultipartFile> images) {
        if (images != null && images.size() > 5) {
            throw ApiException.badRequest("Maximum 5 images allowed");
        }
        List<String> urls = images == null || images.isEmpty()
                ? List.of()
                : cloudinaryService.uploadAll(images);

        Listing listing = Listing.builder()
                .title(req.title())
                .description(req.description())
                .price(req.price())
                .images(urls)
                .category(req.category())
                .condition(req.condition())
                .seller(userId)
                .status(Listing.Status.active)
                .build();
        return listingRepository.save(listing);
    }

    public Listing update(String userId, String role, String id, ListingDtos.UpdateRequest req, List<MultipartFile> newImages) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Listing not found"));
        if (!listing.getSeller().equals(userId) && !"admin".equalsIgnoreCase(role)) {
            throw ApiException.forbidden("Not allowed");
        }
        if (req.title() != null)       listing.setTitle(req.title());
        if (req.description() != null) listing.setDescription(req.description());
        if (req.price() != null)       listing.setPrice(req.price());
        if (req.category() != null)    listing.setCategory(req.category());
        if (req.condition() != null)   listing.setCondition(req.condition());
        if (req.status() != null)      listing.setStatus(req.status());

        List<String> images = req.keepImages() != null ? new java.util.ArrayList<>(req.keepImages())
                : new java.util.ArrayList<>(listing.getImages());
        if (newImages != null && !newImages.isEmpty()) {
            images.addAll(cloudinaryService.uploadAll(newImages));
        }
        if (images.size() > 5) images = images.subList(0, 5);
        listing.setImages(images);

        return listingRepository.save(listing);
    }

    public void delete(String userId, String role, String id) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Listing not found"));
        if (!listing.getSeller().equals(userId) && !"admin".equalsIgnoreCase(role)) {
            throw ApiException.forbidden("Not allowed");
        }
        listingRepository.delete(listing);
    }

    public void incrementView(String id) {
        mongoTemplate.updateFirst(
                new Query(Criteria.where("_id").is(new ObjectId(id))),
                new Update().inc("views", 1),
                Listing.class
        );
    }

    public List<Listing> myListings(String userId) {
        return listingRepository.findBySellerOrderByCreatedAtDesc(userId);
    }

    private Map<String, Object> populateSeller(Listing l) {
        Map<String, Object> out = new HashMap<>();
        out.put("_id", l.getId());
        out.put("title", l.getTitle());
        out.put("description", l.getDescription());
        out.put("price", l.getPrice());
        out.put("images", l.getImages());
        out.put("category", l.getCategory());
        out.put("condition", l.getCondition());
        out.put("status", l.getStatus());
        out.put("views", l.getViews());
        out.put("createdAt", l.getCreatedAt());

        userRepository.findById(l.getSeller()).ifPresent(s -> {
            Map<String, Object> seller = new HashMap<>();
            seller.put("_id", s.getId());
            seller.put("name", s.getName());
            seller.put("profilePhoto", s.getProfilePhoto());
            seller.put("rating", s.getRating());
            seller.put("totalReviews", s.getTotalReviews());
            seller.put("department", s.getDepartment());
            seller.put("year", s.getYear());
            out.put("seller", seller);
        });
        return out;
    }
}
