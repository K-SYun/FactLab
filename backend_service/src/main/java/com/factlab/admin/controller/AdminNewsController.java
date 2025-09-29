package com.factlab.admin.controller;

import com.factlab.admin.dto.NewsApprovalDto;
import com.factlab.admin.service.AdminNewsService;
import com.factlab.common.dto.ApiResponse;
import com.factlab.news.entity.News;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/news")
public class AdminNewsController {

    private final AdminNewsService adminNewsService;

    @Autowired
    public AdminNewsController(AdminNewsService adminNewsService) {
        this.adminNewsService = adminNewsService;
    }

    @GetMapping("/pending")
    @Operation(summary = "승인 대기 뉴스 목록", description = "승인 대기 중인 뉴스 목록을 페이징하여 조회합니다")
    public ApiResponse<Page<News>> getPendingNews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<News> pendingNews = adminNewsService.getPendingNews(PageRequest.of(page, size));
            return ApiResponse.success(pendingNews);
        } catch (Exception e) {
            return ApiResponse.error("승인 대기 뉴스 조회 실패: " + e.getMessage());
        }
    }

    @GetMapping("/review-pending")
    @Operation(summary = "AI 분석 완료 뉴스 목록", description = "AI 분석이 완료되어 관리자 검토 대기 중인 뉴스 목록을 조회합니다")
    public ApiResponse<Page<News>> getReviewPendingNews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Page<News> reviewPendingNews = adminNewsService.getReviewPendingNews(PageRequest.of(page, size));
            return ApiResponse.success(reviewPendingNews);
        } catch (Exception e) {
            return ApiResponse.error("검토 대기 뉴스 조회 실패: " + e.getMessage());
        }
    }

    @PostMapping("/{newsId}/approve")
    @Operation(summary = "뉴스 승인", description = "선택된 뉴스를 승인합니다")
    public ApiResponse<String> approveNews(@PathVariable Integer newsId) {
        try {
            adminNewsService.approveNews(newsId);
            return ApiResponse.success("뉴스가 성공적으로 승인되었습니다");
        } catch (Exception e) {
            return ApiResponse.error("뉴스 승인 실패: " + e.getMessage());
        }
    }

    @PostMapping("/{newsId}/reject")
    @Operation(summary = "뉴스 거부", description = "선택된 뉴스를 거부합니다")
    public ApiResponse<String> rejectNews(@PathVariable Integer newsId, @RequestBody NewsApprovalDto reason) {
        try {
            adminNewsService.rejectNews(newsId, reason.getReason());
            return ApiResponse.success("뉴스가 거부되었습니다");
        } catch (Exception e) {
            return ApiResponse.error("뉴스 거부 실패: " + e.getMessage());
        }
    }

    @GetMapping("/statistics")
    @Operation(summary = "뉴스 통계", description = "뉴스 관련 통계 정보를 조회합니다")
    public ApiResponse<?> getNewsStatistics() {
        try {
            var statistics = adminNewsService.getNewsStatistics();
            return ApiResponse.success(statistics);
        } catch (Exception e) {
            return ApiResponse.error("뉴스 통계 조회 실패: " + e.getMessage());
        }
    }

    // @GetMapping("/sources")
    // @Operation(summary = "뉴스 소스 목록", description = "뉴스 소스별 통계를 조회합니다")
    // public ApiResponse<?> getNewsSources() {
    //     try {
    //         var sources = adminNewsService.getNewsSources();
    //         return ApiResponse.success(sources);
    //     } catch (Exception e) {
    //         return ApiResponse.error("뉴스 소스 조회 실패: " + e.getMessage());
    //     }
    // }

    @PostMapping("/{newsId}/ai-analysis")
    @Operation(summary = "AI 분석 결과 저장", description = "선택된 뉴스의 AI 분석 결과를 저장합니다")
    public ApiResponse<String> saveAIAnalysis(@PathVariable Integer newsId, @RequestBody AIAnalysisRequest request) {
        try {
            adminNewsService.saveAIAnalysis(newsId, request);
            return ApiResponse.success("AI 분석 결과가 성공적으로 저장되었습니다");
        } catch (Exception e) {
            return ApiResponse.error("AI 분석 결과 저장 실패: " + e.getMessage());
        }
    }

    @PostMapping("/{newsId}/toggle-visibility")
    @Operation(summary = "뉴스 공개/비공개 토글", description = "승인된 뉴스의 사용자 공개 상태를 변경합니다")
    public ApiResponse<String> toggleNewsVisibility(@PathVariable Integer newsId) {
        try {
            String newVisibility = adminNewsService.toggleNewsVisibility(newsId);
            return ApiResponse.success("뉴스 공개 상태가 " + (newVisibility.equals("PUBLIC") ? "공개" : "비공개") + "로 변경되었습니다");
        } catch (Exception e) {
            return ApiResponse.error("공개 상태 변경 실패: " + e.getMessage());
        }
    }

    @PostMapping("/analyze")
    @Operation(summary = "뉴스 AI 분석 실행", description = "선택된 뉴스에 대해 AI 분석을 실행합니다")
    public ApiResponse<String> analyzeNews(@RequestBody AnalyzeNewsRequest request) {
        try {
            adminNewsService.analyzeNews(request.getNewsId(), request.getAnalysisType());
            return ApiResponse.success("뉴스 ID " + request.getNewsId() + "에 대한 AI 분석이 시작되었습니다");
        } catch (Exception e) {
            return ApiResponse.error("AI 분석 실행 실패: " + e.getMessage());
        }
    }

    // DTO for AI Analysis Request
    public static class AIAnalysisRequest {
        private String aiSummary;
        private String aiAnalysisResult;
        private Integer reliabilityScore;
        private Integer confidenceScore;
        private String[] aiKeywords;

        // Getters and Setters
        public String getAiSummary() { return aiSummary; }
        public void setAiSummary(String aiSummary) { this.aiSummary = aiSummary; }

        public String getAiAnalysisResult() { return aiAnalysisResult; }
        public void setAiAnalysisResult(String aiAnalysisResult) { this.aiAnalysisResult = aiAnalysisResult; }

        public Integer getReliabilityScore() { return reliabilityScore; }
        public void setReliabilityScore(Integer reliabilityScore) { this.reliabilityScore = reliabilityScore; }

        public Integer getConfidenceScore() { return confidenceScore; }
        public void setConfidenceScore(Integer confidenceScore) { this.confidenceScore = confidenceScore; }

        public String[] getAiKeywords() { return aiKeywords; }
        public void setAiKeywords(String[] aiKeywords) { this.aiKeywords = aiKeywords; }
    }
}