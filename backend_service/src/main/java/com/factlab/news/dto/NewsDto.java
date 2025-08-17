package com.factlab.news.dto;

import java.time.LocalDateTime;

public class NewsDto {
    private Integer id;
    private String title;
    private String content;
    private String url;
    private String source;
    private LocalDateTime publishDate; // 크롤링 시간
    private LocalDateTime originalPublishDate; // 실제 뉴스 발행 시간
    private String category;
    private String status;
    private LocalDateTime approvedAt;
    private String visibility;
    
    // AI 분석 관련 필드들
    private String aiSummary;
    private String aiAnalysisResult;
    private Integer reliabilityScore;
    private Integer confidenceScore;
    private String aiKeywords;
    private String suspiciousPoints;
    private String thumbnail;
    
    // 투표 통계 관련 필드들
    private Integer factCount;     // 사실(fact + partial_fact)
    private Integer doubtCount;    // 의심(slight_doubt + doubt)
    private Integer unknownCount;  // 모름
    private Integer totalVotes;    // 전체 투표 수

    public NewsDto() {}

    public NewsDto(Integer id, String title, String content, String url, String source, LocalDateTime publishDate, String category, String status, LocalDateTime approvedAt) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.url = url;
        this.source = source;
        this.publishDate = publishDate;
        this.category = category;
        this.status = status;
        this.approvedAt = approvedAt;
    }

    // 기존 생성자도 유지 (하위 호환성)
    public NewsDto(Integer id, String title, String content, String url, String source, LocalDateTime publishDate, String category, String status) {
        this(id, title, content, url, source, publishDate, category, status, null);
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public LocalDateTime getPublishDate() {
        return publishDate;
    }

    public void setPublishDate(LocalDateTime publishDate) {
        this.publishDate = publishDate;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    // AI 분석 관련 필드들의 Getters and Setters
    public String getAiSummary() {
        return aiSummary;
    }

    public void setAiSummary(String aiSummary) {
        this.aiSummary = aiSummary;
    }

    public String getAiAnalysisResult() {
        return aiAnalysisResult;
    }

    public void setAiAnalysisResult(String aiAnalysisResult) {
        this.aiAnalysisResult = aiAnalysisResult;
    }

    public Integer getReliabilityScore() {
        return reliabilityScore;
    }

    public void setReliabilityScore(Integer reliabilityScore) {
        this.reliabilityScore = reliabilityScore;
    }

    public Integer getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(Integer confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public String getAiKeywords() {
        return aiKeywords;
    }

    public void setAiKeywords(String aiKeywords) {
        this.aiKeywords = aiKeywords;
    }

    public String getThumbnail() {
        return thumbnail;
    }

    public void setThumbnail(String thumbnail) {
        this.thumbnail = thumbnail;
    }

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }

    public String getSuspiciousPoints() {
        return suspiciousPoints;
    }

    public void setSuspiciousPoints(String suspiciousPoints) {
        this.suspiciousPoints = suspiciousPoints;
    }

    // 투표 통계 관련 Getters and Setters
    public Integer getFactCount() {
        return factCount;
    }

    public void setFactCount(Integer factCount) {
        this.factCount = factCount;
    }

    public Integer getDoubtCount() {
        return doubtCount;
    }

    public void setDoubtCount(Integer doubtCount) {
        this.doubtCount = doubtCount;
    }

    public Integer getUnknownCount() {
        return unknownCount;
    }

    public void setUnknownCount(Integer unknownCount) {
        this.unknownCount = unknownCount;
    }

    public Integer getTotalVotes() {
        return totalVotes;
    }

    public void setTotalVotes(Integer totalVotes) {
        this.totalVotes = totalVotes;
    }

    public LocalDateTime getOriginalPublishDate() {
        return originalPublishDate;
    }

    public void setOriginalPublishDate(LocalDateTime originalPublishDate) {
        this.originalPublishDate = originalPublishDate;
    }
}