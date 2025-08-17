package com.factlab.ai.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_analysis_tasks")
public class AIAnalysisTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "content_id", nullable = false)
    private Integer contentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false)
    private ContentType contentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "analysis_type", nullable = false)
    private AnalysisType analysisType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status = TaskStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskPriority priority = TaskPriority.NORMAL;

    @Column(name = "ai_model", length = 100)
    private String aiModel;

    @Column(name = "processing_time_seconds")
    private Integer processingTimeSeconds;

    @Column(name = "retry_count")
    private Integer retryCount = 0;

    @Column(name = "max_retries")
    private Integer maxRetries = 3;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(columnDefinition = "TEXT")
    private String result;

    @Column(name = "confidence_score")
    private Integer confidenceScore;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // AI 작업 진행률 (0-100)
    @Column(name = "progress_percentage")
    private Integer progressPercentage = 0;

    // 작업 메타데이터 (JSON 형태)
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    // 작업 의존성 (다른 작업 완료 후 실행)
    @Column(name = "depends_on_task_id")
    private Integer dependsOnTaskId;

    public enum ContentType {
        NEWS, USER_COMMENT, COMMUNITY_POST, USER_PROFILE
    }

    public enum AnalysisType {
        SUMMARY,           // 요약 생성
        CLASSIFICATION,    // 카테고리 분류
        SENTIMENT,         // 감정 분석
        RELIABILITY,       // 신뢰도 분석
        KEYWORD_EXTRACTION, // 키워드 추출
        FACT_CHECK,        // 팩트체크
        TOXICITY_DETECTION, // 독성 콘텐츠 감지
        SPAM_DETECTION,    // 스팸 감지
        LANGUAGE_DETECTION, // 언어 감지
        TRANSLATION        // 번역
    }

    public enum TaskStatus {
        PENDING,      // 대기 중
        SCHEDULED,    // 스케줄됨
        PROCESSING,   // 처리 중
        COMPLETED,    // 완료
        FAILED,       // 실패
        CANCELLED,    // 취소됨
        RETRYING      // 재시도 중
    }

    public enum TaskPriority {
        LOW, NORMAL, HIGH, URGENT
    }

    // Constructors
    public AIAnalysisTask() {}

    public AIAnalysisTask(Integer contentId, ContentType contentType, AnalysisType analysisType) {
        this.contentId = contentId;
        this.contentType = contentType;
        this.analysisType = analysisType;
    }

    public AIAnalysisTask(Integer contentId, ContentType contentType, AnalysisType analysisType, TaskPriority priority) {
        this(contentId, contentType, analysisType);
        this.priority = priority;
    }

    // Status workflow methods
    public boolean canTransitionTo(TaskStatus newStatus) {
        switch (this.status) {
            case PENDING:
                return newStatus == TaskStatus.SCHEDULED || newStatus == TaskStatus.PROCESSING || 
                       newStatus == TaskStatus.CANCELLED;
            case SCHEDULED:
                return newStatus == TaskStatus.PROCESSING || newStatus == TaskStatus.CANCELLED;
            case PROCESSING:
                return newStatus == TaskStatus.COMPLETED || newStatus == TaskStatus.FAILED || 
                       newStatus == TaskStatus.CANCELLED;
            case FAILED:
                return newStatus == TaskStatus.RETRYING || newStatus == TaskStatus.CANCELLED;
            case RETRYING:
                return newStatus == TaskStatus.PROCESSING || newStatus == TaskStatus.FAILED || 
                       newStatus == TaskStatus.CANCELLED;
            case COMPLETED:
            case CANCELLED:
                return false; // Terminal states
            default:
                return false;
        }
    }

    public void updateStatus(TaskStatus newStatus) {
        if (!canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                String.format("Cannot transition from %s to %s", this.status, newStatus)
            );
        }
        
        this.status = newStatus;
        
        switch (newStatus) {
            case PROCESSING:
                this.startedAt = LocalDateTime.now();
                break;
            case COMPLETED:
            case FAILED:
            case CANCELLED:
                this.completedAt = LocalDateTime.now();
                if (this.startedAt != null) {
                    this.processingTimeSeconds = (int) java.time.Duration.between(
                        this.startedAt, this.completedAt
                    ).getSeconds();
                }
                break;
            case RETRYING:
                this.retryCount++;
                break;
            case PENDING:
            case SCHEDULED:
                // No specific actions needed for these states
                break;
        }
    }

    public boolean canRetry() {
        return this.status == TaskStatus.FAILED && this.retryCount < this.maxRetries;
    }

    public boolean isTerminalState() {
        return this.status == TaskStatus.COMPLETED || this.status == TaskStatus.CANCELLED;
    }

    public boolean isActive() {
        return this.status == TaskStatus.PROCESSING || this.status == TaskStatus.RETRYING;
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getContentId() { return contentId; }
    public void setContentId(Integer contentId) { this.contentId = contentId; }

    public ContentType getContentType() { return contentType; }
    public void setContentType(ContentType contentType) { this.contentType = contentType; }

    public AnalysisType getAnalysisType() { return analysisType; }
    public void setAnalysisType(AnalysisType analysisType) { this.analysisType = analysisType; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public TaskPriority getPriority() { return priority; }
    public void setPriority(TaskPriority priority) { this.priority = priority; }

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
}