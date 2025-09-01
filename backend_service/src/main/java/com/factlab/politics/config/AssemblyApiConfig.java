package com.factlab.politics.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "api.assembly")
@Getter
@Setter
public class AssemblyApiConfig {
    
    private String key;
    private String baseUrl;
    
    public String getBillInfoUrl() {
        return baseUrl + "/TVBPMBILL11";
    }
    
    public String getBillDetailUrl() {
        return baseUrl + "/TVBPMBILL12";
    }
}