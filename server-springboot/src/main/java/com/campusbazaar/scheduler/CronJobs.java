package com.campusbazaar.scheduler;

import com.campusbazaar.config.AppProperties;
import com.campusbazaar.model.Listing;
import com.campusbazaar.model.Report;
import com.campusbazaar.model.User;
import com.campusbazaar.repository.ListingRepository;
import com.campusbazaar.repository.ReportRepository;
import com.campusbazaar.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class CronJobs {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final MongoTemplate mongoTemplate;
    private final AppProperties props;

    /** Daily at midnight: expire active listings older than 30 days. */
    @Scheduled(cron = "0 0 0 * * *")
    public void expireOldListings() {
        Instant cutoff = Instant.now().minus(Duration.ofDays(30));
        var result = mongoTemplate.updateMulti(
                new Query(Criteria.where("status").is(Listing.Status.active).and("createdAt").lt(cutoff)),
                new Update().set("status", Listing.Status.expired),
                Listing.class);
        log.info("[cron] expired {} listings older than 30 days", result.getModifiedCount());
    }

    /** Daily at midnight: soft-delete users inactive for 180 days. */
    @Scheduled(cron = "0 0 0 * * *")
    public void softDeleteInactiveUsers() {
        Instant cutoff = Instant.now().minus(Duration.ofDays(180));
        var result = mongoTemplate.updateMulti(
                new Query(Criteria.where("lastActiveAt").lt(cutoff).and("isDeleted").is(false)),
                new Update().set("isDeleted", true).set("deletedAt", Instant.now()),
                User.class);
        log.info("[cron] soft-deleted {} inactive users", result.getModifiedCount());
    }

    /** Hourly: delete unverified signup accounts older than 15 minutes. */
    @Scheduled(cron = "0 0 * * * *")
    public void purgeUnverifiedSignups() {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(15));
        List<User> stale = userRepository.findByIsVerifiedFalseAndCreatedAtBefore(cutoff);
        if (!stale.isEmpty()) {
            userRepository.deleteAll(stale);
            log.info("[cron] purged {} unverified signup accounts", stale.size());
        }
    }

    /** Daily at midnight: auto-ban users whose report count crosses threshold. */
    @Scheduled(cron = "0 0 0 * * *")
    public void autoBanFromReports() {
        int threshold = props.getReports().getAutoBanThreshold();
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("targetType").is(Report.TargetType.user)),
                Aggregation.group("targetId").count().as("count"),
                Aggregation.match(Criteria.where("count").gte(threshold))
        );
        AggregationResults<Map> results = mongoTemplate.aggregate(agg, "reports", Map.class);
        for (Map row : results.getMappedResults()) {
            String userId = String.valueOf(row.get("_id"));
            int count = ((Number) row.get("count")).intValue();
            mongoTemplate.updateFirst(
                    new Query(Criteria.where("_id").is(userId).and("isBanned").is(false)),
                    new Update().set("isBanned", true)
                            .set("banReason", "Auto-banned: " + count + " reports")
                            .set("reportCount", count),
                    User.class);
        }
    }
}
