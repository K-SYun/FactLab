package com.factlab.community.dto;

import com.factlab.community.entity.Comment;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class CommentResponseDto {
    
    private Long id;
    private Long postId;
    private Long newsId;
    private Long parentCommentId;
    private Long userId;
    private String authorName;
    private String content;
    private Integer depth;
    private Integer likeCount;
    private Integer replyCount;
    private Boolean isAnonymous;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CommentResponseDto> replies = new ArrayList<>();
    
    // Constructors
    public CommentResponseDto() {}
    
    public CommentResponseDto(Comment comment) {
        this.id = comment.getId();
        this.postId = comment.getPost() != null ? comment.getPost().getId() : null;
        this.newsId = comment.getNews() != null ? comment.getNews().getId().longValue() : null;
        this.parentCommentId = comment.getParentComment() != null ? comment.getParentComment().getId() : null;
        this.userId = comment.getUser() != null ? comment.getUser().getId() : null;
        this.authorName = comment.getIsAnonymous() ? "익명" : 
            (comment.getUser() != null ? comment.getUser().getNickname() : "알 수 없음");
        this.content = comment.getContent();
        this.depth = comment.getDepth();
        this.likeCount = comment.getLikeCount();
        this.replyCount = comment.getReplyCount();
        this.isAnonymous = comment.getIsAnonymous();
        this.status = comment.getStatus().name();
        this.createdAt = comment.getCreatedAt();
        this.updatedAt = comment.getUpdatedAt();
    }
    
    public CommentResponseDto(Comment comment, boolean includeReplies) {
        this(comment);
        if (includeReplies && comment.getReplies() != null) {
            for (Comment reply : comment.getReplies()) {
                if (reply.getStatus() == Comment.CommentStatus.ACTIVE) {
                    this.replies.add(new CommentResponseDto(reply, true));
                }
            }
        }
    }
    
    // Helper methods
    public boolean isReply() {
        return parentCommentId != null && depth > 0;
    }
    
    public boolean canReply() {
        return depth < 2;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
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
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getAuthorName() {
        return authorName;
    }
    
    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public Integer getDepth() {
        return depth;
    }
    
    public void setDepth(Integer depth) {
        this.depth = depth;
    }
    
    public Integer getLikeCount() {
        return likeCount;
    }
    
    public void setLikeCount(Integer likeCount) {
        this.likeCount = likeCount;
    }
    
    public Integer getReplyCount() {
        return replyCount;
    }
    
    public void setReplyCount(Integer replyCount) {
        this.replyCount = replyCount;
    }
    
    public Boolean getIsAnonymous() {
        return isAnonymous;
    }
    
    public void setIsAnonymous(Boolean isAnonymous) {
        this.isAnonymous = isAnonymous;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
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
    
    public List<CommentResponseDto> getReplies() {
        return replies;
    }
    
    public void setReplies(List<CommentResponseDto> replies) {
        this.replies = replies;
    }
}