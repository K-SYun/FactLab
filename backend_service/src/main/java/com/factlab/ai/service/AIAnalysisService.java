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

    @Value("${gemini.api.key:your-gemini-api-key}")
    private String geminiApiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent}")
    private String geminiApiUrl;

    @Autowired
    private AIPromptService promptService;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private NewsSummaryRepository newsSummaryRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 뉴스 분석 실행
     */
    public void analyzeNews(Integer summaryId) {
        Optional<NewsSummary> summaryOpt = newsSummaryRepository.findById(summaryId);
        if (!summaryOpt.isPresent()) {
            throw new RuntimeException("요약을 찾을 수 없습니다: " + summaryId);
        }

        NewsSummary summary = summaryOpt.get();
        Optional<News> newsOpt = newsRepository.findById(summary.getNewsId());
        if (!newsOpt.isPresent()) {
            throw new RuntimeException("뉴스를 찾을 수 없습니다: " + summary.getNewsId());
        }

        News news = newsOpt.get();

        try {
            // 1. 상태를 처리중으로 변경
            summary.setStatus(NewsSummary.SummaryStatus.PROCESSING);
            newsSummaryRepository.save(summary);

            // 2. 분석 타입에 맞는 프롬프트 생성
            AIPromptService.PromptMessages promptMessages = promptService.buildPromptMessages(
                    summary.getAnalysisType(),
                    news.getTitle(),
                    news.getContent(),
                    news.getSource()
            );

            // 3. Gemini API 호출
            long startTime = System.currentTimeMillis();
            String aiResponse = callGeminiAPI(promptMessages.getCombinedPrompt());
            long processingTime = (System.currentTimeMillis() - startTime) / 1000;

            // 4. 응답 파싱 및 저장
            parseAndSaveResponse(summary, aiResponse, (int) processingTime);

        } catch (Exception e) {
            // 오류 발생 시 상태 변경
            summary.setStatus(NewsSummary.SummaryStatus.FAILED);
            summary.setErrorMessage(e.getMessage());
            newsSummaryRepository.save(summary);
            throw new RuntimeException("AI 분석 중 오류 발생: " + e.getMessage());
        }
    }

    /**
     * Gemini API 호출
     */
    private String callGeminiAPI(String prompt) {
        try {
            // 요청 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // 요청 바디 생성
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> contents = new HashMap<>();
            Map<String, Object> parts = new HashMap<>();
            parts.put("text", prompt);
            contents.put("parts", new Object[]{parts});
            requestBody.put("contents", new Object[]{contents});

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            // API 호출
            String url = geminiApiUrl + "?key=" + geminiApiKey;
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            // 응답에서 텍스트 추출
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            return responseJson.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

        } catch (Exception e) {
            throw new RuntimeException("Gemini API 호출 실패: " + e.getMessage());
        }
    }

    /**
     * AI 응답을 파싱하고 데이터베이스에 저장
     */
    private void parseAndSaveResponse(NewsSummary summary, String aiResponse, int processingTime) {
        try {
            // JSON 응답 파싱 시도
            JsonNode responseJson = objectMapper.readTree(aiResponse);

            // 공통 필드 저장
            summary.setSummary(responseJson.path("summary").asText());
            summary.setClaim(responseJson.path("claim").asText());
            summary.setKeywords(responseJson.path("keywords").asText());
            summary.setAutoQuestion(responseJson.path("auto_question").asText());

            // 분석 타입별 특화 필드 저장
            switch (summary.getAnalysisType()) {
                case COMPREHENSIVE:
                    summary.setReliabilityScore(responseJson.path("reliability_score").asInt(50));
                    summary.setSuspiciousPoints(responseJson.path("suspicious_points").asText());
                    summary.setAiConfidence(85); // 종합분석은 기본 신뢰도 높게
                    break;

                case FACT_ANALYSIS:
                    summary.setReliabilityScore(responseJson.path("reliability_score").asInt(50));
                    summary.setSuspiciousPoints(responseJson.path("suspicious_points").asText());
                    // 팩트체크는 더 세밀한 신뢰도 계산
                    summary.setAiConfidence(calculateFactCheckConfidence(responseJson));
                    break;

                case BIAS_ANALYSIS:
                    // 편향성 분석은 reliability_score를 역산 (편향성이 낮을수록 신뢰도 높음)
                    int biasScore = responseJson.path("bias_score").asInt(50);
                    summary.setReliabilityScore(Math.max(0, 100 - biasScore));
                    summary.setSuspiciousPoints(responseJson.path("bias_indicators").asText());
                    summary.setAiConfidence(75); // 편향성 분석은 중간 신뢰도
                    break;
            }

            // 메타데이터 저장
            summary.setAiModel("gemini-pro");
            summary.setProcessingTime(processingTime);
            summary.setStatus(NewsSummary.SummaryStatus.COMPLETED);
            summary.setErrorMessage(null);

            newsSummaryRepository.save(summary);

        } catch (Exception e) {
            // JSON 파싱 실패 시 원문 그대로 저장
            summary.setSummary(aiResponse.length() > 500 ? aiResponse.substring(0, 500) : aiResponse);
            summary.setClaim("AI 응답 파싱 실패");
            summary.setReliabilityScore(30);
            summary.setAiConfidence(30);
            summary.setStatus(NewsSummary.SummaryStatus.COMPLETED);
            summary.setErrorMessage("JSON 파싱 실패, 원문 저장됨");
            summary.setAiModel("gemini-pro");
            summary.setProcessingTime(processingTime);

            newsSummaryRepository.save(summary);
        }
    }

    /**
     * 팩트체크 결과를 기반으로 신뢰도 계산
     */
    private int calculateFactCheckConfidence(JsonNode responseJson) {
        String factCheckResult = responseJson.path("fact_check_result").asText().toLowerCase();
        
        if (factCheckResult.contains("사실")) return 90;
        if (factCheckResult.contains("부분사실")) return 70;
        if (factCheckResult.contains("검증불가")) return 40;
        if (factCheckResult.contains("거짓")) return 10;
        
        return 50; // 기본값
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