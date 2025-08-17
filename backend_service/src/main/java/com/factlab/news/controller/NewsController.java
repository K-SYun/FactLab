package com.factlab.news.controller;

import com.factlab.common.dto.ApiResponse;
import com.factlab.news.dto.NewsDto;
import com.factlab.news.dto.TrendingKeywordDto;
import com.factlab.news.entity.News;
import com.factlab.news.service.NewsService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/news")
public class NewsController {

    private final NewsService newsService;

    @Autowired
    public NewsController(NewsService newsService) {
        this.newsService = newsService;
    }

    @GetMapping
    @Operation(summary = "전체 뉴스 조회", description = "모든 뉴스를 최신순으로 조회합니다. status 파라미터로 필터링 가능합니다.")
    public ApiResponse<List<NewsDto>> getAllNews(@RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int size,
                                               @RequestParam(required = false) String status) {
        List<NewsDto> news;
        
        if (status != null && !status.trim().isEmpty()) {
            // 상태 필터링이 요청된 경우
            news = newsService.getNewsByStatus(status, page, size);
        } else {
            // 기존 로직: 모든 뉴스 조회
            news = newsService.getAllNews(page, size);
        }
        
        return ApiResponse.success(news);
    }

    @GetMapping("/latest")
    @Operation(summary = "최신 뉴스 조회", description = "최신 뉴스를 지정된 개수만큼 조회합니다.")
    public ApiResponse<List<NewsDto>> getLatestNews(@RequestParam(defaultValue = "10") int limit) {
        List<NewsDto> news = newsService.getLatestNews(limit);
        return ApiResponse.success(news);
    }

    @GetMapping("/approved/latest")
    @Operation(summary = "승인된 최신 뉴스 조회", description = "승인된 최신 뉴스를 지정된 개수만큼 조회합니다.")
    public ApiResponse<List<NewsDto>> getLatestApprovedNews(@RequestParam(defaultValue = "10") int limit) {
        List<NewsDto> news = newsService.getLatestApprovedNews(limit);
        return ApiResponse.success(news);
    }

    @GetMapping("/approved")
    @Operation(summary = "승인된 뉴스 조회", description = "승인된 뉴스를 최신순으로 조회합니다.")
    public ApiResponse<List<NewsDto>> getApprovedNews(@RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size) {
        List<NewsDto> news = newsService.getApprovedNews(page, size);
        return ApiResponse.success(news);
    }

