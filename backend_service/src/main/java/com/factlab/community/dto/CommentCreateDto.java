package com.factlab.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CommentCreateDto {
    
    private Long postId; // 게시글 댓글인 경우 필수
    
    private Long newsId; // 뉴스 댓글인 경우 필수
    
    private Long parentCommentId; // 대댓글인 경우 부모 댓글 ID
    
    @NotBlank(message = "댓글 내용은 필수입니다.")
    @Size(min = 1, max = 1000, message = "댓글 내용은 1자 이상 1000자 이하여야 합니다.")
    private String content;
    
    
    private Boolean isAnonymous = false; // 익명 댓글 여부
    
    // Constructors
    public CommentCreateDto() {}
    
    public CommentCreateDto(Long postId, String content) {
        this.postId = postId;
        this.content = content;
    }
    
    public CommentCreateDto(Long postId, Long parentCommentId, String content) {
        this.postId = postId;
        this.parentCommentId = parentCommentId;
        this.content = content;
    }
    
    // Helper methods
    public boolean isReply() {
        return parentCommentId != null;
    }
    
    // Getters and Setters
    public Long getPostId() {
        return postId;
    }
    
    public void setPostId(Long postId) {
        this.postId = postId;
    }
    
    public Long getNewsId() {
        return newsId;
    }
    
    public void setNewsId(Long newsId) {
        this.newsId = newsId;
    }
    
    public Long getParentCommentId() {
        return parentCommentId;
    }
    
    public void setParentCommentId(Long parentCommentId) {
        this.parentCommentId = parentCommentId;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    
    public Boolean getIsAnonymous() {
        return isAnonymous;
    }
    
    public void setIsAnonymous(Boolean isAnonymous) {
        this.isAnonymous = isAnonymous;
    }
}