package com.campusbazaar.dto.listing;

import com.campusbazaar.model.Listing;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class ListingDtos {

    public record CreateRequest(
            @NotBlank @Size(min = 3, max = 120) String title,
            @NotBlank @Size(min = 5, max = 4000) String description,
            @Min(0) double price,
            Listing.Category category,
            Listing.Condition condition
    ) {}

    public record UpdateRequest(
            @Size(min = 3, max = 120) String title,
            @Size(min = 5, max = 4000) String description,
            Double price,
            Listing.Category category,
            Listing.Condition condition,
            Listing.Status status,
            List<String> keepImages
    ) {}

    public record PaginatedResponse<T>(List<T> items, Pagination pagination) {}

    public record Pagination(int page, int limit, long total, long pages) {}
}
