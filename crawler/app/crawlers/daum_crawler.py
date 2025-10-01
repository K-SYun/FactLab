"""
다음 모바일 뉴스 크롤러
- 다음 모바일 사이트에서 카테고리별 뉴스 수집
- 2시간 간격, 5초당 1개씩 20개 크롤링
"""

import asyncio
import aiohttp
import logging
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Dict
import re
import hashlib
from urllib.parse import urljoin, quote
import random
from dataclasses import dataclass
import sys
import os
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
    publish_date: datetime
    thumbnail: str = None
    url_hash: str = None
    
    def __post_init__(self):
        if self.url_hash is None:
            self.url_hash = hashlib.md5(self.url.encode()).hexdigest()

class DaumMobileCrawler:
    def __init__(self):
        self.base_url = "https://m.media.daum.net"
        self.session = None
        
        # 데이터베이스 매니저 초기화
        self.db_manager = DatabaseManager()
        
        # 다음 모바일 카테고리 매핑
        self.categories = {
            "politics": {"code": "politics", "name": "정치"},
            "economy": {"code": "economic", "name": "경제"},
            "society": {"code": "society", "name": "사회"},
            "technology": {"code": "digital", "name": "IT/과학"},
            "world": {"code": "foreign", "name": "세계"},
            "environment": {"code": "climate", "name": "기후/환경"}
        }
        
        # 모바일 User-Agent
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Referer': 'https://m.media.daum.net/'
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
            logger.info("Daum mobile crawler session initialized")
    
    async def close_session(self):
        """HTTP 세션 종료"""
        if self.session:
            await self.session.close()
            self.session = None
            logger.info("Daum mobile crawler session closed")
    
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
                        poster = f"https://media.daum.net{poster}"
                    elif not poster.startswith('http'):
                        poster = f"https://{poster}"
                    logger.debug(f"video poster 발견: {poster}")
                    return poster
            
            # 2순위: 다음 동영상 특화 패턴
            daum_video_selectors = [
                # 다음 동영상 썸네일 클래스
                'img[class*="video"]',
                'img[class*="thumbnail"]',
                '.video_thumb img',
                '.video_thumbnail img',
                '.article_video img',
                'img[src*="video"]',
                'img[src*="thumb"]'
            ]
            
            for selector in daum_video_selectors:
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
        """썸네일 이미지 URL 추출 (동영상 썸네일 우선, 본문 이미지 포함, 언론사 로고 제외)"""
        try:
            # 언론사 로고나 부적절한 이미지를 필터링할 키워드 (강화)
            # 'thumb' 제거: 다음 CDN에서 thumb은 이미지 리사이징 서비스명이므로 필터링하면 안됨
            skip_keywords_url = [
                'logo', 'icon', 'button', 'banner', 'ad', 'advertisement', 
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
                # 다음 특화
                '다음', 'daum', 'kakao', '카카오',
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
                '.news_view .article_view img:not([class*="logo"]):not([class*="icon"])',
                '.article_view img:not([class*="logo"]):not([class*="icon"])',
                '.news_content img:not([class*="logo"]):not([class*="icon"])',
                '.article_body img:not([class*="logo"]):not([class*="icon"])',
                
                # 2순위: 다음 뉴스 메인 이미지
                '.news_view img',
                '.article_view img',
                
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
                '.news_view', '.article_view', '.news_content', '.article_body'
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
            # 다음 CDN의 thumb은 섬네일 서비스이므로 제외하고, 실제 작은 크기만 필터링
            small_sizes = [
                '16x16', '24x24', '32x32', '48x48', '64x64', '80x80',
                '16_16', '24_24', '32_32', '48_48', '64_64', '80_80',
                'small', 'mini', 'tiny'
            ]
            # daumcdn.net의 thumb 서비스는 제외 (실제로는 큰 이미지임)
            if not 'daumcdn.net/thumb' in src_lower:
                if any(size in src_lower for size in small_sizes):
                    logger.debug(f"이미지 크기가 너무 작음: {src}")
                    return False
            
            # 다음 특정 로고/아이콘 패턴 제외
            daum_logo_patterns = [
                't1.daumcdn.net/news/logo', 'img.daumcdn.net/logo',
                'daumcdn.net/static', 'kakao.com/logo', 'daum.net/favicon'
            ]
            if any(pattern in src_lower for pattern in daum_logo_patterns):
                logger.debug(f"다음 로고 패턴 필터링: {src}")
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
    
    def extract_news_source(self, soup: BeautifulSoup) -> str:
        """다음 뉴스에서 실제 언론사명 추출"""
        try:
            # 1순위: 다음 뉴스 구조에서 언론사명 추출
            source_selectors = [
                '.info_news .txt_info',  # 다음 뉴스 정보 영역
                '.head_view .info_news .link_cp',  # 언론사 링크
                '.info_news .txt_cp',  # 언론사명
                '.news_cp img',  # 언론사 로고 이미지의 alt
                '.cp_name',  # 언론사명 클래스
                '.source',  # 출처
                '.media_cp_name',  # 미디어 언론사명
            ]
            
            for selector in source_selectors:
                elements = soup.select(selector)
                for element in elements:
                    # img 태그의 alt 속성에서 추출
                    if element.name == 'img':
                        alt_text = element.get('alt', '').strip()
                        if alt_text and alt_text not in ['logo', 'icon', '로고']:
                            logger.info(f"✅ 다음 이미지 alt에서 언론사명 추출: {alt_text}")
                            return alt_text
                    
                    # 텍스트 요소에서 추출
                    text = element.get_text().strip()
                    if text and len(text) > 1 and len(text) < 20:
                        logger.info(f"✅ 다음 텍스트에서 언론사명 추출: {text}")
                        return text
                        
                    # 링크의 title 속성에서 추출
                    title_text = element.get('title', '').strip()
                    if title_text and '언론사' not in title_text and len(title_text) < 20:
                        logger.info(f"✅ 다음 title 속성에서 언론사명 추출: {title_text}")
                        return title_text
            
            # 2순위: meta 태그에서 출처 정보 추출
            # og:article:author 먼저 확인
            meta_og_author = soup.find('meta', property='og:article:author')
            if meta_og_author and meta_og_author.get('content'):
                source = meta_og_author['content'].strip()
                if source and len(source) < 30:  # 길이 제한 완화
                    logger.info(f"✅ 다음 meta og:article:author에서 언론사명 추출: {source}")
                    return source
            
            # og:site_name에서 추출 (다음 - 언론사명 형태)
            meta_og_site_name = soup.find('meta', property='og:site_name')
            if meta_og_site_name and meta_og_site_name.get('content'):
                site_name = meta_og_site_name['content'].strip()
                if site_name and '다음 -' in site_name:
                    # "다음 - 헤럴드경제" 형태에서 언론사명만 추출
                    source = site_name.split('다음 -')[-1].strip()
                    if source and len(source) < 30:
                        logger.info(f"✅ 다음 meta og:site_name에서 언론사명 추출: {source}")
                        return source
                        
            # 기존 article:author도 확인 (호환성)
            meta_source = soup.find('meta', property='article:author')
            if meta_source and meta_source.get('content'):
                source = meta_source['content'].strip()
                if source and len(source) < 30:
                    logger.info(f"✅ 다음 meta article:author에서 언론사명 추출: {source}")
                    return source
            
            # 3순위: JSON-LD에서 publisher 정보 추출
            script_tags = soup.find_all('script', type='application/ld+json')
            for script in script_tags:
                try:
                    import json
                    data = json.loads(script.get_text())
                    if isinstance(data, dict):
                        publisher = data.get('publisher', {})
                        if isinstance(publisher, dict) and 'name' in publisher:
                            publisher_name = publisher['name'].strip()
                            if publisher_name and len(publisher_name) < 20:
                                logger.info(f"✅ 다음 JSON-LD에서 언론사명 추출: {publisher_name}")
                                return publisher_name
                except Exception as e:
                    logger.debug(f"다음 JSON-LD 파싱 중 오류: {e}")
                    continue
            
            # 추출 실패 시 기본값
            logger.warning("⚠️ 다음 언론사명 추출 실패, 알수없음으로 처리")
            return "알수없음"
            
        except Exception as e:
            logger.error(f"❌ 다음 언론사명 추출 실패: {e}")
            return "알수없음"
    
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
                'Referer': 'https://news.daum.net/'
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
            filename = f"thumb_daum_{url_hash}_{timestamp}.jpg"
            
            # 썸네일 저장 디렉토리 생성
            thumb_dir = "/app/thumbnails"
            os.makedirs(thumb_dir, exist_ok=True)
            
            # 데스크탑용 썸네일 저장
            desktop_path = os.path.join(thumb_dir, filename)
            image_desktop.save(desktop_path, format='JPEG', quality=85, optimize=True)
            
            # 웹에서 접근 가능한 경로 반환 (nginx를 통해 서빙)
            web_path = f"/thumbnails/{filename}"
            logger.debug(f"다음 썸네일 저장 완료: {web_path} (크기: {image_desktop.size})")
            
            return web_path
            
        except Exception as e:
            logger.debug(f"이미지 리사이즈 실패 ({image_url}): {e}")
            return image_url  # 원본 URL 반환
    
    async def get_category_news_list(self, category: str, count: int = 20) -> List[str]:
        """카테고리별 뉴스 목록 URL 수집"""
        if category not in self.categories:
            logger.error(f"Invalid category: {category}")
            return []
        
        category_info = self.categories[category]
        # 다음 뉴스 카테고리 페이지 URL (모바일이 아닌 일반 페이지 사용)
        list_url = f"https://news.daum.net/{category_info['code']}"
        
        try:
            await asyncio.sleep(random.uniform(1, 3))  # 랜덤 지연
            
            async with self.session.get(list_url) as response:
                if response.status != 200:
                    logger.error(f"Failed to fetch news list: {response.status}")
                    return []
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # 뉴스 링크 추출
                news_links = []
                
                # 다음 뉴스 링크 패턴 (v.daum.net 형태)
                articles = soup.find_all('a', href=re.compile(r'v\.daum\.net/v/')) or \
                          soup.find_all('a', href=re.compile(r'/v/\d+')) or \
                          soup.find_all('div', class_='item_mainnews') or \
                          soup.find_all('strong', class_='tit_thumb') or \
                          soup.find_all('a')
                
                for article in articles[:count * 3]:  # 여유있게 수집
                    link_elem = article if article.name == 'a' else article.find('a')
                    
                    if link_elem and link_elem.get('href'):
                        href = link_elem['href']
                        
                        # 다음 뉴스 URL 정규화
                        if href.startswith('/v/'):
                            # /v/20250815105429103 형태를 https://v.daum.net/v/20250815105429103로 변환
                            full_url = f"https://v.daum.net{href}"
                        elif 'v.daum.net/v/' in href:
                            # 이미 완전한 URL
                            full_url = href
                        elif href.startswith('http') and 'v.daum.net' in href:
                            full_url = href
                        else:
                            continue
                        
                        # 실제 뉴스 기사인지 확인 (v.daum.net/v/ 패턴)
                        if ('v.daum.net/v/' in full_url and 
                            full_url not in news_links and 
                            len(full_url.split('/v/')[-1]) >= 10):  # ID가 충분히 긴지 확인
                            news_links.append(full_url)
                
                logger.info(f"Found {len(news_links)} news links for category {category}")
                return news_links[:count]
                
        except Exception as e:
            logger.error(f"Error fetching news list for {category}: {e}")
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
                
                # 제목 추출 - 다음 뉴스 구조에 맞게 수정
                title_elem = soup.find('h1', class_='tit_view') or \
                           soup.find('h3', class_='tit_view') or \
                           soup.find('h1', class_='news_title') or \
                           soup.find('h2', class_='news_title') or \
                           soup.find('h1') or \
                           soup.find('h2')
                
                title = self.clean_text(title_elem.get_text()) if title_elem else "제목 없음"
                
                # 다음 뉴스 특유의 불필요한 접두사 제거
                if title:
                    # "[숫자] 속보" 형태 제거
                    title = re.sub(r'^\[\d+\]\s*속보\s*', '', title)
                    # "[카테고리]" 형태 접두사 제거 (예: [정치], [경제] 등)
                    title = re.sub(r'^\[[^\]]+\]\s*', '', title)
                    # "속보:" 또는 "단독:" 등 접두사 제거
                    title = re.sub(r'^(속보|단독|긴급|특보)\s*[:：]\s*', '', title)
                    title = title.strip()
                
                # 본문 추출 - 다음 뉴스 구조
                content_elem = soup.find('div', class_='news_view') or \
                              soup.find('div', id='harmonyContainer') or \
                              soup.find('section', class_='news_view') or \
                              soup.find('div', class_='article_view')
                
                content = ""
                if content_elem:
                    # 스크립트, 광고 등 제거
                    for unwanted in content_elem.find_all(['script', 'style', 'iframe', 'ins', 'figure']):
                        unwanted.decompose()
                    
                    # 텍스트 추출
                    paragraphs = content_elem.find_all(['p', 'div'])
                    content_parts = []
                    
                    for p in paragraphs:
                        text = self.clean_text(p.get_text())
                        if text and len(text) > 10:  # 의미있는 텍스트만
                            content_parts.append(text)
                    
                    content = ' '.join(content_parts)
                
                if not content:
                    content = "본문 내용을 가져올 수 없습니다."
                
                # 기사 길이 제한
                if len(content) > 2000:
                    content = content[:2000] + "..."
                
                # 썸네일 이미지 추출 및 리사이즈
                thumbnail_url = self.extract_thumbnail(soup)
                if thumbnail_url:
                    thumbnail_url = await self.resize_and_optimize_image(thumbnail_url)
                
                # 실제 언론사명 추출
                actual_source = self.extract_news_source(soup)
                
                # 수집된 카테고리 그대로 사용 (페이지에서 수집되었으므로 해당 카테고리로 분류)
                final_category = category
                
                news_item = NewsItem(
                    title=title,
                    content=content,
                    url=url,
                    source=actual_source,  # 실제 언론사명 사용
                    category=final_category,
                    publish_date=datetime.now(),
                    thumbnail=thumbnail_url
                )
                
                logger.info(f"Successfully crawled: {title[:50]}...")
                return news_item
                
        except Exception as e:
            logger.error(f"Error crawling article {url}: {e}")
            return None

    async def save_news_to_db(self, news_item: NewsItem) -> bool:
        """뉴스 1건을 DB에 저장"""
        try:
            # NewsItem에 source_url이 없으면 url 값으로 설정
            if not hasattr(news_item, 'source_url'):
                setattr(news_item, 'source_url', news_item.url)

            news_id = self.db_manager.save_news_item(news_item)
            if news_id:
                return True
            else:
                return False

        except Exception as e:
            logger.error(f"❌ DB 저장 실패: {e}")
            return False

    async def crawl_category(self, category: str, count: int = 20) -> List[NewsItem]:
        """특정 카테고리 뉴스 크롤링"""
        logger.info(f"Starting crawl for category: {category} (target: {count} articles)")
        
        await self.init_session()
        
        try:
            # 1. 뉴스 목록 수집
            news_urls = await self.get_category_news_list(category, count)
            
            if not news_urls:
                logger.warning(f"No news URLs found for category: {category}")
                return []
            
            # 2. 개별 기사 크롤링 (5초 간격) - 즉시 DB 저장
            news_items = []
            saved_count = 0
            for i, url in enumerate(news_urls):
                logger.info(f"Crawling article {i+1}/{len(news_urls)}: {url}")

                news_item = await self.crawl_news_article(url, category)
                if news_item:
                    news_items.append(news_item)

                    # 즉시 DB 저장
                    if await self.save_news_to_db(news_item):
                        saved_count += 1
                        logger.info(f"✅ DB 저장 완료: {news_item.title[:50]}")

                # 진행률 로그
                if (i + 1) % 5 == 0:
                    logger.info(f"Progress: {i+1}/{len(news_urls)} articles crawled, {saved_count} saved")
            
            logger.info(f"Completed crawling for {category}: {len(news_items)} articles collected")
            return news_items
            
        except Exception as e:
            logger.error(f"Error in crawl_category for {category}: {e}")
            return []
        
        finally:
            await self.close_session()
    
    async def crawl_all_categories(self, count_per_category: int = 20) -> Dict[str, List[NewsItem]]:
        """모든 카테고리 뉴스 크롤링"""
        logger.info(f"Starting crawl for all Daum categories (target: {count_per_category} per category)")
        
        results = {}
        
        for category in self.categories.keys():
            logger.info(f"Starting crawl for category: {category}")
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
        logger.info(f"Daum crawling completed. Total articles: {total_articles}")
        
        return results
    
    async def save_to_database(self, news_items: List[NewsItem]) -> Dict[str, int]:
        """뉴스 아이템들을 데이터베이스에 저장"""
        if not news_items:
            return {"saved": 0, "duplicates": 0, "errors": 0}
        
        try:
            # NewsItem을 DB 저장용 객체로 변환 (DatabaseManager가 기대하는 형태)
            class DBNewsItem:
                def __init__(self, title, content, source_url, source, published_at, category, thumbnail=None):
                    self.title = title
                    self.content = content
                    self.source_url = source_url
                    self.source = source
                    self.published_at = published_at
                    self.category = category
                    self.thumbnail = thumbnail
            
            db_news_items = []
            for item in news_items:
                db_news_items.append(DBNewsItem(
                    title=item.title,
                    content=item.content,
                    source_url=item.url,
                    source=item.source,
                    published_at=item.publish_date,
                    category=item.category,
                    thumbnail=item.thumbnail
                ))
            
            result = self.db_manager.save_news_batch(db_news_items)
            logger.info(f"DB 저장 결과: {result}")
            return result
            
        except Exception as e:
            logger.error(f"DB 저장 중 오류: {e}")
            return {"saved": 0, "duplicates": 0, "errors": len(news_items)}
    
    async def crawl_and_save_all_categories(self, count_per_category: int = 3) -> Dict[str, any]:
        """모든 카테고리 크롤링하고 DB에 저장"""
        logger.info(f"🚀 다음 뉴스 크롤링 및 DB 저장 시작 (카테고리당 {count_per_category}개)")
        
        # 크롤링 실행
        results = await self.crawl_all_categories(count_per_category)
        
        # 모든 뉴스 아이템 수집
        all_news = []
        for category, news_items in results.items():
            all_news.extend(news_items)
        
        # DB에 저장
        save_result = await self.save_to_database(all_news)
        
        logger.info(f"✅ 다음 크롤링 완료: 총 {len(all_news)}개 수집, {save_result['saved']}개 저장")
        
        return {
            "crawled": len(all_news),
            "saved": save_result['saved'],
            "duplicates": save_result['duplicates'],
            "errors": save_result['errors'],
            "results": results
        }

# 사용 예시
async def main():
    crawler = DaumMobileCrawler()
    
    try:
        # DB 저장을 포함한 전체 크롤링 실행
        result = await crawler.crawl_and_save_all_categories(3)
        
        print(f"\n🎯 다음 크롤링 및 DB 저장 결과:")
        print(f"   📊 크롤링: {result['crawled']}개")
        print(f"   💾 저장: {result['saved']}개") 
        print(f"   🔄 중복: {result['duplicates']}개")
        print(f"   ❌ 오류: {result['errors']}개")
        
        print(f"\n📋 카테고리별 상세:")
        for category, articles in result['results'].items():
            print(f"   {category}: {len(articles)}개")
            for article in articles[:1]:  # 각 카테고리 첫 번째만 출력
                print(f"     - {article.title[:50]}...")
                
    except Exception as e:
        logger.error(f"크롤링 중 오류: {e}")
    finally:
        await crawler.close_session()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())