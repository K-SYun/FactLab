package com.factlab.crawler.controller;

import com.factlab.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/crawler")
@Tag(name = "Crawler", description = "뉴스 크롤링 관련 API")
public class CrawlerController {

    private final RestTemplate restTemplate;
    private final String CRAWLER_SERVICE_URL = "http://crawler-ai-service:3002";

    public CrawlerController() {
        this.restTemplate = new RestTemplate();
    }

    @PostMapping("/crawl")
    @Operation(summary = "전체 뉴스 크롤링", description = "모든 카테고리의 뉴스를 크롤링합니다.")
    public ApiResponse<Map<String, Object>> crawlAllNews() {
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
                CRAWLER_SERVICE_URL + "/crawl/all", 
                null, 
                (Class<Map<String, Object>>) (Class<?>) Map.class
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("crawler_response", response.getBody());
            
            return ApiResponse.success(result);
            
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", e.getMessage());
            
            return ApiResponse.error("크롤링 실행 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @PostMapping("/crawl/{category}")
    @Operation(summary = "카테고리별 뉴스 크롤링", description = "특정 카테고리의 뉴스를 크롤링합니다.")
    public ApiResponse<Map<String, Object>> crawlCategoryNews(
            @PathVariable String category,
            @RequestParam(defaultValue = "20") int count) {
        try {
            String url = String.format("%s/crawl/news?category=%s", CRAWLER_SERVICE_URL, category);
            
            ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
                url, 
                null, 
                (Class<Map<String, Object>>) (Class<?>) Map.class
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("category", category);
            result.put("count", count);
            result.put("crawler_response", response.getBody());
            
            return ApiResponse.success(result);
            
        } catch (Exception e) {
            return ApiResponse.error("카테고리 뉴스 크롤링 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @DeleteMapping("/clear-data")
    @Operation(summary = "테스트 데이터 삭제", description = "모든 테스트 데이터를 삭제합니다.")
    public ApiResponse<Map<String, Object>> clearTestData() {
        try {
            restTemplate.delete(CRAWLER_SERVICE_URL + "/clear-data");
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "테스트 데이터가 성공적으로 삭제되었습니다.");
            
            return ApiResponse.success(result);
            
        } catch (Exception e) {
            return ApiResponse.error("테스트 데이터 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @GetMapping("/health")
    @Operation(summary = "크롤러 서비스 상태 확인", description = "크롤러 서비스의 상태를 확인합니다.")
    public ApiResponse<Map<String, Object>> checkCrawlerHealth() {
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.getForEntity(
                CRAWLER_SERVICE_URL + "/health", 
                (Class<Map<String, Object>>) (Class<?>) Map.class
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("crawler_status", "healthy");
            result.put("crawler_response", response.getBody());
            
            return ApiResponse.success(result);
            
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("crawler_status", "unhealthy");
            result.put("error", e.getMessage());
            
            return ApiResponse.error("크롤러 서비스에 연결할 수 없습니다: " + e.getMessage());
        }
    }
}