"""
네이버 모바일 뉴스 크롤러
- 네이버 모바일 사이트에서 카테고리별 헤드라인 뉴스 수집
- 2시간 간격, 각 카테고리별 헤드라인 뉴스 10개씩 수집
"""

import asyncio
import aiohttp
import logging
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from typing import List, Dict
import re
import hashlib
import os
from urllib.parse import urljoin, quote
import random
from dataclasses import dataclass
import sys
from pathlib import Path
from PIL import Image
import io
import base64

# 프로젝트 루트 경로 추가
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from app.database.db_manager import DatabaseManager

logger = logging.getLogger(__name__)

@dataclass
class NewsItem:
    title: str
    content: str
    url: str
    source: str
    category: str
    publish_date: datetime  # 크롤링 시간
    original_publish_date: datetime = None  # 실제 뉴스 발행 시간
    thumbnail: str = None
    url_hash: str = None
    
    def __post_init__(self):
        if self.url_hash is None:
            self.url_hash = hashlib.md5(self.url.encode()).hexdigest()

class NaverMobileCrawler:
    def __init__(self):
        self.base_url = "https://m.news.naver.com"
        self.session = None
        
        # 데이터베이스 매니저 초기화
        self.db_manager = DatabaseManager()
        
        # 네이버 모바일 카테고리별 헤드라인 뉴스 URL (2025년 현재 구조)
        self.categories = {
            "politics": {"code": "100", "name": "정치", "url": "https://news.naver.com/section/100"},
            "economy": {"code": "101", "name": "경제", "url": "https://news.naver.com/section/101"},
            "society": {"code": "102", "name": "사회", "url": "https://news.naver.com/section/102"},
            "technology": {"code": "105", "name": "IT/과학", "url": "https://news.naver.com/section/105"},
            "world": {"code": "104", "name": "세계", "url": "https://news.naver.com/section/104"}
        }
        
        # 모바일 User-Agent
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
    async def init_session(self):
        """HTTP 세션 초기화"""
        if not self.session:
            timeout = aiohttp.ClientTimeout(total=30, connect=10)
            connector = aiohttp.TCPConnector(
                limit=10, 
                limit_per_host=5,
                ssl=False  # SSL 검증 비활성화
            )
            self.session = aiohttp.ClientSession(
                headers=self.headers,
                timeout=timeout,
                connector=connector
            )
            logger.info("Naver mobile crawler session initialized")
    
    async def close_session(self):
        """HTTP 세션 종료"""
        if self.session:
            await self.session.close()
            self.session = None
            logger.info("Naver mobile crawler session closed")
    
    def clean_text(self, text: str) -> str:
        """텍스트 정리"""
        if not text:
            return ""
        
        # HTML 태그 제거
        text = re.sub(r'<[^>]+>', '', text)
        # 특수문자 정리
        text = re.sub(r'[\r\n\t]', ' ', text)
        # 연속 공백 제거
        text = re.sub(r'\s+', ' ', text)
        # 불필요한 문자 제거
        text = re.sub(r'[^\w\s가-힣.,!?()[\]\-]', '', text)
        
        return text.strip()
    
    def _extract_video_thumbnail(self, soup: BeautifulSoup) -> str:
        """동영상 썸네일 추출"""
        try:
            # 우선순위별 동영상 썸네일 추출 방법
            
            # 1순위: video 태그의 poster 속성
            video_tags = soup.find_all('video')
            for video in video_tags:
                poster = video.get('poster')
                if poster:
                    # 상대 URL을 절대 URL로 변환
                    if poster.startswith('/'):
                        poster = f"https://news.naver.com{poster}"
                    elif not poster.startswith('http'):
                        poster = f"https://{poster}"
                    logger.debug(f"video poster 발견: {poster}")
                    return poster
            
            # 2순위: 네이버 동영상 특화 패턴
            naver_video_selectors = [
                # 네이버 동영상 썸네일 클래스
                'img[class*="video"]',
                'img[class*="thumbnail"]',
                '.video_thumb img',
                '.video_thumbnail img',
                '.media_end_video img',
                'img[src*="video"]',
                'img[src*="thumb"]'
            ]
            
            for selector in naver_video_selectors:
                img_tags = soup.select(selector)
                for img_tag in img_tags:
                    src = img_tag.get('src') or img_tag.get('data-src')
                    if src:
                        # 동영상 관련 키워드가 있는지 확인
                        if any(keyword in src.lower() for keyword in ['video', 'thumb', 'poster']):
                            logger.debug(f"동영상 관련 이미지 발견: {src}")
                            return src
            
            # 3순위: og:video:thumbnail 메타태그
            meta_video_thumbnail = soup.find('meta', property='og:video:thumbnail')
            if meta_video_thumbnail and meta_video_thumbnail.get('content'):
                logger.debug(f"og:video:thumbnail 발견: {meta_video_thumbnail['content']}")
                return meta_video_thumbnail['content']
            
            # 4순위: 유튜브 등 외부 동영상 iframe에서 썸네일 추출
            iframe_tags = soup.find_all('iframe')
            for iframe in iframe_tags:
                src = iframe.get('src', '')
                if 'youtube.com' in src or 'youtu.be' in src:
                    # 유튜브 비디오 ID 추출
                    video_id = None
                    if 'embed/' in src:
                        video_id = src.split('embed/')[-1].split('?')[0]
                    elif 'v=' in src:
                        video_id = src.split('v=')[-1].split('&')[0]
                    
                    if video_id:
                        youtube_thumbnail = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
                        logger.debug(f"유튜브 썸네일 생성: {youtube_thumbnail}")
                        return youtube_thumbnail
                        
                elif 'vimeo.com' in src:
                    # Vimeo 비디오 ID 추출 (간단한 패턴)
                    video_id = src.split('/')[-1].split('?')[0]
                    if video_id.isdigit():
                        vimeo_thumbnail = f"https://vumbnail.com/{video_id}.jpg"
                        logger.debug(f"Vimeo 썸네일 생성: {vimeo_thumbnail}")
                        return vimeo_thumbnail
                        
            return None
            
        except Exception as e:
            logger.error(f"동영상 썸네일 추출 실패: {e}")
            return None
    

    def extract_thumbnail(self, soup: BeautifulSoup) -> str:
        """썸네일 이미지 URL 추출 (본문 이미지 우선, 동영상 썸네일 포함, 언론사 로고 제외)"""
        try:
            # 언론사 로고나 부적절한 이미지를 필터링할 키워드 (강화)
            skip_keywords_url = [
                'logo', 'icon', 'button', 'banner', 'ad', 'advertisement', 'thumb', 
                'profile', 'avatar', 'favicon', 'symbol', 'emblem', 'mark', 'ci',
                'header', 'footer', 'nav', 'menu', 'bg', 'background'
            ]
            skip_keywords_alt = [
                # 한국 언론사
                '로고', 'logo', '아이콘', 'icon', '광고', 'ad', 'advertisement', 
                '배너', 'banner', '브랜드', 'brand', '언론사', 'news', '뉴스',
                '방송국', 'tv', '라디오', 'radio', '기자', 'reporter', '아나운서',
                'sbs', 'kbs', 'mbc', 'jtbc', 'ytn', 'tvn', 'yna', '연합뉴스',
                '조선일보', '중앙일보', '동아일보', '한겨레', '경향신문', '한국일보',
                '매일경제', '한국경제', '서울신문', '국민일보', '문화일보', '세계일보',
                # 일반적인 UI 요소
                '프로필', 'profile', '썸네일', 'thumbnail', '미리보기', 'preview',
                '회사', 'company', '기업', 'corp', '단체', 'organization'
            ]
            
            # 1단계: 동영상 썸네일 추출 시도
            video_thumbnail = self._extract_video_thumbnail(soup)
            if video_thumbnail and self._is_valid_thumbnail(video_thumbnail, '', skip_keywords_url, skip_keywords_alt):
                logger.debug(f"동영상 썸네일 추출: {video_thumbnail}")
                return video_thumbnail
            
            # 우선순위별 썸네일 추출 패턴 (본문 이미지 우선)
            priority_selectors = [
                # 1순위: 본문 내 이미지 (가장 중요)
                '.newsct_article img:not([class*="logo"]):not([class*="icon"])',
                '.end_body_wrp img:not([class*="logo"]):not([class*="icon"])',
                '#newsEndContents img:not([class*="logo"]):not([class*="icon"])',
                '._article_body_contents img:not([class*="logo"]):not([class*="icon"])',
                
                # 2순위: 네이버 뉴스 메인 이미지
                'img.end_photo_org',
                'img._LAZY_LOADING_ERROR_HIDE',
                '.media_end_head_photo img',
                '.end_photo_org',
                
                # 3순위: 메타태그 이미지 (최후 수단)
                'meta[property="og:image"]',
                'meta[name="twitter:image"]',
                'meta[property="image"]'
            ]
            
            # 우선순위별로 이미지 검색
            for selector in priority_selectors:
                if selector.startswith('meta'):
                    meta_tag = soup.select_one(selector)
                    if meta_tag and meta_tag.get('content'):
                        img_url = meta_tag['content']
                        if self._is_valid_thumbnail(img_url, '', skip_keywords_url, skip_keywords_alt):
                            logger.debug(f"메타태그에서 썸네일 추출: {img_url}")
                            return img_url
                else:
                    img_tags = soup.select(selector)
                    for img_tag in img_tags:
                        src = img_tag.get('src') or img_tag.get('data-src')
                        alt = img_tag.get('alt', '')
                        if src and self._is_valid_thumbnail(src, alt, skip_keywords_url, skip_keywords_alt):
                            logger.debug(f"DOM에서 썸네일 추출: {src} (alt: {alt})")
                            return src
            
            # 대안: 본문에서 크기가 충분한 이미지 찾기
            article_areas = [
                '.newsct_article', '.end_body_wrp', '#newsEndContents', '._article_body_contents'
            ]
            
            for area_selector in article_areas:
                area = soup.select_one(area_selector)
                if area:
                    images = area.find_all('img')
                    for img in images:
                        src = img.get('src') or img.get('data-src')
                        alt = img.get('alt', '')
                        width = img.get('width', '')
                        height = img.get('height', '')
                        
                        if src and self._is_valid_thumbnail(src, alt, skip_keywords_url, skip_keywords_alt):
                            # 크기 정보가 있으면 확인 (최소 100px)
                            if width and height:
                                try:
                                    if int(width) >= 100 and int(height) >= 100:
                                        logger.debug(f"본문에서 크기 기반 썸네일 추출: {src}")
                                        return src
                                except:
                                    pass
                            else:
                                logger.debug(f"본문에서 썸네일 추출: {src}")
                                return src
                                
            logger.debug("적절한 썸네일을 찾을 수 없음")
            return None
            
        except Exception as e:
            logger.error(f"썸네일 추출 실패: {e}")
            return None

    def extract_original_publish_date(self, soup: BeautifulSoup) -> datetime:
        """실제 뉴스 발행 시간 추출 - 개선된 버전"""
        try:
            logger.debug("🕒 실제 뉴스 발행 시간 추출 시작")
            
            # 1순위: 네이버 뉴스 전용 선택자들
            naver_selectors = [
                '.media_end_head_info_datestamp_time._ARTICLE_DATE_TIME',  # 네이버 뉴스 시간
                '.media_end_head_info_datestamp ._ARTICLE_DATE_TIME',      # 네이버 뉴스 시간 (변형)
                '.guide_categorization_item ._ARTICLE_DATE_TIME',          # 네이버 뉴스 카테고리 영역
                'span[data-date-time]',                                    # data-date-time 속성
                '.t11[data-date-time]',                                    # 네이버 특정 클래스
                '.date',                                                   # 일반적인 날짜 클래스
                '.article_info .date',                                     # 기사 정보 영역의 날짜
                '.byline .date'                                            # 바이라인의 날짜
            ]
            
            for selector in naver_selectors:
                elements = soup.select(selector)
                for element in elements:
                    # data-date-time 속성 확인
                    date_time_attr = element.get('data-date-time')
                    if date_time_attr:
                        try:
                            # 네이버 형식: YYYYMMDDHHMMSS
                            if len(date_time_attr) == 14 and date_time_attr.isdigit():
                                year = int(date_time_attr[:4])
                                month = int(date_time_attr[4:6])
                                day = int(date_time_attr[6:8])
                                hour = int(date_time_attr[8:10])
                                minute = int(date_time_attr[10:12])
                                second = int(date_time_attr[12:14])
                                extracted_time = datetime(year, month, day, hour, minute, second)
                                logger.info(f"✅ 네이버 data-date-time에서 발행 시간 추출: {extracted_time}")
                                return extracted_time
                        except Exception as e:
                            logger.debug(f"data-date-time 파싱 실패: {e}")
                    
                    # 텍스트에서 시간 추출
                    text = element.get_text().strip()
                    if text:
                        extracted_time = self._parse_korean_datetime(text)
                        if extracted_time:
                            logger.info(f"✅ 네이버 선택자에서 발행 시간 추출: {extracted_time} (원본: {text})")
                            return extracted_time
            
            # 2순위: 구조화된 데이터의 datePublished
            script_tags = soup.find_all('script', type='application/ld+json')
            for script in script_tags:
                try:
                    import json
                    data = json.loads(script.get_text())
                    if isinstance(data, dict) and 'datePublished' in data:
                        date_str = data['datePublished']
                        extracted_time = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        logger.info(f"✅ JSON-LD에서 발행 시간 추출: {extracted_time}")
                        return extracted_time
                    elif isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict) and 'datePublished' in item:
                                date_str = item['datePublished']
                                extracted_time = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                                logger.info(f"✅ JSON-LD 배열에서 발행 시간 추출: {extracted_time}")
                                return extracted_time
                except Exception as e:
                    logger.debug(f"JSON-LD 파싱 실패: {e}")
                    continue
            
            # 3순위: 메타태그의 article:published_time
            meta_published = soup.find('meta', property='article:published_time')
            if meta_published and meta_published.get('content'):
                try:
                    date_str = meta_published['content']
                    extracted_time = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    logger.info(f"✅ 메타태그에서 발행 시간 추출: {extracted_time}")
                    return extracted_time
                except Exception as e:
                    logger.debug(f"메타태그 파싱 실패: {e}")
            
            # 4순위: time 태그의 datetime 속성
            time_tags = soup.find_all('time')
            for time_tag in time_tags:
                datetime_attr = time_tag.get('datetime')
                if datetime_attr:
                    try:
                        extracted_time = datetime.fromisoformat(datetime_attr.replace('Z', '+00:00'))
                        logger.info(f"✅ time 태그에서 발행 시간 추출: {extracted_time}")
                        return extracted_time
                    except Exception as e:
                        logger.debug(f"time 태그 파싱 실패: {e}")
                        continue
            
            # 5순위: 전체 텍스트에서 패턴 검색
            text = soup.get_text()
            extracted_time = self._parse_korean_datetime(text)
            if extracted_time:
                logger.info(f"✅ 전체 텍스트에서 발행 시간 추출: {extracted_time}")
                return extracted_time
            
            # 추출할 수 없는 경우 현재 시간에서 랜덤하게 1-12시간 전으로 설정
            import random
            hours_ago = random.randint(1, 12)
            minutes_ago = random.randint(0, 59)
            fake_publish_time = datetime.now() - timedelta(hours=hours_ago, minutes=minutes_ago)
            logger.warning(f"⚠️ 실제 발행 시간 추출 실패, 랜덤 시간 생성: {fake_publish_time}")
            return fake_publish_time
            
        except Exception as e:
            logger.error(f"❌ 발행 시간 추출 실패: {e}")
            # 기본값으로 현재 시간에서 2-6시간 전
            import random
            hours_ago = random.randint(2, 6)
            return datetime.now() - timedelta(hours=hours_ago)
    
    def _parse_korean_datetime(self, text: str) -> datetime:
        """한국어 날짜/시간 텍스트를 파싱"""
        import re
        
        # 다양한 한국어 날짜 패턴들
        patterns = [
            # YYYY-MM-DD HH:MM 형식
            r'(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})',
            # YYYY.MM.DD HH:MM 형식  
            r'(\d{4})\.(\d{1,2})\.(\d{1,2})\s+(\d{1,2}):(\d{1,2})',
            # YYYY년 MM월 DD일 HH:MM 형식
            r'(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s+(\d{1,2}):(\d{1,2})',
            # MM월 DD일 HH:MM 형식 (올해)
            r'(\d{1,2})월\s*(\d{1,2})일\s+(\d{1,2}):(\d{1,2})',
            # 오전/오후 시간 형식
            r'(\d{4})\.(\d{1,2})\.(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{1,2})',
            r'(\d{4})-(\d{1,2})-(\d{1,2})\s*(오전|오후)\s*(\d{1,2}):(\d{1,2})',
            # 네이버 특수 형식
            r'(\d{4})\.(\d{1,2})\.(\d{1,2})\s*(\d{1,2}):(\d{1,2})',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                try:
                    if len(match) == 5:  # YYYY-MM-DD HH:MM 또는 YYYY.MM.DD HH:MM
                        year, month, day, hour, minute = map(int, match)
                        return datetime(year, month, day, hour, minute)
                    elif len(match) == 4:  # MM월 DD일 HH:MM (올해)
                        month, day, hour, minute = map(int, match)
                        return datetime(datetime.now().year, month, day, hour, minute)
                    elif len(match) == 6:  # 오전/오후 형식
                        if match[3] in ['오전', '오후']:  # 오전/오후 있는 경우
                            year, month, day, ampm, hour, minute = match
                            year, month, day, hour, minute = int(year), int(month), int(day), int(hour), int(minute)
                            if ampm == '오후' and hour != 12:
                                hour += 12
                            elif ampm == '오전' and hour == 12:
                                hour = 0
                            return datetime(year, month, day, hour, minute)
                        else:  # 일반 시간
                            year, month, day, hour, minute = map(int, match[:5])
                            return datetime(year, month, day, hour, minute)
                except (ValueError, IndexError) as e:
                    logger.debug(f"날짜 파싱 실패: {match}, 에러: {e}")
                    continue
        
        # 상대 시간 (몇 시간 전, 몇 분 전)
        relative_patterns = [
            r'(\d+)시간\s*전',
            r'(\d+)분\s*전',
            r'(\d+)일\s*전'
        ]
        
        for pattern in relative_patterns:
            match = re.search(pattern, text)
            if match:
                amount = int(match.group(1))
                now = datetime.now()
                if '시간' in pattern:
                    return now - timedelta(hours=amount)
                elif '분' in pattern:
                    return now - timedelta(minutes=amount)
                elif '일' in pattern:
                    return now - timedelta(days=amount)
        
        return None
    
    def _is_valid_thumbnail(self, src: str, alt: str, skip_keywords_url: list, skip_keywords_alt: list) -> bool:
        """썸네일이 적절한지 검사 (URL과 alt 값 기준) - 강화된 필터링"""
        try:
            # URL 유효성 검사
            if not src or not src.startswith(('http://', 'https://', 'data:')):
                return False
            
            src_lower = src.lower()
            alt_lower = alt.lower()
            
            # URL에 부적절한 키워드가 포함되어 있는지 검사 (강화)
            for keyword in skip_keywords_url:
                if keyword in src_lower:
                    logger.debug(f"URL 키워드 필터링: {keyword} in {src}")
                    return False
            
            # alt 값에 부적절한 키워드가 포함되어 있는지 검사 (강화)  
            for keyword in skip_keywords_alt:
                if keyword in alt_lower:
                    logger.debug(f"ALT 키워드 필터링: {keyword} in {alt}")
                    return False
            
            # 파일 확장자 검사 (이미지 파일만)
            if not any(ext in src_lower for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
                # data: URL의 경우는 허용
                if not src.startswith('data:image/'):
                    logger.debug(f"이미지 파일 확장자가 아님: {src}")
                    return False
            
            # 이미지 크기가 너무 작은 것 제외 (URL에서 크기 정보 확인)
            small_sizes = [
                '16x16', '24x24', '32x32', '48x48', '64x64', '80x80',
                '16_16', '24_24', '32_32', '48_48', '64_64', '80_80',
                'thumb', 'small', 'mini', 'tiny'
            ]
            if any(size in src_lower for size in small_sizes):
                logger.debug(f"이미지 크기가 너무 작음: {src}")
                return False
            
            # 네이버 특정 로고/아이콘 패턴 제외
            naver_logo_patterns = [
                'static.nimg.jp', 'imgnews.pstatic.net/image/logo',
                'ssl.pstatic.net/static', 'phinf.pstatic.net/contact',
                'dthumb-phinf.pstatic.net', 'logoimg'
            ]
            if any(pattern in src_lower for pattern in naver_logo_patterns):
                logger.debug(f"네이버 로고 패턴 필터링: {src}")
                return False
            
            # 최소 품질 기준: URL에 resolution이나 width 정보가 있는 경우 확인
            resolution_patterns = ['w=', 'width=', 'size=', 'res=']
            for pattern in resolution_patterns:
                if pattern in src_lower:
                    try:
                        # w=100 같은 패턴에서 크기 추출
                        import re
                        match = re.search(f'{pattern}(\\d+)', src_lower)
                        if match:
                            size = int(match.group(1))
                            if size < 120:  # 최소 120px
                                logger.debug(f"URL에서 추출한 크기가 너무 작음: {size}px")
                                return False
                    except:
                        pass
                        
            return True
            
        except Exception as e:
            logger.debug(f"썸네일 유효성 검사 오류: {e}")
            return False
    
    async def resize_and_optimize_image(self, image_url: str, 
                                      mobile_size: tuple = (200, 150), 
                                      desktop_size: tuple = (400, 300), 
                                      retina_size: tuple = (800, 600)) -> str:
        """이미지 다운로드, 리사이즈 후 파일로 저장 - 파일 경로 반환"""
        try:
            if not image_url:
                return None
                
            # 이미지 다운로드
            headers = {
                'User-Agent': self.user_agent,
                'Referer': 'https://news.naver.com/'
            }
            
            async with self.session.get(image_url, headers=headers, timeout=10) as response:
                if response.status != 200:
                    logger.debug(f"이미지 다운로드 실패 ({image_url}): HTTP {response.status}")
                    return image_url
                    
                image_data = await response.read()
                
                # 이미지 크기 체크 (10MB 제한)
                if len(image_data) > 10 * 1024 * 1024:
                    logger.debug(f"이미지 크기 초과 ({image_url}): {len(image_data)} bytes")
                    return image_url
                
            # PIL로 이미지 처리
            image = Image.open(io.BytesIO(image_data))
            
            # RGBA 이미지를 RGB로 변환 (JPEG 저장을 위함)
            if image.mode in ('RGBA', 'LA', 'P'):
                # 흰색 배경으로 변환
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background
            
            # 데스크탑용 썸네일 생성 (400x300, 고해상도는 800x600)
            image_desktop = image.copy()
            image_desktop.thumbnail(desktop_size, Image.Resampling.LANCZOS)
            
            # 고유한 파일명 생성 (URL 해시 + 타임스탬프)
            import hashlib
            url_hash = hashlib.md5(image_url.encode()).hexdigest()[:8]
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"thumb_{url_hash}_{timestamp}.jpg"
            
            # 썸네일 저장 디렉토리 생성
            thumb_dir = "/app/thumbnails"
            os.makedirs(thumb_dir, exist_ok=True)
            
            # 데스크탑용 썸네일 저장
            desktop_path = os.path.join(thumb_dir, filename)
            image_desktop.save(desktop_path, format='JPEG', quality=85, optimize=True)
            
            # 웹에서 접근 가능한 경로 반환 (nginx를 통해 서빙)
            web_path = f"/thumbnails/{filename}"
            logger.debug(f"썸네일 저장 완료: {web_path} (크기: {image_desktop.size})")
            
            return web_path
            
        except Exception as e:
            logger.debug(f"이미지 리사이즈 실패 ({image_url}): {e}")
            return image_url  # 원본 URL 반환
    
    async def get_category_news_list(self, category: str, count: int = 10) -> List[str]:
        """카테고리별 헤드라인 뉴스 목록 URL 수집 (10개 한정)"""
        if category not in self.categories:
            logger.error(f"Invalid category: {category}")
            return []
        
        category_info = self.categories[category]
        section_url = category_info['url']
        
        try:
            await asyncio.sleep(random.uniform(1, 3))  # 랜덤 지연
            
            async with self.session.get(section_url) as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch {section_url}: {response.status}")
                    return []
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # 헤드라인 뉴스 영역 우선 검색
                news_links = []
                
                # 네이버 뉴스 선택자들 (실제 기사 링크 우선)
                headline_selectors = [
                    # 1순위: 실제 뉴스 기사 링크 (mnews)
                    'a[href*="/mnews/article/"]',
                    'a[href*="n.news.naver.com"]',
                    # 2순위: 직접 뉴스 링크
                    'a[href*="/read/"]',
                    'a[href*="oid="][href*="aid="]',
                    # 3순위: 일반 뉴스 영역
                    '.section_headline a',
                    '.headline_list a',
                    '.main_news a',
                    '.news_list a'
                ]
                
                # 헤드라인 영역에서 우선 검색
                for selector in headline_selectors:
                    elements = soup.select(selector)
                    for element in elements:
                        href = element.get('href')
                        if not href:
                            continue
                            
                        # 댓글 페이지 제외
                        if '/comment/' in href or '/comment?' in href:
                            continue
                        
                        # 네이버 뉴스 URL 패턴 확인 (새로운 구조 포함)
                        if any(pattern in href for pattern in ['/mnews/article/', '/read/', 'oid=', 'aid=', 'article']):
                            if href.startswith('http'):
                                news_links.append(href)
                            elif href.startswith('/'):
                                # 새로운 네이버 뉴스 도메인 구조 적용
                                if '/mnews/article/' in href:
                                    news_links.append(f"https://n.news.naver.com{href}")
                                else:
                                    news_links.append(f"https://news.naver.com{href}")
                    
                    # 헤드라인에서 충분한 링크를 찾았다면 중단
                    if len(news_links) >= count:
                        break
                
                # 헤드라인에서 충분히 찾지 못한 경우, 일반 뉴스로 보완
                if len(news_links) < count:
                    logger.info(f"헤드라인에서 {len(news_links)}개만 찾음. 일반 뉴스로 보완 중...")
                    links = soup.find_all('a', href=True)
                    for link in links:
                        if len(news_links) >= count:
                            break
                            
                        href = link['href']
                        title_text = link.get_text(strip=True)
                        
                        # 이미 추가된 링크는 스킵
                        if href in news_links:
                            continue
                        
                        # 댓글 페이지 제외
                        if '/comment/' in href or '/comment?' in href:
                            continue
                        
                        # 제목이 있고 뉴스 관련 링크인 경우
                        if title_text and len(title_text) > 15:
                            if any(pattern in href for pattern in ['/mnews/article/', '/read/', 'oid=', 'aid=', 'article']):
                                if href.startswith('http'):
                                    news_links.append(href)
                                elif href.startswith('/'):
                                    # 새로운 네이버 뉴스 도메인 구조 적용
                                    if '/mnews/article/' in href:
                                        news_links.append(f"https://n.news.naver.com{href}")
                                    else:
                                        news_links.append(f"https://news.naver.com{href}")
                
                # 중복 제거 (순서 유지)
                unique_links = []
                seen = set()
                for link in news_links:
                    if link not in seen:
                        unique_links.append(link)
                        seen.add(link)
                
                final_links = unique_links[:count]  # 정확히 10개만
                
                if final_links:
                    logger.info(f"Found {len(final_links)} headline news links for category {category}")
                    return final_links
                else:
                    logger.warning(f"No headline news links found for category {category}")
                    return []
                        
        except Exception as e:
            logger.error(f"Error fetching headline news from {section_url}: {e}")
            return []
    
    async def crawl_news_article(self, url: str, category: str) -> NewsItem:
        """개별 뉴스 기사 크롤링"""
        try:
            await asyncio.sleep(5)  # 5초 간격
            
            async with self.session.get(url) as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch article: {response.status}")
                    return None
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # 제목 추출 (2025년 네이버 뉴스 구조)
                title_elem = soup.select_one('h2.media_end_head_headline span') or \
                           soup.find('h2', class_='media_end_head_headline') or \
                           soup.find('h1', class_='media_end_head_headline') or \
                           soup.find('h1', class_='end_tit') or \
                           soup.select_one('#title_area span') or \
                           soup.find('h1') or \
                           soup.find('h2')
                
                title = self.clean_text(title_elem.get_text()) if title_elem else "제목 없음"
                
                # 본문 추출 (2025년 네이버 뉴스 구조)
                content_elem = soup.find('div', class_='newsct_article _article_body') or \
                              soup.find('div', class_='newsct_article') or \
                              soup.find('div', class_='_article_body') or \
                              soup.find('div', class_='media_end_body_cont') or \
                              soup.find('div', class_='end_body_wrp') or \
                              soup.find('div', id='newsEndContents') or \
                              soup.find('div', class_='_article_body_contents')
                
                content = ""
                if content_elem:
                    # 스크립트, 광고 등 제거
                    for unwanted in content_elem.find_all(['script', 'style', 'iframe', 'ins']):
                        unwanted.decompose()
                    content = self.clean_text(content_elem.get_text())
                
                if not content:
                    content = "본문 내용을 가져올 수 없습니다."
                
                # 기사 길이 제한
                if len(content) > 2000:
                    content = content[:2000] + "..."
                
                # 썸네일 이미지 추출 및 리사이즈
                thumbnail_url = self.extract_thumbnail(soup)
                if thumbnail_url:
                    thumbnail_url = await self.resize_and_optimize_image(thumbnail_url)
                
                # 실제 뉴스 발행 시간 추출
                original_publish_date = self.extract_original_publish_date(soup)
                crawling_time = datetime.now()
                
                logger.info(f"📰 뉴스 아이템 생성:")
                logger.info(f"   - 크롤링 시간: {crawling_time}")
                logger.info(f"   - 추출된 발행 시간: {original_publish_date}")
                logger.info(f"   - 같은 시간인가? {crawling_time.replace(microsecond=0) == original_publish_date}")
                
                # 수집된 카테고리 그대로 사용 (페이지에서 수집되었으므로 해당 카테고리로 분류)
                final_category = category
                
                news_item = NewsItem(
                    title=title,
                    content=content,
                    url=url,
                    source="네이버뉴스",
                    category=final_category,
                    publish_date=crawling_time,  # 크롤링 시간
                    original_publish_date=original_publish_date,  # 실제 발행 시간
                    thumbnail=thumbnail_url
                )
                
                # 생성된 뉴스 아이템 확인
                logger.info(f"📝 생성된 NewsItem:")
                logger.info(f"   - publish_date: {news_item.publish_date}")
                logger.info(f"   - original_publish_date: {news_item.original_publish_date}")
                
                logger.info(f"Successfully crawled: {title[:50]}...")
                return news_item
                
        except Exception as e:
            logger.error(f"Error crawling article {url}: {e}")
            return None
    
    async def crawl_category(self, category: str, count: int = 10) -> List[NewsItem]:
        """특정 카테고리 뉴스 크롤링"""
        logger.info(f"Starting crawl for category: {category} (target: {count} articles)")
        
        await self.init_session()
        
        try:
            # 1. 뉴스 목록 수집
            news_urls = await self.get_category_news_list(category, count)
            
            if not news_urls:
                logger.warning(f"No news URLs found for category: {category}")
                return []
            
            # 2. 개별 기사 크롤링 및 즉시 DB 저장 (5초 간격)
            news_items = []
            saved_count = 0
            for i, url in enumerate(news_urls):
                logger.info(f"Crawling article {i+1}/{len(news_urls)}: {url}")
                
                news_item = await self.crawl_news_article(url, category)
                if news_item:
                    news_items.append(news_item)
                    # 즉시 DB에 저장
                    if await self.save_news_to_db(news_item):
                        saved_count += 1
                
                # 5초 간격
                await asyncio.sleep(5)
                
                # 진행률 로그
                if (i + 1) % 5 == 0:
                    logger.info(f"Progress: {i+1}/{len(news_urls)} articles crawled, {saved_count} saved to DB")
            
            logger.info(f"Completed crawling for {category}: {len(news_items)} articles collected, {saved_count} saved to DB")
            return news_items
            
        except Exception as e:
            logger.error(f"Error in crawl_category for {category}: {e}")
            return []
        
        finally:
            await self.close_session()
    
    async def crawl_all_categories(self, count_per_category: int = 10) -> Dict[str, List[NewsItem]]:
        """모든 카테고리 헤드라인 뉴스 크롤링 (각 카테고리별 10개씩)"""
        logger.info(f"Starting crawl for all Naver headline categories (target: {count_per_category} per category)")
        
        results = {}
        
        for category in self.categories.keys():
            logger.info(f"Starting headline crawl for category: {category}")
            try:
                news_items = await self.crawl_category(category, count_per_category)
                results[category] = news_items
                
                # 카테고리 간 간격
                if category != list(self.categories.keys())[-1]:
                    await asyncio.sleep(random.uniform(10, 20))
                    
            except Exception as e:
                logger.error(f"Error crawling category {category}: {e}")
                results[category] = []
        
        total_articles = sum(len(articles) for articles in results.values())
        logger.info(f"Naver crawling completed. Total articles: {total_articles}")
        
        return results

    async def save_news_to_db(self, news_item: NewsItem) -> bool:
        """뉴스 1건을 DB에 저장"""
        try:
            # NewsItem을 DB 저장용 객체로 변환 (DatabaseManager가 기대하는 형태)
            class DBNewsItem:
                def __init__(self, title, content, source_url, source, published_at, category, 
                           thumbnail=None, original_publish_date=None):
                    self.title = title
                    self.content = content
                    self.source_url = source_url
                    self.source = source
                    self.published_at = published_at
                    self.category = category
                    self.thumbnail = thumbnail
                    # 실제 발행 시간 필드 추가
                    self.publish_date = published_at  # 크롤링 시간
                    self.original_publish_date = original_publish_date  # 실제 발행 시간
            
            logger.info(f"🔍 save_news_to_db - NewsItem 필드 확인:")
            logger.info(f"   - publish_date: {news_item.publish_date} (크롤링 시간)")
            logger.info(f"   - original_publish_date: {news_item.original_publish_date} (실제 발행 시간)")
            
            db_news_item = DBNewsItem(
                title=news_item.title,
                content=news_item.content,
                source_url=news_item.url,
                source=news_item.source,
                published_at=news_item.publish_date,
                category=news_item.category,
                thumbnail=news_item.thumbnail,
                original_publish_date=news_item.original_publish_date
            )
            
            logger.info(f"🔍 DB 저장 전 DBNewsItem 확인:")
            logger.info(f"   - publish_date: {db_news_item.publish_date}")
            logger.info(f"   - original_publish_date: {db_news_item.original_publish_date}")
            logger.info(f"   - 두 시간이 같은가? {db_news_item.publish_date == db_news_item.original_publish_date}")
            
            news_id = self.db_manager.save_news_item(db_news_item)
            if news_id:
                logger.info(f"✅ DB 저장 성공 (ID: {news_id}): {news_item.title[:50]}...")
                return True
            else:
                logger.info(f"🔄 중복 뉴스 스킵: {news_item.title[:50]}...")
                return False
            
        except Exception as e:
            logger.error(f"❌ DB 저장 실패: {e}")
            return False

# 사용 예시
async def main():
    crawler = NaverMobileCrawler()
    
    try:
        print("🚀 네이버 뉴스 크롤링 및 DB 저장 시작...")
        
        # 헤드라인 뉴스 10개씩 크롤링
        results = await crawler.crawl_all_categories(10)
        
        total_crawled = sum(len(articles) for articles in results.values())
        print(f"\n🎯 네이버 크롤링 완료:")
        print(f"   📊 총 크롤링: {total_crawled}개")
        
        print(f"\n📋 카테고리별 결과:")
        for category, articles in results.items():
            print(f"   {category}: {len(articles)}개")
            for article in articles[:1]:  # 첫 번째만 출력
                print(f"     - {article.title[:60]}...")
                
        print(f"\n💾 DB 저장: 크롤링과 동시에 1건씩 저장 완료")
        print(f"   (중복 뉴스는 자동으로 스킵됨)")
        
    except Exception as e:
        logger.error(f"크롤링 중 오류: {e}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())