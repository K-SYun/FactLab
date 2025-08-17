package com.factlab.news.entity;

import com.factlab.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "news_votes", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"news_id", "user_id"}))
public class NewsVote {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "news_id", nullable = false)
    private News news;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "vote_type", nullable = false, length = 20)
    private VoteType voteType;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum VoteType {
        FACT("fact"),
        PARTIAL_FACT("partial_fact"),
        SLIGHT_DOUBT("slight_doubt"),
        DOUBT("doubt"),
        UNKNOWN("unknown");
        
        private final String value;
        
        VoteType(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
        
        public static VoteType fromValue(String value) {
            for (VoteType type : VoteType.values()) {
                if (type.getValue().equals(value)) {
                    return type;
                }
            }
            throw new IllegalArgumentException("Unknown vote type: " + value);
        }
    }
    
    // Constructors
    public NewsVote() {}
    
    public NewsVote(News news, User user, VoteType voteType) {
        this.news = news;
        this.user = user;
        this.voteType = voteType;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public News getNews() {
        return news;
    }
    
    public void setNews(News news) {
        this.news = news;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public VoteType getVoteType() {
        return voteType;
    }
    
    public void setVoteType(VoteType voteType) {
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