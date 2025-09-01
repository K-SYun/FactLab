package com.factlab.politics.dto;

import com.factlab.politics.entity.Politician;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class PoliticianResponseDto {
    
    private Long id;
    private String name;
    private String englishName;
    private String partyName;
    private String position;
    private String electoralDistrict;
    private String committee;
    private String profileImageUrl;
    private LocalDate birthDate;
    private String career;
    private String education;
    private String phone;
    private String email;
    private String officeAddress;
    private String homepage;
    private String snsFacebook;
    private String snsTwitter;
    private String snsInstagram;
    private Boolean isActive;
    private LocalDate termStartDate;
    private LocalDate termEndDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 추가 정보 (통계)
    private Integer proposedBillsCount;  // 발의 법안 수
    private Integer passedBillsCount;    // 통과된 법안 수
    private Boolean isCurrentTerm;       // 현직 여부
    
    public PoliticianResponseDto(Politician politician) {
        this.id = politician.getId();
        this.name = politician.getName();
        this.englishName = politician.getEnglishName();
        this.partyName = politician.getParty() != null ? politician.getParty().getName() : null;
        this.position = politician.getPosition();
        this.electoralDistrict = politician.getElectoralDistrict();
        this.committee = politician.getCommittee();
        this.profileImageUrl = politician.getProfileImageUrl();
        this.birthDate = politician.getBirthDate();
        this.career = politician.getCareer();
        this.education = politician.getEducation();
        this.phone = politician.getPhone();
        this.email = politician.getEmail();
        this.officeAddress = politician.getOfficeAddress();
        this.homepage = politician.getHomepage();
        this.snsFacebook = politician.getSnsFacebook();
        this.snsTwitter = politician.getSnsTwitter();
        this.snsInstagram = politician.getSnsInstagram();
        this.isActive = politician.getIsActive();
        this.termStartDate = politician.getTermStartDate();
        this.termEndDate = politician.getTermEndDate();
        this.createdAt = politician.getCreatedAt();
        this.updatedAt = politician.getUpdatedAt();
        
        // 현직 여부 계산
        LocalDate now = LocalDate.now();
        if (politician.getTermStartDate() != null && politician.getTermEndDate() != null) {
            this.isCurrentTerm = !now.isBefore(politician.getTermStartDate()) && 
                               !now.isAfter(politician.getTermEndDate());
        } else if (politician.getTermStartDate() != null) {
            this.isCurrentTerm = !now.isBefore(politician.getTermStartDate());
        } else {
            this.isCurrentTerm = politician.getIsActive();
        }
        
        // 통계는 Service에서 설정
        this.proposedBillsCount = 0;
        this.passedBillsCount = 0;
    }
}