package com.factlab.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

@Schema(description = "사용자 정지/차단 DTO")
public class UserSuspensionDto {
    
    @Schema(description = "정지/차단 사유")
    @NotBlank(message = "사유는 필수입니다")
    private String reason;
    
    @Schema(description = "정지 일수 (차단의 경우 무시됨)")
    @Positive(message = "정지 일수는 양수여야 합니다")
    private Integer days;

    public UserSuspensionDto() {}

    public UserSuspensionDto(String reason, Integer days) {
        this.reason = reason;
        this.days = days;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Integer getDays() {
        return days;
    }

    public void setDays(Integer days) {
        this.days = days;
    }
}