package com.factlab.ai.dto;

import java.time.LocalDateTime;

public class AIAnalysisTaskDto {
    private Integer id;
    private Integer contentId;
    private String contentType;
    private String analysisType;
    private String status;
    private String priority;
    private String aiModel;
    private Integer processingTimeSeconds;
    private Integer retryCount;
    private Integer maxRetries;
    private String errorMessage;
    private String result;
    private Integer confidenceScore;
    private LocalDateTime scheduledAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer progressPercentage;
    private String metadata;
    private Integer dependsOnTaskId;

    // 추가 정보 (조인된 데이터)
    private String contentTitle;
    private String dependsOnTaskDescription;

    public AIAnalysisTaskDto() {}

    public AIAnalysisTaskDto(Integer id, Integer contentId, String contentType, String analysisType,
                            String status, String priority, String aiModel, Integer processingTimeSeconds,
                            Integer retryCount, Integer maxRetries, String errorMessage, String result,
                            Integer confidenceScore, LocalDateTime scheduledAt, LocalDateTime startedAt,
                            LocalDateTime completedAt, LocalDateTime createdAt, LocalDateTime updatedAt,
                            Integer progressPercentage, String metadata, Integer dependsOnTaskId) {
        this.id = id;
        this.contentId = contentId;
        this.contentType = contentType;
        this.analysisType = analysisType;
        this.status = status;
        this.priority = priority;
        this.aiModel = aiModel;
        this.processingTimeSeconds = processingTimeSeconds;
        this.retryCount = retryCount;
        this.maxRetries = maxRetries;
        this.errorMessage = errorMessage;
        this.result = result;
        this.confidenceScore = confidenceScore;
        this.scheduledAt = scheduledAt;
        this.startedAt = startedAt;
        this.completedAt = completedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.progressPercentage = progressPercentage;
        this.metadata = metadata;
        this.dependsOnTaskId = dependsOnTaskId;
    }

    // Utility methods
    public boolean isCompleted() {
        return "completed".equalsIgnoreCase(this.status);
    }

    public boolean isFailed() {
        return "failed".equalsIgnoreCase(this.status);
    }

    public boolean isProcessing() {
        return "processing".equalsIgnoreCase(this.status) || "retrying".equalsIgnoreCase(this.status);
    }

    public boolean isPending() {
        return "pending".equalsIgnoreCase(this.status) || "scheduled".equalsIgnoreCase(this.status);
    }

    public boolean canRetry() {
        return isFailed() && retryCount != null && maxRetries != null && retryCount < maxRetries;
    }

    public String getStatusDisplayName() {
        if (status == null) return "알 수 없음";
        switch (status.toLowerCase()) {
            case "pending": return "대기 중";
            case "scheduled": return "스케줄됨";
            case "processing": return "처리 중";
            case "completed": return "완료";
            case "failed": return "실패";
            case "cancelled": return "취소됨";
            case "retrying": return "재시도 중";
            default: return status;
        }
    }

    public String getPriorityDisplayName() {
        if (priority == null) return "보통";
        switch (priority.toLowerCase()) {
            case "low": return "낮음";
            case "normal": return "보통";
            case "high": return "높음";
            case "urgent": return "긴급";
            default: return priority;
        }
    }

    public String getAnalysisTypeDisplayName() {
        if (analysisType == null) return "알 수 없음";
        switch (analysisType.toLowerCase()) {
            case "summary": return "요약 생성";
            case "classification": return "카테고리 분류";
            case "sentiment": return "감정 분석";
            case "reliability": return "신뢰도 분석";
            case "keyword_extraction": return "키워드 추출";
            case "fact_check": return "팩트체크";
            case "toxicity_detection": return "독성 콘텐츠 감지";
            case "spam_detection": return "스팸 감지";
            case "language_detection": return "언어 감지";
            case "translation": return "번역";
            default: return analysisType;
        }
    }

    public String getContentTypeDisplayName() {
        if (contentType == null) return "알 수 없음";
        switch (contentType.toLowerCase()) {
            case "news": return "뉴스";
            case "user_comment": return "사용자 댓글";
            case "community_post": return "커뮤니티 게시글";
            case "user_profile": return "사용자 프로필";
            default: return contentType;
        }
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getContentId() { return contentId; }
    public void setContentId(Integer contentId) { this.contentId = contentId; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public String getAnalysisType() { return analysisType; }
    public void setAnalysisType(String analysisType) { this.analysisType = analysisType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getAiModel() { return aiModel; }
    public void setAiModel(String aiModel) { this.aiModel = aiModel; }

    public Integer getProcessingTimeSeconds() { return processingTimeSeconds; }
    public void setProcessingTimeSeconds(Integer processingTimeSeconds) { this.processingTimeSeconds = processingTimeSeconds; }

    public Integer getRetryCount() { return retryCount; }
    public void setRetryCount(Integer retryCount) { this.retryCount = retryCount; }

    public Integer getMaxRetries() { return maxRetries; }
    public void setMaxRetries(Integer maxRetries) { this.maxRetries = maxRetries; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public Integer getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Integer confidenceScore) { this.confidenceScore = confidenceScore; }

    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Integer getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public Integer getDependsOnTaskId() { return dependsOnTaskId; }
    public void setDependsOnTaskId(Integer dependsOnTaskId) { this.dependsOnTaskId = dependsOnTaskId; }

    public String getContentTitle() { return contentTitle; }
    public void setContentTitle(String contentTitle) { this.contentTitle = contentTitle; }

    public String getDependsOnTaskDescription() { return dependsOnTaskDescription; }
    public void setDependsOnTaskDescription(String dependsOnTaskDescription) { this.dependsOnTaskDescription = dependsOnTaskDescription; }
}