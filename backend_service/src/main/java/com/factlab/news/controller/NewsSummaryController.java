package com.factlab.news.controller;
import com.factlab.common.dto.ApiResponse;
import com.factlab.news.dto.NewsSummaryDto;
import com.factlab.news.entity.NewsSummary;
import com.factlab.news.service.NewsSummaryService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/news-summary")
public class NewsSummaryController {

    private final NewsSummaryService newsSummaryService;

    @Autowired
    public NewsSummaryController(NewsSummaryService newsSummaryService) {
        this.newsSummaryService = newsSummaryService;
    }

    @GetMapping
    @Operation(summary = "AI 요약 작업 목록 조회", description = "모든 AI 요약 작업을 최신순으로 조회합니다.")
    public ApiResponse<List<NewsSummaryDto>> getAllSummaries(@RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "10") int size) {
        List<NewsSummaryDto> summaries = newsSummaryService.getAllSummaries(page, size);
        return ApiResponse.success(summaries);
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "상태별 AI 요약 작업 조회", description = "특정 상태의 AI 요약 작업을 조회합니다.")
    public ApiResponse<List<NewsSummaryDto>> getSummariesByStatus(@PathVariable String status,
                                                                @RequestParam(defaultValue = "0") int page,
                                                                @RequestParam(defaultValue = "10") int size) {
        try {
            NewsSummary.SummaryStatus summaryStatus = NewsSummary.SummaryStatus.valueOf(status.toUpperCase());
            List<NewsSummaryDto> summaries = newsSummaryService.getSummariesByStatus(summaryStatus, page, size);
            return ApiResponse.success(summaries);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("잘못된 상태값입니다: " + status);
        }
    }

    @GetMapping("/news/{newsId}")
    @Operation(summary = "뉴스별 AI 요약 조회", description = "특정 뉴스의 AI 요약을 조회합니다.")
    public ApiResponse<NewsSummaryDto> getSummaryByNewsId(@PathVariable Integer newsId) {
        Optional<NewsSummaryDto> summary = newsSummaryService.getSummaryByNewsId(newsId);
        if (summary.isPresent()) {
            return ApiResponse.success(summary.get());
        } else {
            return ApiResponse.error("해당 뉴스의 AI 요약을 찾을 수 없습니다.");
        }
    }

    @PostMapping("/create/{newsId}")
    @Operation(summary = "AI 요약 작업 생성", description = "특정 뉴스에 대한 AI 요약 작업을 생성합니다.")
    public ApiResponse<NewsSummaryDto> createSummary(@PathVariable Integer newsId) {
        try {
            NewsSummaryDto summary = newsSummaryService.createSummary(newsId);
            return ApiResponse.success(summary);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/{summaryId}/result")
    @Operation(summary = "AI 요약 결과 업데이트", description = "AI 요약 작업의 결과를 업데이트합니다.")
    public ApiResponse<NewsSummaryDto> updateSummaryResult(@PathVariable Integer summaryId,
                                                         @RequestBody UpdateSummaryRequest request) {
        try {
            NewsSummaryDto summary = newsSummaryService.updateSummaryResult(
                    summaryId, request.summary, request.claim, request.keywords,
                    request.autoQuestion, request.reliabilityScore, request.aiConfidence,
                    request.aiModel, request.processingTime);
            return ApiResponse.success(summary);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/{summaryId}/status")
    @Operation(summary = "AI 요약 작업 상태 업데이트", description = "AI 요약 작업의 상태를 업데이트합니다.")
    public ApiResponse<NewsSummaryDto> updateSummaryStatus(@PathVariable Integer summaryId,
                                                         @RequestBody UpdateStatusRequest request) {
        try {
            NewsSummary.SummaryStatus status = NewsSummary.SummaryStatus.valueOf(request.status.toUpperCase());
            NewsSummaryDto summary = newsSummaryService.updateSummaryStatus(summaryId, status, request.errorMessage);
            return ApiResponse.success(summary);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("잘못된 상태값입니다: " + request.status);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{summaryId}/retry")
    @Operation(summary = "AI 요약 작업 재시도", description = "실패한 AI 요약 작업을 재시도합니다.")
    public ApiResponse<NewsSummaryDto> retrySummary(@PathVariable Integer summaryId) {
        try {
            NewsSummaryDto summary = newsSummaryService.retrySummary(summaryId);
            return ApiResponse.success(summary);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/{summaryId}/edit")
    @Operation(summary = "AI 요약 결과 수동 수정", description = "AI 요약 결과를 수동으로 수정합니다.")
    public ApiResponse<NewsSummaryDto> editSummaryResult(@PathVariable Integer summaryId,
                                                       @RequestBody EditSummaryRequest request) {
        try {
            NewsSummaryDto summary = newsSummaryService.editSummaryResult(
                    summaryId, request.summary, request.claim, request.keywords,
                    request.autoQuestion, request.reliabilityScore);
            return ApiResponse.success(summary);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/batch/create")
    @Operation(summary = "일괄 AI 요약 작업 생성", description = "승인된 뉴스 중 요약이 없는 것들에 대해 일괄로 AI 요약 작업을 생성합니다.")
    public ApiResponse<List<NewsSummaryDto>> createBatchSummaries() {
        List<NewsSummaryDto> summaries = newsSummaryService.createBatchSummaries();
        return ApiResponse.success(summaries);
    }

    // ===== 관리자용 분석 타입별 API =====
    
    @PostMapping("/admin/analyze")
    @Operation(summary = "관리자용 AI 분석 실행", description = "관리자가 특정 뉴스에 대해 분석 타입을 지정하여 AI 분석을 실행합니다.")
    public ApiResponse<NewsSummaryDto> createAnalysis(@RequestBody AnalysisRequest request) {
        try {
            NewsSummary.AnalysisType analysisType = NewsSummary.AnalysisType.valueOf(request.analysisType.toUpperCase());
            NewsSummaryDto summary = newsSummaryService.createSummary(request.newsId, analysisType);
            return ApiResponse.success(summary, request.analysisType + " 분석 작업이 생성되었습니다.");
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("잘못된 분석 타입입니다: " + request.analysisType);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/admin/analyses/{newsId}")
    @Operation(summary = "뉴스별 모든 분석 조회", description = "특정 뉴스의 모든 분석 타입 결과를 조회합니다.")
    public ApiResponse<List<NewsSummaryDto>> getAnalysesByNewsId(@PathVariable Integer newsId) {
        List<NewsSummaryDto> analyses = newsSummaryService.getAllAnalysesByNewsId(newsId);
        return ApiResponse.success(analyses);
    }

    @GetMapping("/admin/by-type")
    @Operation(summary = "분석 타입별 조회", description = "특정 분석 타입의 결과만 조회합니다.")
    public ApiResponse<List<NewsSummaryDto>> getAnalysesByType(
            @RequestParam String analysisType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            NewsSummary.AnalysisType type = NewsSummary.AnalysisType.valueOf(analysisType.toUpperCase());
            List<NewsSummaryDto> analyses = newsSummaryService.getSummariesByAnalysisType(type, page, size);
            return ApiResponse.success(analyses);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("잘못된 분석 타입입니다: " + analysisType);
        }
    }

    @GetMapping("/admin/by-status-and-type")
    @Operation(summary = "상태와 분석 타입으로 조회", description = "상태와 분석 타입을 조합하여 조회합니다.")
    public ApiResponse<List<NewsSummaryDto>> getAnalysesByStatusAndType(
            @RequestParam String status,
            @RequestParam String analysisType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            NewsSummary.SummaryStatus summaryStatus = NewsSummary.SummaryStatus.valueOf(status.toUpperCase());
            NewsSummary.AnalysisType type = NewsSummary.AnalysisType.valueOf(analysisType.toUpperCase());
            List<NewsSummaryDto> analyses = newsSummaryService.getSummariesByStatusAndAnalysisType(summaryStatus, type, page, size);
            return ApiResponse.success(analyses);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("잘못된 상태 또는 분석 타입입니다.");
        }
    }

    @GetMapping("/statistics")
    @Operation(summary = "AI 요약 통계 조회", description = "AI 요약 작업의 통계 정보를 조회합니다.")
    public ApiResponse<NewsSummaryService.SummaryStatistics> getSummaryStatistics() {
        NewsSummaryService.SummaryStatistics statistics = newsSummaryService.getSummaryStatistics();
        return ApiResponse.success(statistics);
    }

    @GetMapping("/stuck")
    @Operation(summary = "타임아웃된 처리 중 작업 조회", description = "지정된 시간 이상 처리 중 상태인 작업을 조회합니다.")
    public ApiResponse<List<NewsSummaryDto>> getStuckProcessingTasks(@RequestParam(defaultValue = "30") int timeoutMinutes) {
        List<NewsSummaryDto> stuckTasks = newsSummaryService.getStuckProcessingTasks(timeoutMinutes);
        return ApiResponse.success(stuckTasks);
    }

    @GetMapping("/recent/completed")
    @Operation(summary = "최근 완료된 작업 조회", description = "최근 완료된 AI 요약 작업을 조회합니다.")
    public ApiResponse<List<NewsSummaryDto>> getRecentCompletedSummaries(@RequestParam(defaultValue = "10") int limit) {
        List<NewsSummaryDto> summaries = newsSummaryService.getRecentCompletedSummaries(limit);
        return ApiResponse.success(summaries);
    }

    // Request DTOs
    public static class AnalysisRequest {
        public Integer newsId;
        public String analysisType; // "COMPREHENSIVE", "FACT_ANALYSIS", "BIAS_ANALYSIS"
    }

    public static class UpdateSummaryRequest {
        public String summary;
        public String claim;
        public String keywords;
        public String autoQuestion;
        public Integer reliabilityScore;
        public Integer aiConfidence;
        public String aiModel;
        public Integer processingTime;
    }

    public static class UpdateStatusRequest {
        public String status;
        public String errorMessage;
    }

    public static class EditSummaryRequest {
        public String summary;
        public String claim;
        public String keywords;
        public String autoQuestion;
        public Integer reliabilityScore;
    }
}