package com.factlab.admin.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "최근 활동 DTO")
public class RecentActivityDto {
    
    @Schema(description = "활동 제목")
    private String title;
    
    @Schema(description = "활동 설명")
    private String description;
    
    @Schema(description = "활동 타입 (INFO, SUCCESS, WARNING, ERROR)")
    private String type;
    
    @Schema(description = "활동 시간")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    public RecentActivityDto() {}

    public RecentActivityDto(String title, String description, String type, LocalDateTime timestamp) {
        this.title = title;
        this.description = description;
        this.type = type;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}