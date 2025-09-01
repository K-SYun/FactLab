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
@Table(name = "politicians")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Politician {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 50)
    private String name;
    
    @Column(name = "english_name", length = 100)
    private String englishName;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "party_id")
    private PoliticalParty party;
    
    @Column(length = 50)
    private String position; // 의원, 장관, 대통령 등
    
    @Column(name = "electoral_district", length = 100)
    private String electoralDistrict; // 선거구
    
    @Column(length = 100)
    private String committee; // 소속 위원회
    
    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;
    
    @Column(name = "birth_date")
    private LocalDate birthDate;
    
    @Column(columnDefinition = "TEXT")
    private String career;
    
    @Column(columnDefinition = "TEXT")
    private String education;
    
    @Column(length = 20)
    private String phone;
    
    @Column(length = 100)
    private String email;
    
    @Column(name = "office_address", columnDefinition = "TEXT")
    private String officeAddress;
    
    private String homepage;
    
    @Column(name = "sns_facebook")
    private String snsFacebook;
    
    @Column(name = "sns_twitter")
    private String snsTwitter;
    
    @Column(name = "sns_instagram")
    private String snsInstagram;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "term_start_date")
    private LocalDate termStartDate;
    
    @Column(name = "term_end_date")
    private LocalDate termEndDate;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}