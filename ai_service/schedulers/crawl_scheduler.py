"""
크롤링 스케줄러
- 2시간 간격으로 실행
- 네이버(정시), 다음(20분), 구글(40분) 분산 실행
- 비동기 처리로 크롤링 후 DB 저장
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

from crawlers.naver_mobile_crawler import NaverMobileCrawler, NewsItem
from crawlers.daum_mobile_crawler import DaumMobileCrawler

logger = logging.getLogger(__name__)

class CrawlScheduler:
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.scheduler = AsyncIOScheduler(timezone=pytz.timezone('Asia/Seoul'))
        self.naver_crawler = NaverMobileCrawler()
        self.daum_crawler = DaumMobileCrawler()
        
        # 설정
        self.articles_per_category = 20
        self.crawl_interval_hours = 2
        
    def get_db_connection(self):
        """데이터베이스 연결"""
        return psycopg2.connect(self.database_url, cursor_factory=RealDictCursor)
    
    async def save_news_to_db(self, news_items: List[NewsItem], source: str) -> int:
        """뉴스 데이터베이스 저장"""
        if not news_items:
            return 0
        
        conn = self.get_db_connection()
        saved_count = 0
        
        try:
            cursor = conn.cursor()
            
            for news_item in news_items:
                try:
                    # 중복 체크 (URL 기준)
                    cursor.execute("SELECT id FROM news WHERE url = %s", (news_item.url,))
                    existing = cursor.fetchone()
                    
                    if existing:
                        logger.debug(f"Duplicate news skipped: {news_item.url}")
                        continue
                    
                    # 뉴스 삽입
                    cursor.execute("""
                        INSERT INTO news (title, content, url, source, publish_date, category, status, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """, (
                        news_item.title,
                        news_item.content,
                        news_item.url,
                        f"{source} - {news_item.source}",
                        news_item.publish_date,
                        news_item.category,
                        'PENDING',  # 크롤링 후 관리자 승인 대기
                        datetime.now(),
                        datetime.now()
                    ))
                    
                    news_id = cursor.fetchone()[0]
                    saved_count += 1
                    logger.debug(f"Saved news ID {news_id}: {news_item.title[:50]}...")
                    
                except Exception as e:
                    logger.error(f"Error saving news item: {e}")
                    conn.rollback()
                    continue
            
            conn.commit()
            logger.info(f"Saved {saved_count} news items from {source} to database")
            return saved_count
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error while saving {source} news: {e}")
            return 0
        finally:
            cursor.close()
            conn.close()
    
    async def crawl_naver_news(self):
        """네이버 뉴스 크롤링 작업"""
        start_time = datetime.now()
        logger.info(f"Starting Naver news crawling at {start_time}")
        
        try:
            results = await self.naver_crawler.crawl_all_categories(self.articles_per_category)
            
            total_saved = 0
            for category, articles in results.items():
                if articles:
                    saved = await self.save_news_to_db(articles, "네이버")
                    total_saved += saved
                    logger.info(f"Naver {category}: {saved} articles saved")
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            logger.info(f"Naver crawling completed. Total saved: {total_saved}, Duration: {duration:.1f}s")
            
            # 크롤링 로그 저장
            await self.log_crawl_result("naver", total_saved, duration, "SUCCESS")
            
        except Exception as e:
            logger.error(f"Error during Naver crawling: {e}")
            await self.log_crawl_result("naver", 0, 0, f"ERROR: {str(e)}")
    
    async def crawl_daum_news(self):
        """다음 뉴스 크롤링 작업"""
        start_time = datetime.now()
        logger.info(f"Starting Daum news crawling at {start_time}")
        
        try:
            results = await self.daum_crawler.crawl_all_categories(self.articles_per_category)
            
            total_saved = 0
            for category, articles in results.items():
                if articles:
                    saved = await self.save_news_to_db(articles, "다음")
                    total_saved += saved
                    logger.info(f"Daum {category}: {saved} articles saved")
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            logger.info(f"Daum crawling completed. Total saved: {total_saved}, Duration: {duration:.1f}s")
            
            # 크롤링 로그 저장
            await self.log_crawl_result("daum", total_saved, duration, "SUCCESS")
            
        except Exception as e:
            logger.error(f"Error during Daum crawling: {e}")
            await self.log_crawl_result("daum", 0, 0, f"ERROR: {str(e)}")
    
    async def crawl_google_news(self):
        """구글 뉴스 크롤링 작업 (향후 구현)"""
        logger.info("Google news crawling scheduled (not implemented yet)")
        await self.log_crawl_result("google", 0, 0, "NOT_IMPLEMENTED")
    
    async def log_crawl_result(self, source: str, articles_saved: int, duration: float, status: str):
        """크롤링 결과 로그 저장"""
        conn = self.get_db_connection()
        
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO crawl_logs (source, articles_saved, duration_seconds, status, created_at)
                VALUES (%s, %s, %s, %s, %s)
            """, (source, articles_saved, duration, status, datetime.now()))
            
            conn.commit()
            
        except Exception as e:
            logger.error(f"Error saving crawl log: {e}")
            conn.rollback()
        finally:
            cursor.close()
            conn.close()
    
    def setup_schedule(self):
        """크롤링 스케줄 설정"""
        logger.info("Setting up crawling schedule...")

        # 매일 아침 8시 크롤링 실행
        self.scheduler.add_job(
            self.crawl_naver_news,
            CronTrigger(hour=8, minute=0, second=0),
            id='naver_crawl_daily_8am',
            max_instances=1,
            coalesce=True
        )
        self.scheduler.add_job(
            self.crawl_daum_news,
            CronTrigger(hour=8, minute=2, second=0),  # 2분 간격
            id='daum_crawl_daily_8am',
            max_instances=1,
            coalesce=True
        )

        # 구글 크롤링은 매일 8시 4분에 실행되도록 설정 (향후 구현)
        # self.scheduler.add_job(
        #     self.crawl_google_news,
        #     CronTrigger(hour=8, minute=4, second=0),
        #     id='google_crawl_daily_8am',
        #     max_instances=1,
        #     coalesce=True
        # )

        logger.info("Crawling schedule configured for once a day at 8 AM.")
        logger.info("  - Naver (Daily): Every day at 08:00")
        logger.info("  - Daum (Daily): Every day at 08:02")
        # logger.info("  - Google (Daily): Every day at 08:04 (placeholder)")
    
    async def start_scheduler(self):
        """스케줄러 시작"""
        logger.info("Starting crawling scheduler...")
        
        # 데이터베이스 테이블 생성
        await self.ensure_tables_exist()
        
        # 스케줄 설정
        self.setup_schedule()
        
        # 스케줄러 시작
        self.scheduler.start()
        logger.info("Crawling scheduler started successfully")
        
        # 즉시 실행 옵션 (테스트용)
        if os.getenv("IMMEDIATE_CRAWL", "false").lower() == "true":
            logger.info("Running immediate crawl for testing...")
            await asyncio.sleep(2)
            await self.crawl_naver_news()
            await asyncio.sleep(5)
            await self.crawl_daum_news()
    
    async def stop_scheduler(self):
        """스케줄러 중지"""
        logger.info("Stopping crawling scheduler...")
        self.scheduler.shutdown()
        
        # 크롤러 세션 정리
        await self.naver_crawler.close_session()
        await self.daum_crawler.close_session()
        
        logger.info("Crawling scheduler stopped")
    
    async def ensure_tables_exist(self):
        """필요한 테이블 생성"""
        conn = self.get_db_connection()
        
        try:
            cursor = conn.cursor()
            
            # 크롤링 로그 테이블 생성
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS crawl_logs (
                    id SERIAL PRIMARY KEY,
                    source VARCHAR(50) NOT NULL,
                    articles_saved INTEGER DEFAULT 0,
                    duration_seconds FLOAT DEFAULT 0,
                    status VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            logger.info("Database tables verified/created")
            
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            conn.rollback()
        finally:
            cursor.close()
            conn.close()
    
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

# 사용 예시
async def main():
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://factlab_user:password@localhost:5433/factlab")
    
    scheduler = CrawlScheduler(DATABASE_URL)
    
    try:
        await scheduler.start_scheduler()
        
        # 무한 대기 (실제 서비스에서는 다른 방식으로 관리)
        while True:
            await asyncio.sleep(60)
            status = scheduler.get_scheduler_status()
            logger.info(f"Scheduler status: {status}")
            
    except KeyboardInterrupt:
        logger.info("Received interrupt signal")
    finally:
        await scheduler.stop_scheduler()

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    asyncio.run(main())