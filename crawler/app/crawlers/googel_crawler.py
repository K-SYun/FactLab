import requests
from bs4 import BeautifulSoup
import feedparser
from datetime import datetime
from typing import List, Dict
import logging
import urllib.parse
from ..database.db_manager import DatabaseManager
from ..localization.messages import msg

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NewsItem:
    def __init__(self, title: str, content: str, source: str, source_url: str, 
                 published_at: datetime, category: str = None, thumbnail: str = None):
        self.title = title
        self.content = content
        self.source = source
        self.source_url = source_url
        self.published_at = published_at
        self.category = category
        self.thumbnail = thumbnail

# 다음 크롤러는 daum_crawler.py 파일로 분리됨

class GoogleNewsCrawler:
    def __init__(self):
        # 구글 뉴스 크롤러 비활성화
        self.base_url = ""
        self.supported_categories = []
        self.rss_urls = {}
        logger.info("구글 뉴스 크롤러가 비활성화되었습니다.")
    
    def crawl_rss(self, category: str = "politics") -> List[NewsItem]:
        """RSS 피드에서 뉴스 수집 - 비활성화됨"""
        news_items = []
        logger.info("구글 뉴스 RSS 크롤링이 비활성화되었습니다.")
        return news_items
    
    def _get_article_content_and_thumbnail(self, url: str) -> tuple:
        """뉴스 기사 본문과 썸네일 추출"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 썸네일 이미지 추출
            thumbnail_url = None
            thumbnail_selectors = [
                # 네이버 뉴스
                'div#articleBodyContents img',
                'div.news_end img',
                'div.article_body img',
                'div.newsct_article img',
                # 일반적인 뉴스 사이트
                'article img',
                'div.content img',
                'div.article_content img',
                # 메타 태그에서 썸네일
                'meta[property="og:image"]',
                'meta[name="twitter:image"]'
            ]
            
            for selector in thumbnail_selectors:
                img_element = soup.select_one(selector)
                if img_element:
                    if img_element.name == 'img':
                        thumbnail_url = img_element.get('src') or img_element.get('data-src')
                    elif img_element.name == 'meta':
                        thumbnail_url = img_element.get('content')
                    
                    if thumbnail_url:
                        # 상대 경로를 절대 경로로 변환
                        if thumbnail_url.startswith('//'):
                            thumbnail_url = 'https:' + thumbnail_url
                        elif thumbnail_url.startswith('/'):
                            from urllib.parse import urljoin
                            thumbnail_url = urljoin(url, thumbnail_url)
                        
                        # 유효한 이미지 URL인지 확인 (언론사 로고 제외)
                        if self._is_valid_thumbnail(thumbnail_url):
                            break
                        else:
                            thumbnail_url = None
            
            # 본문 내용 추출
            content_selectors = [
                'div#articleBodyContents',
                'div.news_end',
                'div.article_body',
                'div.newsct_article'
            ]
            
            content = "본문을 가져올 수 없습니다."
            for selector in content_selectors:
                content_div = soup.select_one(selector)
                if content_div:
                    # 불필요한 태그 제거
                    for tag in content_div.find_all(['script', 'style', 'ins', 'iframe']):
                        tag.decompose()
                    
                    content = content_div.get_text(strip=True)
                    break
            
            return content, thumbnail_url
            
        except Exception as e:
            logger.error(f"Error getting article content from {url}: {e}")
            return "본문을 가져올 수 없습니다.", None
    
    def _is_valid_thumbnail(self, url: str) -> bool:
        """유효한 썸네일인지 확인 (언론사 로고 제외)"""
        if not url:
            return False
        
        # 언론사 로고나 아이콘 제외
        exclude_patterns = [
            'logo', 'icon', 'favicon', 'symbol', 'emblem', 
            'brand', 'header', 'footer', 'nav', 'menu',
            'ad.', 'banner', 'popup', 'overlay'
        ]
        
        url_lower = url.lower()
        for pattern in exclude_patterns:
            if pattern in url_lower:
                return False
        
        # 최소 크기 확인 (너무 작은 이미지 제외)
        size_patterns = ['16x16', '32x32', '48x48', '64x64']
        for pattern in size_patterns:
            if pattern in url_lower:
                return False
        
        return True

class GoogleCrawlerManager:
    def __init__(self):
        self.google_crawler = GoogleNewsCrawler()
        self.db_manager = DatabaseManager()
    
    def crawl_all_sources(self, category: str = "politics") -> List[NewsItem]:
        """네이버 뉴스에서 뉴스 수집 (구글 뉴스 대신)"""
        all_news = []
        
        # 네이버 모바일 크롤러 사용
        try:
            import asyncio
            from app.crawlers.naver_crawler import NaverMobileCrawler
            
            # 연예, 스포츠 제외한 카테고리만 크롤링
            excluded_categories = ["entertainment", "sports"]
            if category not in excluded_categories:
                naver_crawler = NaverMobileCrawler()
                # 비동기 함수를 동기적으로 실행
                naver_news = asyncio.run(naver_crawler.crawl_category(category, count=10))
                all_news.extend(naver_news)
                logger.info(f"네이버에서 {len(naver_news)}개 뉴스 수집 완료 (카테고리: {category})")
            else:
                logger.info(f"제외된 카테고리입니다: {category}")
                
        except Exception as e:
            logger.error(f"네이버 크롤링 오류: {e}")
        
        logger.info(msg.get("logs.total_collected_news", count=len(all_news)))
        return all_news
    
    def crawl_and_save_all_sources(self, category: str = "politics") -> Dict[str, int]:
        """모든 소스에서 뉴스 수집하고 DB에 저장"""
        all_news = self.crawl_all_sources(category)
        
        if all_news:
            result = self.db_manager.save_news_batch(all_news)
            logger.info(f"Crawl and save result for {category}: {result}")
            return result
        else:
            logger.warning(f"No news collected for category: {category}")
            return {'saved': 0, 'duplicates': 0, 'errors': 0}
    
    def crawl_all_categories(self) -> List[NewsItem]:
        """모든 카테고리에서 뉴스 수집 (연예, 스포츠 제외)"""
        all_news = []
        # 연예, 스포츠 제외
        categories = ["politics", "economy", "society", "technology", "world", "environment"]
        
        for category in categories:
            category_news = self.crawl_all_sources(category)
            all_news.extend(category_news)
            logger.info(f"Collected {len(category_news)} news from {msg.get('categories.' + category)}")
        
        return all_news
    
    def crawl_and_save_all_categories(self) -> Dict[str, Dict[str, int]]:
        """모든 카테고리에서 뉴스 수집하고 DB에 저장"""
        results = {}
        categories = ["politics", "economy", "society", "technology", "world", "entertainment", "sports", "environment"]
        
        for category in categories:
            try:
                result = self.crawl_and_save_all_sources(category)
                results[msg.get('categories.' + category)] = result
                logger.info(f"Completed {msg.get('categories.' + category)}: {result}")
            except Exception as e:
                logger.error(f"Error processing category {category}: {e}")
                results[msg.get('categories.' + category)] = {'saved': 0, 'duplicates': 0, 'errors': 1}
        
        return results
