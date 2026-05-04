package com.campusbazaar.controller;

import com.campusbazaar.dto.listing.ListingDtos;
import com.campusbazaar.model.Listing;
import com.campusbazaar.security.CurrentUser;
import com.campusbazaar.service.ListingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService listingService;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ListingDtos.PaginatedResponse<Map<String, Object>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Listing.Category category,
            @RequestParam(required = false) Listing.Condition condition,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "recent") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        return listingService.search(q, category, condition, minPrice, maxPrice, sort, page, limit);
    }

    @GetMapping("/me/mine")
    public Map<String, Object> myListings(@AuthenticationPrincipal CurrentUser me) {
        return Map.of("items", listingService.myListings(me.getId()));
    }

    @GetMapping("/{id}")
    public Map<String, Object> getById(@PathVariable String id) {
        return listingService.getById(id);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Listing create(@AuthenticationPrincipal CurrentUser me,
                          @RequestPart("title") String title,
                          @RequestPart("description") String description,
                          @RequestPart("price") String price,
                          @RequestPart("category") String category,
                          @RequestPart("condition") String condition,
                          @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        ListingDtos.CreateRequest req = new ListingDtos.CreateRequest(
                title, description, Double.parseDouble(price),
                Listing.Category.valueOf(category), Listing.Condition.valueOf(condition));
        return listingService.create(me.getId(), req, images);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Listing update(@AuthenticationPrincipal CurrentUser me,
                          @PathVariable String id,
                          @RequestPart(value = "data", required = false) String dataJson,
                          @RequestPart(value = "images", required = false) List<MultipartFile> images) throws Exception {
        ListingDtos.UpdateRequest req = dataJson == null
                ? new ListingDtos.UpdateRequest(null, null, null, null, null, null, null)
                : objectMapper.readValue(dataJson, ListingDtos.UpdateRequest.class);
        return listingService.update(me.getId(), me.getRole(), id, req, images);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Listing updateJson(@AuthenticationPrincipal CurrentUser me,
                              @PathVariable String id,
                              @Valid @RequestBody ListingDtos.UpdateRequest req) {
        return listingService.update(me.getId(), me.getRole(), id, req, null);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@AuthenticationPrincipal CurrentUser me, @PathVariable String id) {
        listingService.delete(me.getId(), me.getRole(), id);
        return Map.of("message", "Listing deleted");
    }

    @PostMapping("/{id}/views")
    public Map<String, String> view(@PathVariable String id) {
        listingService.incrementView(id);
        return Map.of("message", "view counted");
    }
}
