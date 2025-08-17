package com.factlab.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "뉴스 승인/거부 DTO")
public class NewsApprovalDto {
    
    @Schema(description = "거부 사유")
    @NotBlank(message = "거부 사유는 필수입니다")
    private String reason;

    public NewsApprovalDto() {}

    public NewsApprovalDto(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}