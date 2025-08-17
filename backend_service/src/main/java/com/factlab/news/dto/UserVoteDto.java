package com.factlab.news.dto;

import com.factlab.news.entity.NewsVote;

import java.time.LocalDateTime;

public class UserVoteDto {
    
    private Long id;
    private String voteType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public UserVoteDto() {}
    
    public UserVoteDto(NewsVote vote) {
        this.id = vote.getId();
        this.voteType = vote.getVoteType().getValue();
        this.createdAt = vote.getCreatedAt();
        this.updatedAt = vote.getUpdatedAt();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getVoteType() {
        return voteType;
    }
    
    public void setVoteType(String voteType) {
        this.voteType = voteType;
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
}