package com.factlab.admin.service;

import com.factlab.admin.dto.DashboardStatsDto;
import com.factlab.admin.dto.RecentActivityDto;
import com.factlab.news.entity.News;
import com.factlab.news.entity.News.NewsStatus;
import com.factlab.news.repository.NewsRepository;
import com.factlab.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdminDashboardService {

    @Autowired
    private NewsRepository newsRepository;
    
    @Autowired
    private UserRepository userRepository;

    private final LocalDateTime systemStartTime = LocalDateTime.now().minusHours(24); // 임시로 24시간 전으로 설정

    public DashboardStatsDto getDashboardStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime activeThreshold = LocalDateTime.now().minusHours(24); // 24시간 내 활동한 사용자를 활성 사용자로 간주
        
        // 뉴스 통계
        Long totalNews = newsRepository.count();
        Long todayNews = newsRepository.countByCreatedAtAfter(todayStart);
        Long pendingNews = newsRepository.countByStatus(NewsStatus.PENDING);
        
        // 사용자 통계 - 실제 데이터 사용
        Long totalUsers = userRepository.count();
        Long todayUsers = userRepository.countByCreatedAtAfter(todayStart);
        Long activeUsers = userRepository.countActiveUsers(activeThreshold);
        
        // 댓글/투표 통계 (임시 데이터 - 향후 CommentRepository, VoteRepository 추가 필요)
        Long totalComments = 5670L;
        Long todayComments = 156L;
        Long totalVotes = 12450L;
        
        // 시스템 업타임
        Long systemUptimeMinutes = ChronoUnit.MINUTES.between(systemStartTime, LocalDateTime.now());
        
        return new DashboardStatsDto(
            totalNews, todayNews, pendingNews,
            totalUsers, todayUsers, activeUsers,
            totalComments, todayComments, totalVotes,
            systemUptimeMinutes
        );
    }

    public List<RecentActivityDto> getRecentActivities(int limit) {
        List<RecentActivityDto> activities = new ArrayList<>();
        
        // 임시 데이터
        activities.add(new RecentActivityDto("뉴스 수집", "네이버 뉴스에서 100건의 새 기사를 수집했습니다", "INFO", LocalDateTime.now().minusMinutes(5)));
        activities.add(new RecentActivityDto("사용자 가입", "새로운 사용자가 가입했습니다: user1234", "INFO", LocalDateTime.now().minusMinutes(15)));
        activities.add(new RecentActivityDto("AI 요약", "50건의 뉴스에 대한 AI 요약이 완료되었습니다", "SUCCESS", LocalDateTime.now().minusMinutes(30)));
        activities.add(new RecentActivityDto("시스템 경고", "API 응답 시간이 임계값을 초과했습니다", "WARNING", LocalDateTime.now().minusHours(1)));
        activities.add(new RecentActivityDto("백업 완료", "일일 데이터베이스 백업이 성공적으로 완료되었습니다", "SUCCESS", LocalDateTime.now().minusHours(2)));
        
        return activities.subList(0, Math.min(activities.size(), limit));
    }

    public List<News> getPendingNews(int limit) {
        // 실제로는 newsRepository.findByStatusOrderByCreatedAtDesc("PENDING", PageRequest.of(0, limit))
        // 임시로 빈 리스트 반환
        return new ArrayList<>();
    }

    public Object getUserStats() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime activeThreshold = LocalDateTime.now().minusHours(24);
        
        final Long totalUsersCount = userRepository.count();
        final Long activeUsersCount = userRepository.countActiveUsers(activeThreshold);
        final Long newUsersTodayCount = userRepository.countByCreatedAtAfter(todayStart);
        
        // 세션 통계는 향후 SessionRepository 추가 필요
        return new Object() {
            public final Long totalUsers = totalUsersCount;
            public final Long activeUsers = activeUsersCount;
            public final Long newUsersToday = newUsersTodayCount;
            public final Double averageSessionTime = 15.5; // 임시 데이터
            public final Long totalSessions = 3456L; // 임시 데이터
        };
    }
}