package com.campusbazaar.controller;

import com.campusbazaar.dto.report.ReportDtos;
import com.campusbazaar.model.Report;
import com.campusbazaar.security.CurrentUser;
import com.campusbazaar.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Report create(@AuthenticationPrincipal CurrentUser me,
                         @Valid @RequestBody ReportDtos.CreateRequest req) {
        return reportService.create(me.getId(), req);
    }
}
