package com.factlab.user.dto;

import com.factlab.user.entity.User.Gender;
import java.time.LocalDate;

public class UserProfileUpdateDto {
    
    private String nickname;
    private String intro;
    private Gender gender;
    private LocalDate birthDate;
    
    // Getters and Setters
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    
    public String getIntro() { return intro; }
    public void setIntro(String intro) { this.intro = intro; }
    
    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }
    
    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
}
