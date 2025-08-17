package com.factlab.news.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "news_summary")
public class NewsSummary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "news_id", nullable = false)
    private Integer newsId;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String claim;

    @Column(length = 500)
    private String keywords;

    @Column(name = "auto_question", columnDefinition = "TEXT")
    private String autoQuestion;

    @Column(name = "reliability_score")
    private Integer reliabilityScore;

    @Column(name = "ai_confidence")
    private Integer aiConfidence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SummaryStatus status = SummaryStatus.PENDING;

    @Column(name = "ai_model", length = 50)
    private String aiModel;

    @Column(name = "processing_time")
    private Integer processingTime; // in seconds

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "suspicious_points", columnDefinition = "TEXT")
    private String suspiciousPoints;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum SummaryStatus {
        PENDING, PROCESSING, COMPLETED, FAILED
    }

    public NewsSummary() {}

    public NewsSummary(Integer newsId) {
        this.newsId = newsId;
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

    public SummaryStatus getStatus() {
        return status;
    }

    public void setStatus(SummaryStatus status) {
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

    public String getSuspiciousPoints() {
        return suspiciousPoints;
    }

    public void setSuspiciousPoints(String suspiciousPoints) {
        this.suspiciousPoints = suspiciousPoints;
    }
}