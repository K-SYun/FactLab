package com.factlab.auth.dto;

public class DuplicateCheckDto {
    
    private boolean available;
    private String message;
    
    // 기본 생성자
    public DuplicateCheckDto() {}
    
    // 생성자
    public DuplicateCheckDto(boolean available, String message) {
        this.available = available;
        this.message = message;
    }
    
    // 정적 팩토리 메서드
    public static DuplicateCheckDto available(String message) {
        return new DuplicateCheckDto(true, message);
    }
    
    public static DuplicateCheckDto unavailable(String message) {
        return new DuplicateCheckDto(false, message);
    }
    
    // Getters and Setters
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}