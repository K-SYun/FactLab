package com.factlab.news.dto;

public class TrendingKeywordDto {
    
    private String keyword;
    private Long count;
    
    public TrendingKeywordDto() {}
    
    public TrendingKeywordDto(String keyword, Long count) {
        this.keyword = keyword;
        this.count = count;
    }
    
    public String getKeyword() {
        return keyword;
    }
    
    public void setKeyword(String keyword) {
        this.keyword = keyword;
    }
    
    public Long getCount() {
        return count;
    }
    
    public void setCount(Long count) {
        this.count = count;
    }
}