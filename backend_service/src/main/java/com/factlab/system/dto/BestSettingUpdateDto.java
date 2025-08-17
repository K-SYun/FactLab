package com.factlab.system.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class BestSettingUpdateDto {
    
    @NotNull(message = "최소 조회수는 필수입니다")
    @Min(value = 0, message = "최소 조회수는 0 이상이어야 합니다")
    private Integer minViewCount;
    
    @NotNull(message = "최소 추천수는 필수입니다")
    @Min(value = 0, message = "최소 추천수는 0 이상이어야 합니다")
    private Integer minLikeCount;
    
    // Constructors
    public BestSettingUpdateDto() {}
    
    public BestSettingUpdateDto(Integer minViewCount, Integer minLikeCount) {
        this.minViewCount = minViewCount;
        this.minLikeCount = minLikeCount;
    }
    
    // Getters and Setters
    public Integer getMinViewCount() {
        return minViewCount;
    }
    
    public void setMinViewCount(Integer minViewCount) {
        this.minViewCount = minViewCount;
    }
    
    public Integer getMinLikeCount() {
        return minLikeCount;
    }
    
    public void setMinLikeCount(Integer minLikeCount) {
        this.minLikeCount = minLikeCount;
    }
}