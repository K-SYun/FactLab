package com.factlab.politics.dto;

import com.factlab.politics.entity.ApprovalStatus;
import com.factlab.politics.entity.Bill;
import com.factlab.politics.entity.PriorityCategory;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class BillResponseDto {
    
    private Long id;
    private String billNumber;
    private String title;
    private String summary;
    private String proposerName;
    private String partyName;
    private LocalDate proposalDate;
    private String status;
    private String category;
    private String committee;
    private String stage;
    private String passageProbability;
    private String urgencyLevel;
    private Integer publicInterestScore;
    private Integer mediaAttentionScore;
    private Integer votingFor;
    private Integer votingAgainst;
    private Integer viewCount;
    private Boolean isFeatured;
    private ApprovalStatus approvalStatus;
    private PriorityCategory priorityCategory;
    private String aiSummary;
    private String aiImpactAnalysis;
    private String aiKeywords;
    private Integer aiReliabilityScore;
    private String sourceUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 추가 필드 (계산된 값)
    private Integer totalVotes;
    private Double supportRate;
    private String controversyLevel;
    
    public BillResponseDto(Bill bill) {
        this.id = bill.getId();
        this.billNumber = bill.getBillNumber();
        this.title = bill.getTitle();
        this.summary = bill.getSummary();
        this.proposerName = bill.getProposerName();
        this.partyName = bill.getPartyName();
        this.proposalDate = bill.getProposalDate();
        this.status = bill.getStatus();
        this.category = bill.getCategory();
        this.committee = bill.getCommittee();
        this.stage = bill.getStage();
        this.passageProbability = bill.getPassageProbability();
        this.urgencyLevel = bill.getUrgencyLevel() != null ? bill.getUrgencyLevel().toString() : null;
        this.publicInterestScore = bill.getPublicInterestScore();
        this.mediaAttentionScore = bill.getMediaAttentionScore();
        this.votingFor = bill.getVotingFor();
        this.votingAgainst = bill.getVotingAgainst();
        this.viewCount = bill.getViewCount();
        this.isFeatured = bill.getIsFeatured();
        this.approvalStatus = bill.getApprovalStatus();
        this.priorityCategory = bill.getPriorityCategory();
        this.aiSummary = bill.getAiSummary();
        this.aiImpactAnalysis = bill.getAiImpactAnalysis();
        this.aiKeywords = bill.getAiKeywords();
        this.aiReliabilityScore = bill.getAiReliabilityScore();
        this.sourceUrl = bill.getSourceUrl();
        this.createdAt = bill.getCreatedAt();
        this.updatedAt = bill.getUpdatedAt();
        
        // 계산된 값
        this.totalVotes = (bill.getVotingFor() != null ? bill.getVotingFor() : 0) + 
                         (bill.getVotingAgainst() != null ? bill.getVotingAgainst() : 0);
        
        if (this.totalVotes > 0) {
            this.supportRate = (double) (bill.getVotingFor() != null ? bill.getVotingFor() : 0) / this.totalVotes * 100;
        } else {
            this.supportRate = 0.0;
        }
        
        // 논란도 계산 (찬반 비율이 비슷할수록 높음)
        if (this.totalVotes > 10) {
            double ratio = Math.abs(this.supportRate - 50.0);
            if (ratio < 10) {
                this.controversyLevel = "높음";
            } else if (ratio < 25) {
                this.controversyLevel = "보통";
            } else {
                this.controversyLevel = "낮음";
            }
        } else {
            this.controversyLevel = "미정";
        }
    }
}