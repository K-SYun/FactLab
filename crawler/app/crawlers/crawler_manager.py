"""
통합 크롤링 매니저
- 네이버/다음 모바일, 구글 RSS 크롤링 통합 관리
- 2시간 간격 분산 스케줄링 (네이버: 정시, 다음: 20분, 구글: 40분)
- 비동기 처리로 크롤링 → DB 저장 (AI 분석은 관리자에서 별도 실행)
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import sys
import os
from pathlib import Path

# 프로젝트 루트 경로 추가
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from app.database.db_manager import DatabaseManager
from app.localization.messages import msg

# 각 크롤러 import
from .naver_crawler import NaverMobileCrawler
from .daum_crawler import DaumMobileCrawler  

from .nass_crawler import NassApiCrawler

# 스케줄링
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

logger = logging.getLogger(__name__)

class NewsItem:
    """공통 뉴스 아이템 클래스"""
    def __init__(self, title: str, content: str, source: str, source_url: str, 
                 published_at: datetime, category: str = None, thumbnail: str = None):
        self.title = title
        self.content = content
        self.source = source
        self.source_url = source_url
        self.published_at = published_at
        self.category = category
        self.thumbnail = thumbnail

class UnifiedCrawlerManager:
    def __init__(self, database_url: str = None):
        """통합 크롤링 매니저 초기화"""
        self.database_url = database_url
        # DatabaseManager 초기화 (항상 필요)
        self.db_manager = DatabaseManager()
        
        # 크롤러 초기화
        self.naver_crawler = NaverMobileCrawler()
        self.daum_crawler = DaumMobileCrawler()

        self.nass_crawler = NassApiCrawler()
        
        # 스케줄러 설정
        self.scheduler = AsyncIOScheduler(timezone=pytz.timezone('Asia/Seoul'))
        
        # 크롤링 설정 (헤드라인 뉴스 중심)
        self.articles_per_category = 10  # 헤드라인 뉴스 10개씩
        self.crawl_interval_minutes = 5  # 각 기사 간격
        
        # 지원 카테고리
        self.categories = [
            "politics", "economy", "society", "technology", 
            "world", "entertainment", "sports", "environment"
        ]
    
    def convert_mobile_to_standard_newsitem(self, mobile_item, source_prefix: str) -> NewsItem:
        """모바일 크롤러 NewsItem을 표준 NewsItem으로 변환"""
        # 실제 언론사명이 추출되었으면 사용 - 각 크롤러에서 이미 추출 완료됨
        actual_source = getattr(mobile_item, 'source', None)
        if not actual_source:  # source 속성이 없는 경우만 폴백
            actual_source = f"{source_prefix}뉴스"  # 기본값으로 폴백
        # "알수없음"은 유효한 추출 결과이므로 그대로 사용
            
        # 썸네일 정보 확인
        thumbnail = getattr(mobile_item, 'thumbnail', None)
            
        return NewsItem(
            title=mobile_item.title,
            content=mobile_item.content,
            source=actual_source,  # 실제 추출된 언론사명 사용
            source_url=mobile_item.url,  # DaumMobileCrawler는 url 속성 사용
            published_at=mobile_item.publish_date,
            category=mobile_item.category,
            thumbnail=thumbnail  # 썸네일 정보 추가
        )
    
    async def crawl_naver_news(self) -> Dict[str, int]:
        """네이버 모바일 뉴스 크롤링"""
        start_time = datetime.now()
        logger.info(f"🔥 네이버 뉴스 크롤링 시작 - {start_time}")
        
        try:
            # 모든 카테고리 크롤링
            results = await self.naver_crawler.crawl_all_categories(self.articles_per_category)
            
            total_saved = 0
            category_stats = {}
            
            for category, mobile_items in results.items():
                # 모바일 NewsItem을 표준 NewsItem으로 변환
                standard_items = [
                    self.convert_mobile_to_standard_newsitem(item, "네이버")
                    for item in mobile_items
                ]
                
                if standard_items:
                    if self.db_manager:
                        result = self.db_manager.save_news_batch(standard_items)
                        saved = result.get('saved', 0)
                    else:
                        saved = await self.save_to_factlab_db(standard_items, "naver")
                    
                    total_saved += saved
                    category_stats[category] = {
                        'crawled': len(mobile_items),
                        'saved': saved
                    }
                    logger.info(f"네이버 {category}: {saved}개 저장")
                else:
                    category_stats[category] = {'crawled': 0, 'saved': 0}
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            logger.info(f"✅ 네이버 크롤링 완료 - 총 {total_saved}개 저장, {duration:.1f}초 소요")
            
            # 로그 저장
            await self.log_crawl_result("naver", total_saved, duration, "SUCCESS", category_stats)
            
            return {
                'source': 'naver',
                'total_saved': total_saved,
                'duration': duration,
                'categories': category_stats
            }
            
        except Exception as e:
            logger.error(f"❌ 네이버 크롤링 오류: {e}")
            await self.log_crawl_result("naver", 0, 0, f"ERROR: {str(e)}")
            return {'source': 'naver', 'total_saved': 0, 'error': str(e)}
    
    async def crawl_daum_news(self) -> Dict[str, int]:
        """다음 모바일 뉴스 크롤링"""
        start_time = datetime.now()
        logger.info(f"🔥 다음 뉴스 크롤링 시작 - {start_time}")
        
        try:
            # 모든 카테고리 크롤링
            results = await self.daum_crawler.crawl_all_categories(self.articles_per_category)
            
            total_saved = 0
            category_stats = {}
            
            for category, mobile_items in results.items():
                # 모바일 NewsItem을 표준 NewsItem으로 변환
                standard_items = [
                    self.convert_mobile_to_standard_newsitem(item, "다음")
                    for item in mobile_items
                ]
                
                if standard_items:
                    if self.db_manager:
                        result = self.db_manager.save_news_batch(standard_items)
                        saved = result.get('saved', 0)
                    else:
                        saved = await self.save_to_factlab_db(standard_items, "daum")
                    
                    total_saved += saved
                    category_stats[category] = {
                        'crawled': len(mobile_items),
                        'saved': saved
                    }
                    logger.info(f"다음 {category}: {saved}개 저장")
                else:
                    category_stats[category] = {'crawled': 0, 'saved': 0}
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            logger.info(f"✅ 다음 크롤링 완료 - 총 {total_saved}개 저장, {duration:.1f}초 소요")
            
            # 로그 저장
            await self.log_crawl_result("daum", total_saved, duration, "SUCCESS", category_stats)
            
            return {
                'source': 'daum',
                'total_saved': total_saved,
                'duration': duration,
                'categories': category_stats
            }
            
        except Exception as e:
            logger.error(f"❌ 다음 크롤링 오류: {e}")
            await self.log_crawl_result("daum", 0, 0, f"ERROR: {str(e)}")
            return {'source': 'daum', 'total_saved': 0, 'error': str(e)}
    


    async def crawl_bills(self, days: int = 30) -> Dict[str, int]:
        """국회 법안 크롤링"""
        start_time = datetime.now()
        logger.info(f"🔥 국회 법안 크롤링 시작 - {start_time}")
        
        try:
            async with self.nass_crawler as crawler:
                bills = await crawler.crawl_recent_bills(days=days)
                
                if self.db_manager:
                    result = self.db_manager.save_bills_batch(bills)
                    saved = result.get('saved', 0)
                else:
                    saved = 0

                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                
                logger.info(f"✅ 국회 법안 크롤링 완료 - 총 {saved}개 저장, {duration:.1f}초 소요")
                
                await self.log_crawl_result("nass", saved, duration, "SUCCESS")
                
                return {
                    'source': 'nass',
                    'total_saved': saved,
                    'duration': duration
                }

        except Exception as e:
            logger.error(f"❌ 국회 법안 크롤링 오류: {e}")
            await self.log_crawl_result("nass", 0, 0, f"ERROR: {str(e)}")
            return {'source': 'nass', 'total_saved': 0, 'error': str(e)}
    
    async def save_to_factlab_db(self, news_items: List[NewsItem], source: str) -> int:
        """FactLab 데이터베이스에 저장 (PostgreSQL 직접 연결)"""
        if not self.database_url:
            logger.warning("Database URL not provided, skipping save")
            return 0
        
        import psycopg2
        from psycopg2.extras import RealDictCursor
        
        conn = psycopg2.connect(self.database_url, cursor_factory=RealDictCursor)
        saved_count = 0
        
        try:
            cursor = conn.cursor()
            
            for news_item in news_items:
                try:
                    # 중복 체크 (URL 기준)
                    cursor.execute("SELECT id FROM news WHERE url = %s", (news_item.source_url,))
                    existing = cursor.fetchone()
                    
                    if existing:
                        logger.debug(f"중복 뉴스 건너뛰기: {news_item.source_url}")
                        continue
                    
                    # 뉴스 삽입
                    cursor.execute("""
                        INSERT INTO news (title, content, url, source, publish_date, category, status, created_at, updated_at, thumbnail)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, (
                        news_item.title,
                        news_item.content,
                        news_item.source_url,
                        news_item.source,
                        news_item.published_at,
                        news_item.category,
                        'PENDING',  # 크롤링 후 관리자 승인 대기
                        datetime.now(),
                        datetime.now(),
                        news_item.thumbnail  # 썸네일 정보 추가
                    ))
                    
                    result = cursor.fetchone()
                    logger.debug(f"INSERT 쿼리 결과: {result}")
                    if result:
                        news_id = result['id']  # RealDictCursor는 컬럼명으로 접근
                    else:
                        logger.error("INSERT 쿼리가 ID를 반환하지 않았습니다")
                        continue
                    saved_count += 1
                    logger.debug(f"뉴스 저장 완료 ID {news_id}: {news_item.title[:50]}...")
                    
                except Exception as e:
                    logger.error(f"뉴스 저장 오류: {type(e).__name__}: {str(e)}")
                    logger.error(f"뉴스 정보: title={news_item.title[:50]}, url={news_item.source_url}")
                    import traceback
                    logger.error(f"스택 트레이스: {traceback.format_exc()}")
                    conn.rollback()
                    continue
            
            conn.commit()
            logger.info(f"{source}에서 {saved_count}개 뉴스 저장 완료")
            return saved_count
            
        except Exception as e:
            conn.rollback()
            logger.error(f"{source} 뉴스 저장 중 데이터베이스 오류: {e}")
            return 0
        finally:
            cursor.close()
            conn.close()
    
    async def log_crawl_result(self, source: str, articles_saved: int, duration: float, 
                              status: str, category_stats: Dict = None):
        """크롤링 결과 로그 저장"""
        if not self.database_url:
            return
        
        import psycopg2
        from psycopg2.extras import RealDictCursor
        import json
        
        conn = psycopg2.connect(self.database_url, cursor_factory=RealDictCursor)
        
        try:
            cursor = conn.cursor()
            
            # 크롤링 로그 테이블이 없으면 생성
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS crawl_logs (
                    id SERIAL PRIMARY KEY,
                    source VARCHAR(50) NOT NULL,
                    articles_saved INTEGER DEFAULT 0,
                    duration_seconds FLOAT DEFAULT 0,
                    status VARCHAR(100) NOT NULL,
                    category_stats JSONB DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                INSERT INTO crawl_logs (source, articles_saved, duration_seconds, status, category_stats, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                source, 
                articles_saved, 
                duration, 
                status, 
                json.dumps(category_stats) if category_stats else None,
                datetime.now()
            ))
            
            conn.commit()
            
        except Exception as e:
            logger.error(f"크롤링 로그 저장 오류: {e}")
            conn.rollback()
        finally:
            cursor.close()
            conn.close()
    
    def setup_schedule(self):
        """크롤링 스케줄 설정 - 매일 아침 7시 실행"""
        logger.info("🕐 크롤링 스케줄 설정 중...")
        
        # 네이버: 매일 아침 7시 00분
        self.scheduler.add_job(
            self.crawl_naver_news,
            CronTrigger(hour=7, minute=0, second=0),
            id='naver_crawl',
            max_instances=1,
            coalesce=True
        )
        
        # 다음: 매일 아침 7시 10분
        self.scheduler.add_job(
            self.crawl_daum_news,
            CronTrigger(hour=7, minute=10, second=0),
            id='daum_crawl',
            max_instances=1,
            coalesce=True
        )
        
        logger.info("✅ 크롤링 스케줄 설정 완료:")
        logger.info("  - 네이버: 매일 07:00")
        logger.info("  - 다음: 매일 07:10")
    
    async def start_scheduler(self):
        """스케줄러 시작"""
        logger.info("🚀 통합 크롤링 스케줄러 시작...")
        
        # 스케줄 설정
        self.setup_schedule()
        
        # 스케줄러 시작
        self.scheduler.start()
        logger.info("✅ 크롤링 스케줄러 시작 완료")
        
        # 즉시 실행 옵션 (테스트용)
        if os.getenv("IMMEDIATE_CRAWL", "false").lower() == "true":
            logger.info("🔥 즉시 크롤링 테스트 실행...")
            await asyncio.sleep(2)
            await self.crawl_naver_news()
            await asyncio.sleep(5)
            await self.crawl_daum_news()

    
    async def stop_scheduler(self):
        """스케줄러 중지"""
        logger.info("⏹️ 크롤링 스케줄러 중지...")
        self.scheduler.shutdown()
        
        # 크롤러 세션 정리
        await self.naver_crawler.close_session()
        await self.daum_crawler.close_session()
        
        logger.info("✅ 크롤링 스케줄러 중지 완료")
    
    def get_scheduler_status(self) -> Dict:
        """스케줄러 상태 조회"""
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name or job.id,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            })
        
        return {
            "running": self.scheduler.running,
            "jobs": jobs,
            "timezone": str(self.scheduler.timezone)
        }
    
    async def manual_crawl_all(self) -> Dict:
        """수동으로 모든 소스 크롤링"""
        logger.info("🔥 수동 전체 크롤링 시작...")
        start_time = datetime.now()
        
        results = {}
        
        # 순차 실행 (다음 → 네이버 → 구글)
        results['daum'] = await self.crawl_daum_news()
        await asyncio.sleep(10)  # 간격

        results['naver'] = await self.crawl_naver_news()

        
        end_time = datetime.now()
        total_duration = (end_time - start_time).total_seconds()
        total_saved = sum(r.get('total_saved', 0) for r in results.values())
        
        logger.info(f"✅ 수동 전체 크롤링 완료 - 총 {total_saved}개 저장, {total_duration:.1f}초 소요")
        
        return {
            'total_saved': total_saved,
            'total_duration': total_duration,
            'results': results,
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat()
        }

# 사용 예시
async def main():
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://factlab_user:password@localhost:5433/factlab")
    
    manager = UnifiedCrawlerManager(DATABASE_URL)
    
    try:
        # 즉시 실행 테스트
        if len(sys.argv) > 1 and sys.argv[1] == "test":
            result = await manager.manual_crawl_all()
            print(f"테스트 완료: {result}")
        else:
            # 스케줄러 실행
            await manager.start_scheduler()
            
            # 무한 대기
            while True:
                await asyncio.sleep(60)
                status = manager.get_scheduler_status()
                logger.info(f"스케줄러 상태: {status['running']}, 작업 수: {len(status['jobs'])}")
                
    except KeyboardInterrupt:
        logger.info("중단 신호 수신")
    finally:
        await manager.stop_scheduler()

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    asyncio.run(main())