package com.factlab.admin.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "관리자 대시보드 통계 DTO")
public class DashboardStatsDto {
    
    @Schema(description = "전체 뉴스 수")
    private Long totalNews;
    
    @Schema(description = "오늘 수집된 뉴스 수")
    private Long todayNews;
    
    @Schema(description = "승인 대기 뉴스 수")
    private Long pendingNews;
    
    @Schema(description = "전체 사용자 수")
    private Long totalUsers;
    
    @Schema(description = "오늘 가입한 사용자 수")
    private Long todayUsers;
    
    @Schema(description = "활성 사용자 수")
    private Long activeUsers;
    
    @Schema(description = "전체 댓글 수")
    private Long totalComments;
    
    @Schema(description = "오늘 댓글 수")
    private Long todayComments;
    
    @Schema(description = "전체 투표 수")
    private Long totalVotes;
    
    @Schema(description = "시스템 업타임 (분)")
    private Long systemUptimeMinutes;
    
    @Schema(description = "통계 생성 시간")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    public DashboardStatsDto() {
        this.createdAt = LocalDateTime.now();
    }

    public DashboardStatsDto(Long totalNews, Long todayNews, Long pendingNews, 
                           Long totalUsers, Long todayUsers, Long activeUsers,
                           Long totalComments, Long todayComments, Long totalVotes,
                           Long systemUptimeMinutes) {
        this.totalNews = totalNews;
        this.todayNews = todayNews;
        this.pendingNews = pendingNews;
        this.totalUsers = totalUsers;
        this.todayUsers = todayUsers;
        this.activeUsers = activeUsers;
        this.totalComments = totalComments;
        this.todayComments = todayComments;
        this.totalVotes = totalVotes;
        this.systemUptimeMinutes = systemUptimeMinutes;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getTotalNews() { return totalNews; }
    public void setTotalNews(Long totalNews) { this.totalNews = totalNews; }

    public Long getTodayNews() { return todayNews; }
    public void setTodayNews(Long todayNews) { this.todayNews = todayNews; }

    public Long getPendingNews() { return pendingNews; }
    public void setPendingNews(Long pendingNews) { this.pendingNews = pendingNews; }

    public Long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(Long totalUsers) { this.totalUsers = totalUsers; }

    public Long getTodayUsers() { return todayUsers; }
    public void setTodayUsers(Long todayUsers) { this.todayUsers = todayUsers; }

    public Long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(Long activeUsers) { this.activeUsers = activeUsers; }

    public Long getTotalComments() { return totalComments; }
    public void setTotalComments(Long totalComments) { this.totalComments = totalComments; }

    public Long getTodayComments() { return todayComments; }
    public void setTodayComments(Long todayComments) { this.todayComments = todayComments; }

    public Long getTotalVotes() { return totalVotes; }
    public void setTotalVotes(Long totalVotes) { this.totalVotes = totalVotes; }

    public Long getSystemUptimeMinutes() { return systemUptimeMinutes; }
    public void setSystemUptimeMinutes(Long systemUptimeMinutes) { this.systemUptimeMinutes = systemUptimeMinutes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}