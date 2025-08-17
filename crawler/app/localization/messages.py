# -*- coding: utf-8 -*-
"""
다국어 지원을 위한 메시지 정의
"""

MESSAGES = {
    "ko": {
        # 카테고리명
        "categories": {
            "politics": "정치",
            "economy": "경제", 
            "society": "사회",
            "technology": "과학기술",
            "world": "국제",
            "entertainment": "연예",
            "sports": "스포츠",
            "environment": "환경"
        },
        
        # 소스명
        "sources": {
            "google_news": "구글뉴스",
            "naver_news": "네이버뉴스",
            "daum_news": "다음뉴스"
        },
        
        # 로그 메시지
        "logs": {
            "crawling_rss": "구글 뉴스 RSS 크롤링 중: {url}",
            "found_entries": "RSS 피드에서 {count}개 항목 발견",
            "processed_news": "뉴스 처리 완료: {title}",
            "collected_google_news": "구글 뉴스에서 {count}개 뉴스 수집",
            "collected_daum_news": "다음 뉴스에서 {count}개 뉴스 수집",
            "total_collected_news": "총 {count}개 뉴스 수집 완료",
            "creating_test_news": "{category} 카테고리 테스트 뉴스 생성 중",
            "created_test_news": "테스트 뉴스 생성 완료: {title}",
            "unknown_category": "알 수 없는 카테고리: {category}",
            "crawl_error": "{category} 크롤링 중 오류: {error}",
            "processing_error": "항목 처리 중 오류: {error}"
        },
        
        # 에러 메시지
        "errors": {
            "no_content": "내용을 가져올 수 없습니다",
            "parse_time_error": "시간 파싱 오류",
            "content_fetch_error": "본문을 가져올 수 없습니다"
        }
    },
    
    "en": {
        # Categories
        "categories": {
            "politics": "Politics",
            "economy": "Economy", 
            "society": "Society",
            "technology": "Technology",
            "world": "World",
            "entertainment": "Entertainment",
            "sports": "Sports",
            "environment": "Environment"
        },
        
        # Sources
        "sources": {
            "google_news": "Google News",
            "naver_news": "Naver News",
            "daum_news": "Daum News"
        },
        
        # Log messages
        "logs": {
            "crawling_rss": "Crawling Google News RSS: {url}",
            "found_entries": "Found {count} entries in RSS feed",
            "processed_news": "Processed news: {title}",
            "collected_google_news": "Collected {count} news from Google News",
            "collected_daum_news": "Collected {count} news from Daum News",
            "total_collected_news": "Total {count} news collected",
            "creating_test_news": "Creating test news for category: {category}",
            "created_test_news": "Created test news: {title}",
            "unknown_category": "Unknown category: {category}",
            "crawl_error": "Error crawling RSS for {category}: {error}",
            "processing_error": "Error processing entry: {error}"
        },
        
        # Error messages
        "errors": {
            "no_content": "Unable to fetch content",
            "parse_time_error": "Time parsing error",
            "content_fetch_error": "Unable to fetch article content"
        }
    }
}

class MessageManager:
    def __init__(self, language="ko"):
        self.language = language
        
    def get(self, key_path, **kwargs):
        """
        메시지 키 경로로 메시지를 가져옵니다.
        예: get("categories.politics") -> "정치"
        """
        keys = key_path.split(".")
        message = MESSAGES.get(self.language, MESSAGES["ko"])
        
        for key in keys:
            if isinstance(message, dict) and key in message:
                message = message[key]
            else:
                return f"[Missing: {key_path}]"
        
        if kwargs:
            try:
                return message.format(**kwargs)
            except (KeyError, ValueError):
                return message
        
        return message
    
    def get_category_key(self, korean_name):
        """한글 카테고리명을 영문 키로 변환"""
        category_map = {
            "정치": "politics",
            "경제": "economy",
            "사회": "society", 
            "IT/과학": "technology",
            "세계": "world",
            "연예": "entertainment",
            "스포츠": "sports",
            "기후/환경": "environment"
        }
        return category_map.get(korean_name, korean_name.lower())
    
    def get_search_terms(self):
        """구글 뉴스 검색용 한글 용어 반환"""
        return {
            "politics": "정치",
            "economy": "경제",
            "society": "사회", 
            "technology": "과학기술",
            "world": "국제",
            "entertainment": "연예",
            "sports": "스포츠",
            "environment": "환경"
        }

# 전역 메시지 매니저 인스턴스
msg = MessageManager("ko")