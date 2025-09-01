package com.factlab.politics.dto;

import com.factlab.politics.entity.ApprovalStatus;
import com.factlab.politics.entity.PriorityCategory;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BillCreateDto {
    
    @NotBlank(message = "법안번호는 필수입니다")
    @Size(max = 50, message = "법안번호는 50자 이내여야 합니다")
    private String billNumber;
    
    @NotBlank(message = "법안 제목은 필수입니다")
    @Size(max = 500, message = "법안 제목은 500자 이내여야 합니다")
    private String title;
    
    @Size(max = 2000, message = "법안 요약은 2000자 이내여야 합니다")
    private String summary;
    
    private String fullText;
    
    private Long proposerId; // 대표발의자 ID
    
    @Size(max = 50, message = "발의자명은 50자 이내여야 합니다")
    private String proposerName;
    
    @Size(max = 100, message = "정당명은 100자 이내여야 합니다")
    private String partyName;
    
    @NotNull(message = "발의일은 필수입니다")
    private LocalDate proposalDate;
    
    @NotBlank(message = "법안 상태는 필수입니다")
    @Size(max = 50, message = "법안 상태는 50자 이내여야 합니다")
    private String status;
    
    @NotBlank(message = "법안 카테고리는 필수입니다")
    @Pattern(regexp = "^(정치/행정|경제/산업|노동/복지|교육/문화|환경/에너지|디지털/AI/데이터)$", 
             message = "올바른 카테고리를 선택해주세요")
    private String category;
    
    @Size(max = 100, message = "소관위원회는 100자 이내여야 합니다")
    private String committee;
    
    @Size(max = 50, message = "심의단계는 50자 이내여야 합니다")
    private String stage;
    
    @Pattern(regexp = "^(HIGH|MEDIUM|LOW)$", message = "통과가능성은 HIGH, MEDIUM, LOW 중 하나여야 합니다")
    private String passageProbability;
    
    @Pattern(regexp = "^(URGENT|HIGH|NORMAL|LOW)$", message = "긴급도는 URGENT, HIGH, NORMAL, LOW 중 하나여야 합니다")
    private String urgencyLevel = "NORMAL";
    
    @Min(value = 0, message = "공공관심도는 0 이상이어야 합니다")
    @Max(value = 100, message = "공공관심도는 100 이하여야 합니다")
    private Integer publicInterestScore = 0;
    
    @Min(value = 0, message = "언론관심도는 0 이상이어야 합니다")
    @Max(value = 100, message = "언론관심도는 100 이하여야 합니다")
    private Integer mediaAttentionScore = 0;
    
    private Boolean isFeatured = false;
    
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;
    
    private PriorityCategory priorityCategory;
    
    private String adminNotes;
    
    @Size(max = 500, message = "원본 URL은 500자 이내여야 합니다")
    @Pattern(regexp = "^https?://.*", message = "올바른 URL 형식이어야 합니다")
    private String sourceUrl;
    
    // AI 분석 관련 필드 (선택사항)
    private String aiSummary;
    private String aiImpactAnalysis;
    private String aiKeywords;
    
    @Min(value = 0, message = "AI 신뢰도 점수는 0 이상이어야 합니다")
    @Max(value = 100, message = "AI 신뢰도 점수는 100 이하여야 합니다")
    private Integer aiReliabilityScore;
    
    // 공동발의자 ID 목록
    private List<Long> coProposerIds;
}
