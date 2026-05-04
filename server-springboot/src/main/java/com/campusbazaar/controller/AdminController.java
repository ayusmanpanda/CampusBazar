package com.campusbazaar.controller;

import com.campusbazaar.dto.admin.AdminDtos;
import com.campusbazaar.dto.report.ReportDtos;
import com.campusbazaar.model.Listing;
import com.campusbazaar.model.Report;
import com.campusbazaar.model.User;
import com.campusbazaar.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public Map<String, Object> users(@RequestParam(required = false) String q,
                                     @RequestParam(defaultValue = "1") int page,
                                     @RequestParam(defaultValue = "25") int limit) {
        return adminService.users(q, page, limit);
    }

    @GetMapping("/listings")
    public Map<String, Object> listings(@RequestParam(required = false) String q,
                                        @RequestParam(required = false) Listing.Status status,
                                        @RequestParam(defaultValue = "1") int page,
                                        @RequestParam(defaultValue = "25") int limit) {
        return adminService.listings(q, status, page, limit);
    }

    @GetMapping("/reports")
    public Map<String, Object> reports(@RequestParam(required = false) Report.Status status,
                                       @RequestParam(defaultValue = "1") int page,
                                       @RequestParam(defaultValue = "25") int limit) {
        return adminService.reports(status, page, limit);
    }

    @PutMapping("/reports/{id}")
    public Report updateReport(@PathVariable String id, @Valid @RequestBody ReportDtos.UpdateRequest req) {
        return adminService.updateReport(id, req);
    }

    @PutMapping("/users/{id}/ban")
    public User banUser(@PathVariable String id, @Valid @RequestBody AdminDtos.BanUserRequest req) {
        return adminService.banUser(id, req);
    }
}
