package com.factlab.common.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class MessageService {

    @Autowired
    private MessageSource messageSource;

    /**
     * 현재 로케일에 맞는 메시지 반환
     */
    public String getMessage(String key, Object... args) {
        return messageSource.getMessage(key, args, LocaleContextHolder.getLocale());
    }

    /**
     * 특정 로케일의 메시지 반환
     */
    public String getMessage(String key, Locale locale, Object... args) {
        return messageSource.getMessage(key, args, locale);
    }

    /**
     * 카테고리 목록 반환 (현재 로케일)
     */
    public Map<String, String> getCategories() {
        Map<String, String> categories = new HashMap<>();
        categories.put("politics", getMessage("categories.politics"));
        categories.put("economy", getMessage("categories.economy"));
        categories.put("society", getMessage("categories.society"));
        categories.put("technology", getMessage("categories.technology"));
        categories.put("world", getMessage("categories.world"));
        categories.put("entertainment", getMessage("categories.entertainment"));
        categories.put("sports", getMessage("categories.sports"));
        categories.put("environment", getMessage("categories.environment"));
        return categories;
    }

    /**
     * 한글 카테고리명을 영문 키로 변환
     */
    public String getCategoryKey(String koreanName) {
        Map<String, String> categoryMap = new HashMap<>();
        categoryMap.put("정치", "politics");
        categoryMap.put("경제", "economy");
        categoryMap.put("사회", "society");
        categoryMap.put("IT/과학", "technology");
        categoryMap.put("과학기술", "technology");
        categoryMap.put("세계", "world");
        categoryMap.put("국제", "world");
        categoryMap.put("연예", "entertainment");
        categoryMap.put("스포츠", "sports");
        categoryMap.put("기후/환경", "environment");
        categoryMap.put("환경", "environment");
        return categoryMap.getOrDefault(koreanName, koreanName.toLowerCase());
    }

    /**
     * 구글 뉴스 검색용 한글 용어 반환
     */
    public Map<String, String> getSearchTerms() {
        Map<String, String> searchTerms = new HashMap<>();
        searchTerms.put("politics", "정치");
        searchTerms.put("economy", "경제");
        searchTerms.put("society", "사회");
        searchTerms.put("technology", "과학기술");
        searchTerms.put("world", "국제");
        searchTerms.put("entertainment", "연예");
        searchTerms.put("sports", "스포츠");
        searchTerms.put("environment", "환경");
        return searchTerms;
    }
}