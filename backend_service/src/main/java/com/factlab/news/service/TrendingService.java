package com.factlab.news.service;

import com.factlab.news.repository.NewsSummaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TrendingService {

    @Autowired
    private NewsSummaryRepository newsSummaryRepository;

    /**
     * 승인된 뉴스의 키워드에서 가장 많이 중복된 키워드 상위 N개 조회
     */
    public List<String> getTrendingKeywords(int limit) {
        // 임시로 기본 키워드 반환 (추후 DB 연동 시 수정)
        return Arrays.asList("#AI일자리", "#백신효과", "#탄소중립", "#팩트체크", "#기후변화", 
                           "#집중호우", "#태풍", "#갑질폭로", "#부동산", "#주식시장");
        
        /* TODO: DB 연동 구현 (현재 컴파일 에러로 임시 비활성화)
        try {
            // 승인된 뉴스의 모든 키워드 가져오기
            List<String> allKeywords = newsSummaryRepository.findApprovedKeywords();
            
            // 키워드 빈도 계산
            Map<String, Integer> keywordCount = new HashMap<>();
            
            for (String keywordString : allKeywords) {
                if (keywordString != null && !keywordString.trim().isEmpty()) {
                    // 쉼표로 구분된 키워드들을 분리
                    String[] keywords = keywordString.split(",");
                    for (String keyword : keywords) {
                        String cleanKeyword = keyword.trim();
                        if (!cleanKeyword.isEmpty() && cleanKeyword.length() >= 2) {
                            // # 기호 제거 (있는 경우)
                            if (cleanKeyword.startsWith("#")) {
                                cleanKeyword = cleanKeyword.substring(1);
                            }
                            keywordCount.put(cleanKeyword, keywordCount.getOrDefault(cleanKeyword, 0) + 1);
                        }
                    }
                }
            }
            
            // 빈도수에 따라 정렬하고 상위 N개 반환
            return keywordCount.entrySet().stream()
                    .filter(entry -> entry.getValue() > 5) // 2번 이상 나온 키워드만
                    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                    .limit(limit)
                    .map(entry -> "#" + entry.getKey()) // # 기호 추가
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            // 에러 발생 시 기본 키워드 반환
            return Arrays.asList("#AI일자리", "#백신효과", "#탄소중립", "#팩트체크", "#기후변화", 
                               "#집중호우", "#태풍", "#갑질폭로", "#부동산", "#주식시장");
        }
        */
    }
}