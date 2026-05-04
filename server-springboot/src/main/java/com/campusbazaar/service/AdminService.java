package com.campusbazaar.service;

import com.campusbazaar.dto.admin.AdminDtos;
import com.campusbazaar.dto.report.ReportDtos;
import com.campusbazaar.exception.ApiException;
import com.campusbazaar.model.Listing;
import com.campusbazaar.model.Report;
import com.campusbazaar.model.User;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.repository.ReportRepository;
import com.campusbazaar.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.TextCriteria;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final ReportRepository reportRepository;
    private final MongoTemplate mongoTemplate;

    public Map<String, Object> users(String q, int page, int limit) {
        Query query = new Query();
        if (q != null && !q.isBlank()) {
            String regex = ".*" + java.util.regex.Pattern.quote(q) + ".*";
            query.addCriteria(new Criteria().orOperator(
                    Criteria.where("name").regex(regex, "i"),
                    Criteria.where("email").regex(regex, "i")
            ));
        }
        long total = mongoTemplate.count(query, User.class);
        query.with(Sort.by(Sort.Direction.DESC, "createdAt"))
                .skip((long) (page - 1) * limit).limit(limit);
        List<User> items = mongoTemplate.find(query, User.class);
        return paged(items, total);
    }

    public Map<String, Object> listings(String q, Listing.Status status, int page, int limit) {
        Query query = new Query();
        if (status != null) query.addCriteria(Criteria.where("status").is(status));
        if (q != null && !q.isBlank()) {
            query.addCriteria(TextCriteria.forDefaultLanguage().matching(q));
        }
        long total = mongoTemplate.count(query, Listing.class);
        query.with(Sort.by(Sort.Direction.DESC, "createdAt"))
                .skip((long) (page - 1) * limit).limit(limit);
        List<Listing> items = mongoTemplate.find(query, Listing.class);
        return paged(items, total);
    }

    public Map<String, Object> reports(Report.Status status, int page, int limit) {
        var pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        var pageResult = status != null
                ? reportRepository.findByStatus(status, pageable)
                : reportRepository.findAll(pageable);
        return paged(pageResult.getContent(), pageResult.getTotalElements());
    }

    public Report updateReport(String id, ReportDtos.UpdateRequest req) {
        Report r = reportRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Report not found"));
        if (req.status() != null) r.setStatus(req.status());
        if (req.adminNote() != null) r.setAdminNote(req.adminNote());
        return reportRepository.save(r);
    }

    public User banUser(String id, AdminDtos.BanUserRequest req) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        u.setBanned(req.isBanned());
        u.setBanReason(req.reason());
        return userRepository.save(u);
    }

    private Map<String, Object> paged(List<?> items, long total) {
        Map<String, Object> out = new HashMap<>();
        out.put("items", items);
        out.put("total", total);
        return out;
    }
}
