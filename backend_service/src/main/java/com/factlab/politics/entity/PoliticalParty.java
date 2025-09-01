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
@Table(name = "political_parties")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PoliticalParty {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(name = "short_name", length = 20)
    private String shortName;
    
    @Column(name = "english_name", length = 100)
    private String englishName;
    
    @Column(length = 50)
    private String representative;
    
    @Column(name = "founding_date")
    private LocalDate foundingDate;
    
    @Column(name = "official_website")
    private String officialWebsite;
    
    @Column(name = "logo_url", length = 500)
    private String logoUrl;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(length = 100)
    private String ideology;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}