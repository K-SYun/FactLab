package com.factlab.news.dto;

public class VoteResultDto {
    
    private Long fact = 0L;
    private Long partial_fact = 0L;
    private Long slight_doubt = 0L;
    private Long doubt = 0L;
    private Long unknown = 0L;
    private Long total = 0L;
    
    // Constructors
    public VoteResultDto() {}
    
    public VoteResultDto(Long fact, Long partial_fact, Long slight_doubt, Long doubt, Long unknown) {
        this.fact = fact;
        this.partial_fact = partial_fact;
        this.slight_doubt = slight_doubt;
        this.doubt = doubt;
        this.unknown = unknown;
        this.total = fact + partial_fact + slight_doubt + doubt + unknown;
    }
    
    // Getters and Setters
    public Long getFact() {
        return fact;
    }
    
    public void setFact(Long fact) {
        this.fact = fact;
        calculateTotal();
    }
    
    public Long getPartial_fact() {
        return partial_fact;
    }
    
    public void setPartial_fact(Long partial_fact) {
        this.partial_fact = partial_fact;
        calculateTotal();
    }
    
    public Long getSlight_doubt() {
        return slight_doubt;
    }
    
    public void setSlight_doubt(Long slight_doubt) {
        this.slight_doubt = slight_doubt;
        calculateTotal();
    }
    
    public Long getDoubt() {
        return doubt;
    }
    
    public void setDoubt(Long doubt) {
        this.doubt = doubt;
        calculateTotal();
    }
    
    public Long getUnknown() {
        return unknown;
    }
    
    public void setUnknown(Long unknown) {
        this.unknown = unknown;
        calculateTotal();
    }
    
    public Long getTotal() {
        return total;
    }
    
    public void setTotal(Long total) {
        this.total = total;
    }
    
    private void calculateTotal() {
        this.total = (fact != null ? fact : 0) + 
                    (partial_fact != null ? partial_fact : 0) + 
                    (slight_doubt != null ? slight_doubt : 0) + 
                    (doubt != null ? doubt : 0) + 
                    (unknown != null ? unknown : 0);
    }
}