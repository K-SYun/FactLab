package com.factlab.news.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class VoteRequestDto {
    
    @NotBlank(message = "투표 유형은 필수입니다.")
    private String voteType;
    
    @NotNull(message = "사용자 ID는 필수입니다.")
    private Long userId;
    
    // Constructors
    public VoteRequestDto() {}
    
    public VoteRequestDto(String voteType, Long userId) {
        this.voteType = voteType;
        this.userId = userId;
    }
    
    // Getters and Setters
    public String getVoteType() {
        return voteType;
    }
    
    public void setVoteType(String voteType) {
        this.voteType = voteType;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
}