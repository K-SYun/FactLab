#!/usr/bin/env python3
"""
다음 뉴스 source 수정 스크립트
기존에 "알수없음"으로 저장된 다음 뉴스들의 source를 실제로 추출해서 업데이트
"""

import asyncio
import aiohttp
import logging
from bs4 import BeautifulSoup
import sys
import os
from pathlib import Path

# 프로젝트 루트 경로 추가
project_root = Path(__file__).parent
sys.path.append(str(project_root))

from app.database.db_manager import DatabaseManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DaumSourceFixer:
    def __init__(self):
        self.db_manager = DatabaseManager()
        self.session = None
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
            logger.info("HTTP 세션 초기화 완료")
    
    async def close_session(self):
        """HTTP 세션 종료"""
        if self.session:
            await self.session.close()
            self.session = None
            logger.info("HTTP 세션 종료")
    
    def extract_news_source(self, soup: BeautifulSoup) -> str:
        """다음 뉴스에서 실제 언론사명 추출 (수정된 로직 적용)"""
        try:
            # 1순위: og:article:author 메타태그
            meta_og_author = soup.find('meta', property='og:article:author')
            if meta_og_author and meta_og_author.get('content'):
                source = meta_og_author['content'].strip()
                if source and len(source) < 30:
                    logger.info(f"✅ og:article:author에서 언론사명 추출: {source}")
                    return source
            
            # 2순위: og:site_name에서 추출 (다음 - 언론사명 형태)
            meta_og_site_name = soup.find('meta', property='og:site_name')
            if meta_og_site_name and meta_og_site_name.get('content'):
                site_name = meta_og_site_name['content'].strip()
                if site_name and '다음 -' in site_name:
                    # "다음 - 헤럴드경제" 형태에서 언론사명만 추출
                    source = site_name.split('다음 -')[-1].strip()
                    if source and len(source) < 30:
                        logger.info(f"✅ og:site_name에서 언론사명 추출: {source}")
                        return source
                        
            # 3순위: 기존 article:author도 확인 (호환성)
            meta_source = soup.find('meta', property='article:author')
            if meta_source and meta_source.get('content'):
                source = meta_source['content'].strip()
                if source and len(source) < 30:
                    logger.info(f"✅ article:author에서 언론사명 추출: {source}")
                    return source

            # 4순위: 다음 뉴스 구조에서 언론사명 추출
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
                            logger.info(f"✅ 이미지 alt에서 언론사명 추출: {alt_text}")
                            return alt_text
                    
                    # 텍스트 요소에서 추출
                    text = element.get_text().strip()
                    if text and len(text) > 1 and len(text) < 20:
                        logger.info(f"✅ 텍스트에서 언론사명 추출: {text}")
                        return text
                        
                    # 링크의 title 속성에서 추출
                    title_text = element.get('title', '').strip()
                    if title_text and '언론사' not in title_text and len(title_text) < 20:
                        logger.info(f"✅ title 속성에서 언론사명 추출: {title_text}")
                        return title_text
            
            # 추출 실패 시 기본값 유지
            logger.warning("⚠️ 언론사명 추출 실패")
            return "알수없음"
            
        except Exception as e:
            logger.error(f"❌ 언론사명 추출 실패: {e}")
            return "알수없음"
    
    async def fetch_news_source(self, url: str) -> str:
        """개별 뉴스 URL에서 언론사명 추출"""
        try:
            await asyncio.sleep(2)  # 요청 간격
            
            async with self.session.get(url) as response:
                if response.status != 200:
                    logger.error(f"HTTP {response.status}: {url}")
                    return "알수없음"
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                source = self.extract_news_source(soup)
                return source
                
        except Exception as e:
            logger.error(f"뉴스 소스 추출 실패 {url}: {e}")
            return "알수없음"
    
    async def fix_daum_sources(self):
        """다음 뉴스 source 일괄 수정"""
        logger.info("🔧 다음 뉴스 source 수정 시작...")
        
        # 1. "알수없음"으로 된 다음 뉴스들 조회
        daum_news = self.db_manager.get_daum_news_with_unknown_source()
        
        if not daum_news:
            logger.info("수정할 다음 뉴스가 없습니다.")
            return
        
        logger.info(f"수정 대상: {len(daum_news)}개 다음 뉴스")
        
        await self.init_session()
        
        updated_count = 0
        
        try:
            for news in daum_news:
                news_id = news['id']
                url = news['url']
                current_source = news.get('source', '알수없음')
                
                logger.info(f"수정 중: [{news_id}] {url}")
                
                # 실제 URL에서 언론사명 추출
                new_source = await self.fetch_news_source(url)
                
                if new_source and new_source != "알수없음" and new_source != current_source:
                    # DB 업데이트
                    success = self.db_manager.update_news_source(news_id, new_source)
                    if success:
                        updated_count += 1
                        logger.info(f"✅ 업데이트 완료: [{news_id}] {current_source} → {new_source}")
                    else:
                        logger.error(f"❌ DB 업데이트 실패: [{news_id}]")
                else:
                    logger.warning(f"⚠️ 언론사명 추출 실패 또는 변경 없음: [{news_id}] {new_source}")
        
        finally:
            await self.close_session()
        
        logger.info(f"🎯 다음 뉴스 source 수정 완료: {updated_count}/{len(daum_news)}개 업데이트")

async def main():
    fixer = DaumSourceFixer()
    await fixer.fix_daum_sources()

if __name__ == "__main__":
    asyncio.run(main())