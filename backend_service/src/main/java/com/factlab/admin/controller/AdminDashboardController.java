package com.factlab.admin.controller;

import com.factlab.admin.dto.DashboardStatsDto;
import com.factlab.admin.service.AdminDashboardService;
import com.factlab.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
// @CrossOrigin(origins = "*")  // nginx에서 CORS 처리하므로 비활성화
public class AdminDashboardController {

    @Autowired
    private AdminDashboardService dashboardService;

    @GetMapping("/stats")
    @Operation(summary = "대시보드 통계 조회", description = "관리자 대시보드의 주요 통계 정보를 조회합니다")
    public ApiResponse<DashboardStatsDto> getDashboardStats() {
        try {
            DashboardStatsDto stats = dashboardService.getDashboardStats();
            return ApiResponse.success(stats);
        } catch (Exception e) {
            return ApiResponse.error("대시보드 통계 조회 실패: " + e.getMessage());
        }
    }

    @GetMapping("/recent-activities")
    @Operation(summary = "최근 활동 조회", description = "최근 시스템 활동 내역을 조회합니다")
    public ApiResponse<?> getRecentActivities(@RequestParam(defaultValue = "10") int limit) {
        try {
            var activities = dashboardService.getRecentActivities(limit);
            return ApiResponse.success(activities);
        } catch (Exception e) {
            return ApiResponse.error("최근 활동 조회 실패: " + e.getMessage());
        }
    }

    @GetMapping("/news/pending")
    @Operation(summary = "승인 대기 뉴스 조회", description = "관리자 승인이 필요한 뉴스 목록을 조회합니다")
    public ApiResponse<?> getPendingNews(@RequestParam(defaultValue = "5") int limit) {
        try {
            var pendingNews = dashboardService.getPendingNews(limit);
            return ApiResponse.success(pendingNews);
        } catch (Exception e) {
            return ApiResponse.error("승인 대기 뉴스 조회 실패: " + e.getMessage());
        }
    }

    @GetMapping("/users/stats")
    @Operation(summary = "사용자 통계 조회", description = "사용자 관련 통계 정보를 조회합니다")
    public ApiResponse<?> getUserStats() {
        try {
            var userStats = dashboardService.getUserStats();
            return ApiResponse.success(userStats);
        } catch (Exception e) {
            return ApiResponse.error("사용자 통계 조회 실패: " + e.getMessage());
        }
    }
}