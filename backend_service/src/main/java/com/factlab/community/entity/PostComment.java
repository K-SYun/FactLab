package com.factlab.community.entity;

import com.factlab.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts_comments")
public class PostComment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private PostComment parentComment;
    
    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PostComment> replies = new ArrayList<>();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    
    @Column(nullable = false)
    private Integer depth = 0;
    
    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;
    
    @Column(name = "reply_count", nullable = false)
    private Integer replyCount = 0;
    
    @Column(name = "is_anonymous", nullable = false)
    private Boolean isAnonymous = false;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CommentStatus status = CommentStatus.ACTIVE;
    
    // IP 주소는 inet 타입 호환성 문제로 임시 비활성화
    // @Column(name = "ip_address")
    // private String ipAddress;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum CommentStatus {
        ACTIVE, HIDDEN, DELETED
    }
    
    // Constructors
    public PostComment() {}
    
    public PostComment(Post post, User user, String content, Integer depth) {
        this.post = post;
        this.user = user;
        this.content = content;
        this.depth = depth;
    }
    
    public PostComment(Post post, PostComment parentComment, User user, String content, Integer depth) {
        this.post = post;
        this.parentComment = parentComment;
        this.user = user;
        this.content = content;
        this.depth = depth;
    }
    
    // Business methods
    public boolean isReply() {
        return parentComment != null && depth > 0;
    }
    
    public boolean canReply() {
        return depth < 2; // 최대 3단계까지 (0: 댓글, 1: 대댓글, 2: 대댓글의 댓글)
    }
    
    public void addReply(PostComment reply) {
        replies.add(reply);
        reply.setParentComment(this);
        this.replyCount = replies.size();
    }
    
    public void incrementLikeCount() {
        this.likeCount++;
    }
    
    public void decrementLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Post getPost() {
        return post;
    }
    
    public void setPost(Post post) {
        this.post = post;
    }
    
    public PostComment getParentComment() {
        return parentComment;
    }
    
    public void setParentComment(PostComment parentComment) {
        this.parentComment = parentComment;
    }
    
    public List<PostComment> getReplies() {
        return replies;
    }
    
    public void setReplies(List<PostComment> replies) {
        this.replies = replies;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
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
    
    public CommentStatus getStatus() {
        return status;
    }
    
    public void setStatus(CommentStatus status) {
        this.status = status;
    }
    
    // IP 주소 관련 메서드 임시 비활성화
    // public String getIpAddress() {
    //     return ipAddress;
    // }
    // 
    // public void setIpAddress(String ipAddress) {
    //     this.ipAddress = ipAddress;
    // }
    
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