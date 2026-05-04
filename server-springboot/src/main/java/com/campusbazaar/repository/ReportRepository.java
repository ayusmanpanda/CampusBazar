package com.campusbazaar.repository;

import com.campusbazaar.model.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReportRepository extends MongoRepository<Report, String> {
    Page<Report> findByStatus(Report.Status status, Pageable pageable);
    long countByTargetTypeAndTargetId(Report.TargetType targetType, String targetId);
}
