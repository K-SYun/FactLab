package com.factlab.news.service;

import com.factlab.news.dto.NewsSummaryDto;
import com.factlab.news.entity.News;
import com.factlab.news.entity.NewsSummary;
import com.factlab.news.repository.NewsRepository;
import com.factlab.news.repository.NewsSummaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class NewsSummaryService {

    @Autowired
    private NewsSummaryRepository newsSummaryRepository;

    @Autowired
    private NewsRepository newsRepository;

    // 모든 AI 요약 작업 조회 (페이징)
    public List<NewsSummaryDto> getAllSummaries(int page, int size) {
        return newsSummaryRepository.findAllOrderByCreatedAtDesc(page * size, size)
                .stream()
                .map(this::convertToDtoWithNewsInfo)
                .collect(Collectors.toList());
    }

    // 상태별 AI 요약 작업 조회
    public List<NewsSummaryDto> getSummariesByStatus(NewsSummary.SummaryStatus status, int page, int size) {
        return newsSummaryRepository.findByStatusOrderByCreatedAtDesc(status, page * size, size)
                .stream()
                .map(this::convertToDtoWithNewsInfo)
                .collect(Collectors.toList());
    }

    // 분석 타입별 AI 요약 작업 조회
    public List<NewsSummaryDto> getSummariesByAnalysisType(NewsSummary.AnalysisType analysisType, int page, int size) {
        return newsSummaryRepository.findByAnalysisTypeOrderByCreatedAtDesc(analysisType, page * size, size)
                .stream()
                .map(this::convertToDtoWithNewsInfo)
                .collect(Collectors.toList());
    }

    // 상태와 분석 타입으로 AI 요약 작업 조회
    public List<NewsSummaryDto> getSummariesByStatusAndAnalysisType(NewsSummary.SummaryStatus status, NewsSummary.AnalysisType analysisType, int page, int size) {
        return newsSummaryRepository.findByStatusAndAnalysisTypeOrderByCreatedAtDesc(status, analysisType, page * size, size)
                .stream()
                .map(this::convertToDtoWithNewsInfo)
                .collect(Collectors.toList());
    }

    // 특정 뉴스의 모든 분석 타입 조회
    public List<NewsSummaryDto> getAllAnalysesByNewsId(Integer newsId) {
        return newsSummaryRepository.findByNewsIdOrderByCreatedAtDesc(newsId)
                .stream()
                .map(this::convertToDtoWithNewsInfo)
                .collect(Collectors.toList());
    }

    // 특정 뉴스의 요약 조회
    public Optional<NewsSummaryDto> getSummaryByNewsId(Integer newsId) {
        return newsSummaryRepository.findSummaryByNewsId(newsId)
                .map(this::convertToDtoWithNewsInfo);
    }

    // AI 요약 작업 생성 (기본: 종합분석)
    public NewsSummaryDto createSummary(Integer newsId) {
        return createSummary(newsId, NewsSummary.AnalysisType.COMPREHENSIVE);
    }

    // AI 요약 작업 생성 (분석 타입 지정)
    public NewsSummaryDto createSummary(Integer newsId, NewsSummary.AnalysisType analysisType) {
        // 뉴스 존재 확인
        Optional<News> newsOpt = newsRepository.findById(newsId);
        if (!newsOpt.isPresent()) {
            throw new RuntimeException("뉴스를 찾을 수 없습니다: " + newsId);
        }

        // 같은 분석 타입이 이미 존재하는지 확인
        Optional<NewsSummary> existingSummary = newsSummaryRepository.findByNewsIdAndAnalysisType(newsId, analysisType);
        if (existingSummary.isPresent()) {
            throw new RuntimeException("이미 " + getAnalysisTypeName(analysisType) + " 분석이 존재합니다: " + newsId);
        }

        NewsSummary summary = new NewsSummary(newsId);
        summary.setAnalysisType(analysisType);
        summary.setStatus(NewsSummary.SummaryStatus.PENDING);
        summary = newsSummaryRepository.save(summary);

        return convertToDtoWithNewsInfo(summary);
    }

    // 분석 타입 이름 반환
    private String getAnalysisTypeName(NewsSummary.AnalysisType analysisType) {
        switch (analysisType) {
            case COMPREHENSIVE: return "종합";
            case FACT_ANALYSIS: return "사실";
            case BIAS_ANALYSIS: return "편향성";
            default: return "일반";
        }
    }

    // AI 요약 결과 업데이트
    public NewsSummaryDto updateSummaryResult(Integer summaryId, String summaryText, String claim, 
                                             String keywords, String autoQuestion, 
                                             Integer reliabilityScore, Integer aiConfidence, 
                                             String aiModel, Integer processingTime) {
        NewsSummary summary = newsSummaryRepository.findById(summaryId)
                .orElseThrow(() -> new RuntimeException("요약을 찾을 수 없습니다: " + summaryId));

        summary.setSummary(summaryText);
        summary.setClaim(claim);
        summary.setKeywords(keywords);
        summary.setAutoQuestion(autoQuestion);
        summary.setReliabilityScore(reliabilityScore);
        summary.setAiConfidence(aiConfidence);
        summary.setAiModel(aiModel);
        summary.setProcessingTime(processingTime);
        summary.setStatus(NewsSummary.SummaryStatus.COMPLETED);
        summary.setErrorMessage(null);

        summary = newsSummaryRepository.save(summary);
        return convertToDtoWithNewsInfo(summary);
    }

    // AI 요약 작업 상태 업데이트
    public NewsSummaryDto updateSummaryStatus(Integer summaryId, NewsSummary.SummaryStatus status, String errorMessage) {
        NewsSummary summary = newsSummaryRepository.findById(summaryId)
                .orElseThrow(() -> new RuntimeException("요약을 찾을 수 없습니다: " + summaryId));

        summary.setStatus(status);
        if (errorMessage != null) {
            summary.setErrorMessage(errorMessage);
        }

        summary = newsSummaryRepository.save(summary);
        return convertToDtoWithNewsInfo(summary);
    }

    // AI 요약 작업 재시도
    public NewsSummaryDto retrySummary(Integer summaryId) {
        NewsSummary summary = newsSummaryRepository.findById(summaryId)
                .orElseThrow(() -> new RuntimeException("요약을 찾을 수 없습니다: " + summaryId));

        summary.setStatus(NewsSummary.SummaryStatus.PENDING);
        summary.setErrorMessage(null);
        summary.setSummary(null);
        summary.setClaim(null);
        summary.setKeywords(null);
        summary.setAutoQuestion(null);
        summary.setReliabilityScore(null);
        summary.setAiConfidence(null);
        summary.setProcessingTime(null);

        summary = newsSummaryRepository.save(summary);
        return convertToDtoWithNewsInfo(summary);
    }

    // 수동 결과 수정
    public NewsSummaryDto editSummaryResult(Integer summaryId, String summaryText, String claim, 
                                           String keywords, String autoQuestion, Integer reliabilityScore) {
        NewsSummary summary = newsSummaryRepository.findById(summaryId)
                .orElseThrow(() -> new RuntimeException("요약을 찾을 수 없습니다: " + summaryId));

        if (summaryText != null) summary.setSummary(summaryText);
        if (claim != null) summary.setClaim(claim);
        if (keywords != null) summary.setKeywords(keywords);
        if (autoQuestion != null) summary.setAutoQuestion(autoQuestion);
        if (reliabilityScore != null) summary.setReliabilityScore(reliabilityScore);

        summary = newsSummaryRepository.save(summary);
        return convertToDtoWithNewsInfo(summary);
    }

    // 일괄 AI 요약 작업 생성 (승인된 뉴스 중 요약이 없는 것들)
    public List<NewsSummaryDto> createBatchSummaries() {
        List<News> approvedNews = newsRepository.findByStatusOrderByPublishDateDesc(News.NewsStatus.APPROVED);
        List<NewsSummary> results = approvedNews.stream()
                .filter(news -> !newsSummaryRepository.findSummaryByNewsId(news.getId()).isPresent())
                .map(news -> {
                    NewsSummary summary = new NewsSummary(news.getId());
                    summary.setStatus(NewsSummary.SummaryStatus.PENDING);
                    return newsSummaryRepository.save(summary);
                })
                .collect(Collectors.toList());

        return results.stream()
                .map(this::convertToDtoWithNewsInfo)
                .collect(Collectors.toList());
    }

    // 통계 조회
    public SummaryStatistics getSummaryStatistics() {
        long pendingCount = newsSummaryRepository.countByStatus(NewsSummary.SummaryStatus.PENDING);
        long processingCount = newsSummaryRepository.countByStatus(NewsSummary.SummaryStatus.PROCESSING);
        long completedCount = newsSummaryRepository.countByStatus(NewsSummary.SummaryStatus.COMPLETED);
        long failedCount = newsSummaryRepository.countByStatus(NewsSummary.SummaryStatus.FAILED);
        
        Double avgProcessingTime = newsSummaryRepository.getAverageProcessingTime();
        long highConfidenceCount = newsSummaryRepository.countByAiConfidenceGreaterThanEqual(80);

        return new SummaryStatistics(pendingCount, processingCount, completedCount, failedCount, 
                                   avgProcessingTime, highConfidenceCount);
    }

    // 통계 응답 클래스
    public static class SummaryStatistics {
        private final long pending;
        private final long processing;
        private final long completed;
        private final long failed;
        private final Double averageProcessingTime;
        private final long highConfidenceCount;

        public SummaryStatistics(long pending, long processing, long completed, long failed, 
                               Double averageProcessingTime, long highConfidenceCount) {
            this.pending = pending;
            this.processing = processing;
            this.completed = completed;
            this.failed = failed;
            this.averageProcessingTime = averageProcessingTime;
            this.highConfidenceCount = highConfidenceCount;
        }

        public long getPending() { return pending; }
        public long getProcessing() { return processing; }
        public long getCompleted() { return completed; }
        public long getFailed() { return failed; }
        public Double getAverageProcessingTime() { return averageProcessingTime; }
        public long getHighConfidenceCount() { return highConfidenceCount; }
    }

    // 오래된 처리 중 작업 확인 (타임아웃 체크)
    public List<NewsSummaryDto> getStuckProcessingTasks(int timeoutMinutes) {
        LocalDateTime timeoutThreshold = LocalDateTime.now().minusMinutes(timeoutMinutes);
        return newsSummaryRepository.findStuckProcessingTasks(timeoutThreshold)
                .stream()
                .map(this::convertToDtoWithNewsInfo)
                .collect(Collectors.toList());
    }

    // 최근 완료된 작업 조회
    public List<NewsSummaryDto> getRecentCompletedSummaries(int limit) {
        return newsSummaryRepository.findRecentCompletedSummaries(limit)
                .stream()
                .map(this::convertToDtoWithNewsInfo)
                .collect(Collectors.toList());
    }

    // Entity to DTO 변환 (뉴스 정보 포함)
    private NewsSummaryDto convertToDtoWithNewsInfo(NewsSummary summary) {
        NewsSummaryDto dto = convertToDto(summary);
        
        // 뉴스 정보 추가
        Optional<News> newsOpt = newsRepository.findById(summary.getNewsId());
        if (newsOpt.isPresent()) {
            News news = newsOpt.get();
            dto.setNewsTitle(news.getTitle());
            dto.setNewsCategory(news.getCategory());
            dto.setNewsSource(news.getSource());
        }
        
        return dto;
    }

    // Entity to DTO 변환
    private NewsSummaryDto convertToDto(NewsSummary summary) {
        return new NewsSummaryDto(
                summary.getId(),
                summary.getNewsId(),
                summary.getSummary(),
                summary.getClaim(),
                summary.getKeywords(),
                summary.getAutoQuestion(),
                summary.getReliabilityScore(),
                summary.getAiConfidence(),
                summary.getAnalysisType().toString().toLowerCase(),
                summary.getStatus().toString().toLowerCase(),
                summary.getAiModel(),
                summary.getProcessingTime(),
                summary.getErrorMessage(),
                summary.getCreatedAt(),
                summary.getUpdatedAt()
        );
    }
}