    @GetMapping("/approved/category/{category}")
    @Operation(summary = "승인된 카테고리별 뉴스 조회", description = "승인된 특정 카테고리의 뉴스를 조회합니다.")
    public ApiResponse<List<NewsDto>> getApprovedNewsByCategory(@PathVariable String category,
                                                              @RequestParam(defaultValue = "0") int page,
                                                              @RequestParam(defaultValue = "10") int size) {
        try {
            String decodedCategory = java.net.URLDecoder.decode(category, "UTF-8");
            List<NewsDto> news = newsService.getApprovedNewsByCategory(decodedCategory, page, size);
            return ApiResponse.success(news);
        } catch (java.io.UnsupportedEncodingException e) {
            List<NewsDto> news = newsService.getApprovedNewsByCategory(category, page, size);
            return ApiResponse.success(news);
        }
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "카테고리별 뉴스 조회", description = "특정 카테고리의 뉴스를 조회합니다.")
    public ApiResponse<List<NewsDto>> getNewsByCategory(@PathVariable String category,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "10") int size) {
        try {
            // URL 디코딩
            String decodedCategory = java.net.URLDecoder.decode(category, "UTF-8");
            List<NewsDto> news = newsService.getNewsByCategory(decodedCategory, page, size);
            return ApiResponse.success(news);
        } catch (java.io.UnsupportedEncodingException e) {
            List<NewsDto> news = newsService.getNewsByCategory(category, page, size);
            return ApiResponse.success(news);
        }
    }

    @GetMapping("/trending")
    @Operation(summary = "트렌딩 키워드 조회", description = "승인된 뉴스에서 가장 많이 언급된 키워드 상위 10개를 조회합니다.")
    public ApiResponse<List<TrendingKeywordDto>> getTrendingKeywords() {
        try {
            List<TrendingKeywordDto> keywords = newsService.getTrendingKeywords();
            return ApiResponse.success(keywords);
        } catch (Exception e) {
            return ApiResponse.error("트렌딩 키워드를 가져오는데 실패했습니다: " + e.getMessage());
        }
    }

    @GetMapping("/best")
    @Operation(summary = "베스트 뉴스 조회", description = "기간별 베스트 뉴스를 조회합니다.")
    public ApiResponse<List<NewsDto>> getBestNews(
            @RequestParam(defaultValue = "daily") String period,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<NewsDto> bestNews = newsService.getBestNewsByPeriod(period, limit);
            return ApiResponse.success(bestNews);
        } catch (Exception e) {
            return ApiResponse.error("베스트 뉴스를 가져오는데 실패했습니다: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "뉴스 상세 조회", description = "특정 뉴스의 상세 정보를 조회합니다.")
    public ApiResponse<NewsDto> getNewsById(@PathVariable Integer id) {
        Optional<NewsDto> news = newsService.getNewsById(id);
        if (news.isPresent()) {
            return ApiResponse.success(news.get());
        } else {
            return ApiResponse.error("뉴스를 찾을 수 없습니다.");
        }
    }

    @PutMapping("/{id}/approve")
    @Operation(summary = "뉴스 승인", description = "특정 뉴스를 승인 상태로 변경합니다.")
    public ApiResponse<NewsDto> approveNews(@PathVariable Integer id) {
        try {
            NewsDto updatedNews = newsService.updateNewsStatus(id, News.NewsStatus.APPROVED);
            return ApiResponse.success(updatedNews);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/{id}/reject")
    @Operation(summary = "뉴스 거부", description = "특정 뉴스를 거부 상태로 변경합니다.")
    public ApiResponse<NewsDto> rejectNews(@PathVariable Integer id) {
        try {
            NewsDto updatedNews = newsService.updateNewsStatus(id, News.NewsStatus.REJECTED);
            return ApiResponse.success(updatedNews);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/bulk/approve")
    @Operation(summary = "뉴스 일괄 승인", description = "여러 뉴스를 일괄로 승인합니다.")
    public ApiResponse<String> bulkApproveNews(@RequestBody BulkActionRequest request) {
        try {
            int updatedCount = newsService.bulkUpdateStatus(request.newsIds, News.NewsStatus.APPROVED);
            return ApiResponse.success(updatedCount + "개의 뉴스가 승인되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/bulk/reject")
    @Operation(summary = "뉴스 일괄 거부", description = "여러 뉴스를 일괄로 거부합니다.")
    public ApiResponse<String> bulkRejectNews(@RequestBody BulkActionRequest request) {
        try {
            int updatedCount = newsService.bulkUpdateStatus(request.newsIds, News.NewsStatus.REJECTED);
            return ApiResponse.success(updatedCount + "개의 뉴스가 거부되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/pending/approve-all")
    @Operation(summary = "대기 중인 모든 뉴스 승인", description = "대기 중인 모든 뉴스를 일괄 승인합니다.")
    public ApiResponse<String> approveAllPendingNews() {
        try {
            int updatedCount = newsService.approveAllPendingNews();
            return ApiResponse.success(updatedCount + "개의 뉴스가 승인되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    // AI 분석 완료 콜백 (크롤러 서비스에서 호출)
    @PostMapping("/{id}/analysis-complete")
    @Operation(summary = "AI 분석 완료 알림", description = "AI 분석이 완료되어 관리자 검토 대기 상태로 변경합니다.")
    public ApiResponse<NewsDto> markAnalysisComplete(@PathVariable Integer id) {
        try {
            // AI 분석이 완료되면 REVIEW_PENDING 상태로 변경 (관리자 검토 대기)
            NewsDto updatedNews = newsService.updateNewsStatus(id, News.NewsStatus.REVIEW_PENDING);
            return ApiResponse.success(updatedNews);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    // 뉴스 상태 직접 업데이트 (내부 API용)
    @PutMapping("/{id}/status")
    @Operation(summary = "뉴스 상태 업데이트", description = "뉴스 상태를 직접 업데이트합니다.")
    public ApiResponse<NewsDto> updateNewsStatus(
            @PathVariable Integer id,
            @RequestParam String status) {
        
        try {
            News.NewsStatus newsStatus = News.NewsStatus.valueOf(status.toUpperCase());
            NewsDto updatedNews = newsService.updateNewsStatus(id, newsStatus);
            return ApiResponse.success(updatedNews);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("유효하지 않은 상태값: " + status);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    // 뉴스 노출/미노출 토글
    @PutMapping("/{id}/visibility")
    @Operation(summary = "뉴스 노출/미노출 토글", description = "승인된 뉴스의 사용자 화면 노출 여부를 토글합니다.")
    public ApiResponse<NewsDto> toggleNewsVisibility(
            @PathVariable Integer id,
            @RequestParam boolean visible) {
        try {
            NewsDto updatedNews = newsService.updateNewsVisibility(id, visible);
            return ApiResponse.success(updatedNews);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    // 뉴스 삭제
    @DeleteMapping("/{id}")
    @Operation(summary = "뉴스 삭제", description = "특정 뉴스를 완전히 삭제합니다.")
    public ApiResponse<String> deleteNews(@PathVariable Integer id) {
        try {
            newsService.deleteNews(id);
            return ApiResponse.success("뉴스가 삭제되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    // 모든 뉴스 삭제 (테스트용)
    @DeleteMapping
    @Operation(summary = "모든 뉴스 삭제", description = "모든 뉴스를 삭제합니다. (테스트용)")
    public ApiResponse<String> deleteAllNews() {
        try {
            int deletedCount = newsService.deleteAllNews();
            return ApiResponse.success(deletedCount + "개의 뉴스가 삭제되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    // 디버그용: AI 분석 결과 직접 조회
    @GetMapping("/{id}/debug-summary")
    @Operation(summary = "AI 분석 결과 디버그 조회", description = "AI 분석 결과를 직접 조회합니다.")
    public ApiResponse<Object> getAISummaryDebug(@PathVariable Integer id) {
        try {
            // NewsSummary 직접 조회 테스트
            Optional<com.factlab.news.entity.NewsSummary> summary = 
                newsService.getNewsSummaryById(id);
            
            if (summary.isPresent()) {
                var s = summary.get();
                return ApiResponse.success(java.util.Map.of(
                    "found", true,
                    "newsId", s.getNewsId(),
                    "summary", s.getSummary(),
                    "claim", s.getClaim(),
                    "keywords", s.getKeywords(),
                    "reliabilityScore", s.getReliabilityScore(),
                    "aiConfidence", s.getAiConfidence(),
                    "status", s.getStatus()
                ));
            } else {
                return ApiResponse.success(java.util.Map.of("found", false));
            }
        } catch (Exception e) {
            return ApiResponse.error("Error: " + e.getMessage());
        }
    }

    // Request DTO
    public static class BulkActionRequest {
        public java.util.List<Integer> newsIds;
    }
}