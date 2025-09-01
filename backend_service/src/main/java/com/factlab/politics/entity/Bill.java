package com.factlab.politics.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bills")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bill {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "bill_number", nullable = false, unique = true, length = 50)
    private String billNumber; // 의안번호
    
    @Column(nullable = false, length = 500)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String summary;
    
    @Column(name = "full_text", columnDefinition = "TEXT")
    private String fullText;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposer_id")
    private Politician proposer; // 대표발의자
    
    @Column(name = "proposer_name", length = 50)
    private String proposerName; // 대표발의자명 (캐싱용)
    
    @Column(name = "party_name", length = 100)
    private String partyName; // 정당명 (캐싱용)
    
    @Column(name = "proposal_date", nullable = false)
    private LocalDate proposalDate;
    
    @Column(nullable = false, length = 50)
    private String status; // 접수, 심사중, 소위심사, 법안소위, 본회의, 통과, 폐기 등
    
    @Column(nullable = false, length = 50)
    private String category; // 정치/행정, 경제/산업, 노동/복지, 교육/문화, 환경/에너지, 디지털/AI/데이터
    
    @Column(length = 100)
    private String committee; // 소관위원회
    
    @Column(length = 50)
    private String stage; // 심의단계
    
    @Column(name = "passage_probability", length = 20)
    private String passageProbability; // 통과가능성: HIGH, MEDIUM, LOW
    
    @Enumerated(EnumType.STRING)
    @Column(name = "urgency_level")
    private UrgencyLevel urgencyLevel = UrgencyLevel.NORMAL; // 긴급도
    
    @Column(name = "public_interest_score")
    private Integer publicInterestScore = 0; // 공공관심도 (0-100)
    
    @Column(name = "media_attention_score")
    private Integer mediaAttentionScore = 0; // 언론관심도 (0-100)
    
    @Column(name = "voting_for")
    private Integer votingFor = 0; // 찬성 투표수
    
    @Column(name = "voting_against")
    private Integer votingAgainst = 0; // 반대 투표수
    
    @Column(name = "view_count")
    private Integer viewCount = 0;
    
    @Column(name = "is_featured")
    private Boolean isFeatured = false; // 주요 법안 여부
    
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status")
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING; // 관리자 승인 상태

    @Enumerated(EnumType.STRING)
    @Column(name = "priority_category")
    private PriorityCategory priorityCategory; // 우선순위 카테고리
    
    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes; // 관리자 메모
    
    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary; // AI 요약
    
    @Column(name = "ai_impact_analysis", columnDefinition = "TEXT")
    private String aiImpactAnalysis; // AI 영향 분석
    
    @Column(name = "ai_keywords", length = 500)
    private String aiKeywords; // AI 추출 키워드
    
    @Column(name = "ai_reliability_score")
    private Integer aiReliabilityScore; // AI 신뢰도 점수 (0-100)
    
    @Column(name = "source_url", length = 500)
    private String sourceUrl; // 원본 URL
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum UrgencyLevel {
        URGENT, HIGH, NORMAL, LOW
    }
}