package com.campusbazaar.dto.report;

import com.campusbazaar.model.Report;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReportDtos {

    public record CreateRequest(
            Report.TargetType targetType,
            @NotBlank String targetId,
            @NotBlank @Size(min = 3, max = 200) String reason,
            @Size(max = 2000) String description
    ) {}

    public record UpdateRequest(Report.Status status, String adminNote) {}
}
