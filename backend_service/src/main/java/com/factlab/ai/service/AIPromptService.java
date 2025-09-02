package com.factlab.ai.service;

import com.factlab.news.entity.NewsSummary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

@Service
public class AIPromptService {

    private Map<String, Object> promptConfig;

    public AIPromptService() {
        loadPrompts();
    }

    /**
     * YAML 파일에서 프롬프트 설정을 로드
     */
    private void loadPrompts() {
        try {
            ClassPathResource resource = new ClassPathResource("ai-prompts.yml");
            InputStream inputStream = resource.getInputStream();
            Yaml yaml = new Yaml();
            this.promptConfig = yaml.load(inputStream);
            inputStream.close();
        } catch (IOException e) {
            throw new RuntimeException("프롬프트 설정 파일을 로드할 수 없습니다: " + e.getMessage());
        }
    }

    /**
     * 분석 타입에 따른 시스템 프롬프트 가져오기
     */
    public String getSystemPrompt(NewsSummary.AnalysisType analysisType) {
        String promptKey = getPromptKey(analysisType);
        Map<String, Object> aiConfig = (Map<String, Object>) promptConfig.get("ai");
        Map<String, Object> prompts = (Map<String, Object>) aiConfig.get("prompts");
        Map<String, Object> specificPrompt = (Map<String, Object>) prompts.get(promptKey);
        
        if (specificPrompt == null) {
            throw new RuntimeException("프롬프트를 찾을 수 없습니다: " + promptKey);
        }
        
        return (String) specificPrompt.get("system");
    }

    /**
     * 분석 타입에 따른 사용자 프롬프트 가져오기
     */
    public String getUserPrompt(NewsSummary.AnalysisType analysisType) {
        String promptKey = getPromptKey(analysisType);
        Map<String, Object> aiConfig = (Map<String, Object>) promptConfig.get("ai");
        Map<String, Object> prompts = (Map<String, Object>) aiConfig.get("prompts");
        Map<String, Object> specificPrompt = (Map<String, Object>) prompts.get(promptKey);
        
        if (specificPrompt == null) {
            throw new RuntimeException("프롬프트를 찾을 수 없습니다: " + promptKey);
        }
        
        return (String) specificPrompt.get("user");
    }

    /**
     * 뉴스 내용으로 프롬프트 생성 (템플릿 변수 치환)
     */
    public String buildUserPrompt(NewsSummary.AnalysisType analysisType, 
                                String title, String content, String source) {
        String template = getUserPrompt(analysisType);
        
        return template
                .replace("{title}", title != null ? title : "제목 없음")
                .replace("{content}", content != null ? content : "내용 없음")
                .replace("{source}", source != null ? source : "출처 불명");
    }

    /**
     * 전체 프롬프트 메시지 생성 (시스템 + 사용자)
     */
    public PromptMessages buildPromptMessages(NewsSummary.AnalysisType analysisType,
                                            String title, String content, String source) {
        String systemPrompt = getSystemPrompt(analysisType);
        String userPrompt = buildUserPrompt(analysisType, title, content, source);
        
        return new PromptMessages(systemPrompt, userPrompt);
    }

    /**
     * 분석 타입을 프롬프트 키로 변환
     */
    private String getPromptKey(NewsSummary.AnalysisType analysisType) {
        switch (analysisType) {
            case COMPREHENSIVE:
                return "comprehensive";
            case FACT_ANALYSIS:
                return "fact_analysis";
            case BIAS_ANALYSIS:
                return "bias_analysis";
            default:
                return "simple";
        }
    }

    /**
     * 프롬프트 메시지를 담는 데이터 클래스
     */
    public static class PromptMessages {
        private final String systemMessage;
        private final String userMessage;

        public PromptMessages(String systemMessage, String userMessage) {
            this.systemMessage = systemMessage;
            this.userMessage = userMessage;
        }

        public String getSystemMessage() {
            return systemMessage;
        }

        public String getUserMessage() {
            return userMessage;
        }

        /**
         * Gemini API용 단일 프롬프트 생성
         */
        public String getCombinedPrompt() {
            return systemMessage + "\n\n" + userMessage;
        }
    }

    /**
     * 프롬프트 설정을 다시 로드 (관리자가 파일을 수정했을 때 사용)
     */
    public void reloadPrompts() {
        loadPrompts();
    }
}