package com.factlab.community.dto;

import com.factlab.community.entity.Post;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class PostResponseDto {
    
    private Long id;
    private Long boardId;
    private String boardName;
    private String authorName;
    private String title;
    private String content;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private Boolean isNotice;
    private Boolean isAnonymous;
    private Boolean excludedFromBest;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CommentResponseDto> comments;
    
    // Constructors
    public PostResponseDto() {}
    
    public PostResponseDto(Post post) {
        this.id = post.getId();
        this.boardId = post.getBoard().getId();
        this.boardName = post.getBoard().getName();
        this.authorName = post.getDisplayAuthorName();
        this.title = post.getTitle();
        this.content = post.getContent();
        this.viewCount = post.getViewCount();
        this.likeCount = post.getLikeCount();
        this.commentCount = post.getCommentCount();
        this.isNotice = post.getIsNotice();
        this.isAnonymous = post.getIsAnonymous();
        this.excludedFromBest = post.getExcludedFromBest();
        this.status = post.getStatus().name();
        this.createdAt = post.getCreatedAt();
        this.updatedAt = post.getUpdatedAt();
    }
    
    public PostResponseDto(Post post, boolean includeComments) {
        this(post);
        if (includeComments && post.getComments() != null) {
            this.comments = post.getComments().stream()
                .filter(comment -> comment.getStatus() == com.factlab.community.entity.Comment.CommentStatus.ACTIVE)
                .filter(comment -> comment.getDepth() == 0) // 최상위 댓글만
                .map(comment -> new CommentResponseDto(comment, true))
                .collect(Collectors.toList());
        }
    }
    
    // For list view (summary)
    public PostResponseDto(Post post, boolean includeContent, boolean isListView) {
        this.id = post.getId();
        this.boardId = post.getBoard().getId();
        this.boardName = post.getBoard().getName();
        this.authorName = post.getDisplayAuthorName();
        this.title = post.getTitle();
        if (includeContent && !isListView) {
            this.content = post.getContent();
        } else if (isListView && post.getContent().length() > 100) {
            this.content = post.getContent().substring(0, 100) + "...";
        } else {
            this.content = post.getContent();
        }
        this.viewCount = post.getViewCount();
        this.likeCount = post.getLikeCount();
        this.commentCount = post.getCommentCount();
        this.isNotice = post.getIsNotice();
        this.isAnonymous = post.getIsAnonymous();
        this.excludedFromBest = post.getExcludedFromBest();
        this.status = post.getStatus().name();
        this.createdAt = post.getCreatedAt();
        this.updatedAt = post.getUpdatedAt();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getBoardId() {
        return boardId;
    }
    
    public void setBoardId(Long boardId) {
        this.boardId = boardId;
    }
    
    public String getBoardName() {
        return boardName;
    }
    
    public void setBoardName(String boardName) {
        this.boardName = boardName;
    }
    
    public String getAuthorName() {
        return authorName;
    }
    
    public void setAuthorName(String authorName) {
        this.authorName = authorName;
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
    
    public Integer getViewCount() {
        return viewCount;
    }
    
    public void setViewCount(Integer viewCount) {
        this.viewCount = viewCount;
    }
    
    public Integer getLikeCount() {
        return likeCount;
    }
    
    public void setLikeCount(Integer likeCount) {
        this.likeCount = likeCount;
    }
    
    public Integer getCommentCount() {
        return commentCount;
    }
    
    public void setCommentCount(Integer commentCount) {
        this.commentCount = commentCount;
    }
    
    public Boolean getIsNotice() {
        return isNotice;
    }
    
    public void setIsNotice(Boolean isNotice) {
        this.isNotice = isNotice;
    }
    
    public Boolean getIsAnonymous() {
        return isAnonymous;
    }
    
    public void setIsAnonymous(Boolean isAnonymous) {
        this.isAnonymous = isAnonymous;
    }
    
    public Boolean getExcludedFromBest() {
        return excludedFromBest;
    }
    
    public void setExcludedFromBest(Boolean excludedFromBest) {
        this.excludedFromBest = excludedFromBest;
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
    
    public List<CommentResponseDto> getComments() {
        return comments;
    }
    
    public void setComments(List<CommentResponseDto> comments) {
        this.comments = comments;
    }
}