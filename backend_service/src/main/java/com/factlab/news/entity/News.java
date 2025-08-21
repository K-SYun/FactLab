package com.factlab.news.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "news")
public class News {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false, unique = true, length = 512)
    private String url;

    @Column(nullable = false, length = 100)
    private String source;

    @Column(name = "publish_date", nullable = false)
    private LocalDateTime publishDate; // 크롤링 시간 (시스템 등록 시간)
    
    @Column(name = "original_publish_date")
    private LocalDateTime originalPublishDate; // 실제 뉴스 발행 시간

    @Column(nullable = false, length = 50)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NewsStatus status = NewsStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "thumbnail", length = 500)
    private String thumbnail;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false)
    private NewsVisibility visibility = NewsVisibility.PUBLIC;

    // 메인 페이지 노출 관련 필드
    @Column(name = "main_featured", nullable = false)
    private Boolean mainFeatured = false;

    @Column(name = "main_display_order")
    private Integer mainDisplayOrder;

    @Column(name = "featured_at")
    private LocalDateTime featuredAt;

    // 조회수
    @Column(name = "view_count", nullable = false)
    private Integer viewCount = 0;

    // NewsSummary와의 관계 (AI 분석 결과)
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id", referencedColumnName = "news_id", insertable = false, updatable = false)
    private NewsSummary newsSummary;

    public enum NewsStatus {
        PENDING,        // 크롤링 완료, AI 분석 대기
        PROCESSING,     // AI 분석 중
        REVIEW_PENDING, // AI 분석 완료, 관리자 검토 대기  
        APPROVED,       // 관리자 승인 완료
        REJECTED        // 관리자 거부
    }

    public enum NewsVisibility {
        PUBLIC,         // 사용자에게 공개
        PRIVATE         // 사용자에게 비공개
    }

    public News() {}

    public News(String title, String content, String url, String source, LocalDateTime publishDate, String category) {
        this.title = title;
        this.content = content;
        this.url = url;
        this.source = source;
        this.publishDate = publishDate;
        this.category = category;
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

    public NewsStatus getStatus() {
        return status;
    }

    public void setStatus(NewsStatus status) {
        this.status = status;
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

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public String getThumbnail() {
        return thumbnail;
    }

    public void setThumbnail(String thumbnail) {
        this.thumbnail = thumbnail;
    }

    public NewsVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(NewsVisibility visibility) {
        this.visibility = visibility;
    }

    public LocalDateTime getOriginalPublishDate() {
        return originalPublishDate;
    }

    public void setOriginalPublishDate(LocalDateTime originalPublishDate) {
        this.originalPublishDate = originalPublishDate;
    }

    // AI 관련 getter/setter는 제거 - NewsSummary 엔티티에서 관리

    public NewsSummary getNewsSummary() {
        return newsSummary;
    }

    public void setNewsSummary(NewsSummary newsSummary) {
        this.newsSummary = newsSummary;
    }

    public Boolean getMainFeatured() {
        return mainFeatured;
    }

    public void setMainFeatured(Boolean mainFeatured) {
        this.mainFeatured = mainFeatured;
    }

    public Integer getMainDisplayOrder() {
        return mainDisplayOrder;
    }

    public void setMainDisplayOrder(Integer mainDisplayOrder) {
        this.mainDisplayOrder = mainDisplayOrder;
    }

    public LocalDateTime getFeaturedAt() {
        return featuredAt;
    }

    public void setFeaturedAt(LocalDateTime featuredAt) {
        this.featuredAt = featuredAt;
    }

    public Integer getViewCount() {
        return viewCount;
    }

    public void setViewCount(Integer viewCount) {
        this.viewCount = viewCount;
    }

    public void incrementViewCount() {
        this.viewCount = (this.viewCount == null) ? 1 : this.viewCount + 1;
    }
}