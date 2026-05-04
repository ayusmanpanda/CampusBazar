package com.campusbazaar.service;

import com.campusbazaar.config.AppProperties;
import com.campusbazaar.dto.report.ReportDtos;
import com.campusbazaar.exception.ApiException;
import com.campusbazaar.model.Listing;
import com.campusbazaar.model.Report;
import com.campusbazaar.model.User;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.repository.ReportRepository;
import com.campusbazaar.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final AppProperties props;

    public Report create(String reporterId, ReportDtos.CreateRequest req) {
        if (req.targetType() == Report.TargetType.user) {
            if (!userRepository.existsById(req.targetId()))
                throw ApiException.notFound("Target user not found");
            if (reporterId.equals(req.targetId()))
                throw ApiException.badRequest("You can't report yourself");
        } else if (req.targetType() == Report.TargetType.listing) {
            if (!listingRepository.existsById(req.targetId()))
                throw ApiException.notFound("Target listing not found");
        }

        Report report = reportRepository.save(Report.builder()
                .reporter(reporterId)
                .targetType(req.targetType())
                .targetId(req.targetId())
                .reason(req.reason())
                .description(req.description())
                .status(Report.Status.pending)
                .build());

        // auto-ban check (only for user reports)
        if (req.targetType() == Report.TargetType.user) {
            long count = reportRepository.countByTargetTypeAndTargetId(Report.TargetType.user, req.targetId());
            userRepository.findById(req.targetId()).ifPresent(u -> {
                u.setReportCount((int) count);
                if (count >= props.getReports().getAutoBanThreshold() && !u.isBanned()) {
                    u.setBanned(true);
                    u.setBanReason("Auto-banned: " + count + " reports");
                }
                userRepository.save(u);
            });
        }

        return report;
    }
}
