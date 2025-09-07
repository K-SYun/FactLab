package com.factlab.ai.service;

import com.factlab.news.entity.News;
import com.factlab.news.entity.NewsSummary;
import com.factlab.news.repository.NewsRepository;
import com.factlab.news.repository.NewsSummaryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class AIAnalysisService {

    @Value("${ai.service.url:http://ai-service:8001}")
    private String aiServiceUrl;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private NewsSummaryRepository newsSummaryRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 뉴스 분석 실행 - AI 서비스 호출 방식
     */
    public void analyzeNews(Integer newsId, String analysisType) {
        Optional<News> newsOpt = newsRepository.findById(newsId);
        if (!newsOpt.isPresent()) {
            throw new RuntimeException("뉴스를 찾을 수 없습니다: " + newsId);
        }

        News news = newsOpt.get();

        try {
            // 1. AI 서비스 호출
            long startTime = System.currentTimeMillis();
            JsonNode aiResponse = callAIService(newsId, analysisType);
            long processingTime = (System.currentTimeMillis() - startTime) / 1000;

            // 2. 응답 확인 및 처리
            if (aiResponse.path("success").asBoolean(false)) {
                // AI 서비스가 자동으로 DB에 저장하므로 추가 처리는 불필요
                System.out.println("AI 분석 완료: 뉴스ID=" + newsId + ", 타입=" + analysisType + 
                                 ", 처리시간=" + processingTime + "초");
            } else {
                throw new RuntimeException("AI 서비스 분석 실패: " + aiResponse.path("detail").asText("알 수 없는 오류"));
            }

        } catch (Exception e) {
            throw new RuntimeException("AI 분석 중 오류 발생: " + e.getMessage());
        }
    }

    /**
     * AI 서비스 호출
     */
    private JsonNode callAIService(Integer newsId, String analysisType) {
        try {
            // 요청 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> request = new HttpEntity<>(headers);

            // AI 서비스 API 호출
            String url = aiServiceUrl + "/analyze/news/" + newsId + "?analysis_type=" + analysisType;
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            // JSON 응답 파싱
            return objectMapper.readTree(response.getBody());

        } catch (Exception e) {
            throw new RuntimeException("AI 서비스 호출 실패: " + e.getMessage());
        }
    }

    /**
     * 뉴스 분석 상태 확인
     */
    public JsonNode getAnalysisStatus(Integer newsId) {
        try {
            String url = aiServiceUrl + "/analyze/status/" + newsId;
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("AI 분석 상태 확인 실패: " + e.getMessage());
        }
    }

    /**
     * 분석 타입 이름 반환 (로깅용)
     */
    public String getAnalysisTypeName(NewsSummary.AnalysisType analysisType) {
        switch (analysisType) {
            case COMPREHENSIVE: return "종합분석";
            case FACT_ANALYSIS: return "사실분석";
            case BIAS_ANALYSIS: return "편향성분석";
            default: return "일반분석";
        }
    }
}