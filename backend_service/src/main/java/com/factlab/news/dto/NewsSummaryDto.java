package com.factlab.news.dto;

import java.time.LocalDateTime;

public class NewsSummaryDto {
    private Integer id;
    private Integer newsId;
    private String summary;
    private String claim;
    private String keywords;
    private String autoQuestion;
    private Integer reliabilityScore;
    private Integer aiConfidence;
    private String analysisType;
    private String status;
    private String aiModel;
    private Integer processingTime;
    private String errorMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 뉴스 정보 (조인된 데이터)
    private String newsTitle;
    private String newsCategory;
    private String newsSource;

    public NewsSummaryDto() {}

    public NewsSummaryDto(Integer id, Integer newsId, String summary, String claim, String keywords, 
                         String autoQuestion, Integer reliabilityScore, Integer aiConfidence, 
                         String analysisType, String status, String aiModel, Integer processingTime, 
                         String errorMessage, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.newsId = newsId;
        this.summary = summary;
        this.claim = claim;
        this.keywords = keywords;
        this.autoQuestion = autoQuestion;
        this.reliabilityScore = reliabilityScore;
        this.aiConfidence = aiConfidence;
        this.analysisType = analysisType;
        this.status = status;
        this.aiModel = aiModel;
        this.processingTime = processingTime;
        this.errorMessage = errorMessage;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // 뉴스 정보 포함 생성자
    public NewsSummaryDto(Integer id, Integer newsId, String summary, String claim, String keywords, 
                         String autoQuestion, Integer reliabilityScore, Integer aiConfidence, 
                         String analysisType, String status, String aiModel, Integer processingTime, 
                         String errorMessage, LocalDateTime createdAt, LocalDateTime updatedAt,
                         String newsTitle, String newsCategory, String newsSource) {
        this(id, newsId, summary, claim, keywords, autoQuestion, reliabilityScore, aiConfidence, 
             analysisType, status, aiModel, processingTime, errorMessage, createdAt, updatedAt);
        this.newsTitle = newsTitle;
        this.newsCategory = newsCategory;
        this.newsSource = newsSource;
    }

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getNewsId() {
        return newsId;
    }

    public void setNewsId(Integer newsId) {
        this.newsId = newsId;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getClaim() {
        return claim;
    }

    public void setClaim(String claim) {
        this.claim = claim;
    }

    public String getKeywords() {
        return keywords;
    }

    public void setKeywords(String keywords) {
        this.keywords = keywords;
    }

    public String getAutoQuestion() {
        return autoQuestion;
    }

    public void setAutoQuestion(String autoQuestion) {
        this.autoQuestion = autoQuestion;
    }

    public Integer getReliabilityScore() {
        return reliabilityScore;
    }

    public void setReliabilityScore(Integer reliabilityScore) {
        this.reliabilityScore = reliabilityScore;
    }

    public Integer getAiConfidence() {
        return aiConfidence;
    }

    public void setAiConfidence(Integer aiConfidence) {
        this.aiConfidence = aiConfidence;
    }

    public String getAnalysisType() {
        return analysisType;
    }

    public void setAnalysisType(String analysisType) {
        this.analysisType = analysisType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAiModel() {
        return aiModel;
    }

    public void setAiModel(String aiModel) {
        this.aiModel = aiModel;
    }

    public Integer getProcessingTime() {
        return processingTime;
    }

    public void setProcessingTime(Integer processingTime) {
        this.processingTime = processingTime;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getNewsTitle() {
        return newsTitle;
    }

    public void setNewsTitle(String newsTitle) {
        this.newsTitle = newsTitle;
    }

    public String getNewsCategory() {
        return newsCategory;
    }

    public void setNewsCategory(String newsCategory) {
        this.newsCategory = newsCategory;
    }

    public String getNewsSource() {
        return newsSource;
    }

    public void setNewsSource(String newsSource) {
        this.newsSource = newsSource;
    }
}