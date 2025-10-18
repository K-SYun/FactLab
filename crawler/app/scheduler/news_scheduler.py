import schedule
import time
import threading
from datetime import datetime
import logging
from app.crawlers.googel_crawler import GoogleCrawlerManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NewsScheduler:
    def __init__(self):
        self.crawler_manager = GoogleCrawlerManager()
        self.is_running = False
        self.thread = None
        
    def collect_and_process_news(self):
        """뉴스 수집 및 DB 저장"""
        logger.info("Starting news collection and database saving...")
        
        try:
            # 모든 카테고리에서 뉴스 수집하고 DB에 저장
            results = self.crawler_manager.crawl_and_save_all_categories()
            logger.info(f"Collection results: {results}")
            
            # 전체 통계 계산
            total_saved = sum(result.get('saved', 0) for result in results.values())
            total_duplicates = sum(result.get('duplicates', 0) for result in results.values())
            total_errors = sum(result.get('errors', 0) for result in results.values())
            
            logger.info(f"Total: {total_saved} saved, {total_duplicates} duplicates, {total_errors} errors")
            
        except Exception as e:
            logger.error(f"Error in news collection and processing: {e}")
    
    def quick_news_update(self):
        """빠른 뉴스 업데이트 (정치 뉴스만)"""
        logger.info("Starting quick news update...")
        
        try:
            # 정치 뉴스만 수집하고 DB에 저장
            result = self.crawler_manager.crawl_and_save_all_sources("정치")
            logger.info(f"Quick update result: {result}")
                    
        except Exception as e:
            logger.error(f"Error in quick news update: {e}")
    
    def setup_schedule(self):
        """스케줄 설정"""
        # 매일 오전 8시에 전체 뉴스 수집 (1회)
        schedule.every().day.at("08:00").do(self.collect_and_process_news)

        logger.info("News collection schedule set up:")
        logger.info("- 매일 오전 08:00에 전체 뉴스 수집 (1회)")
    
    def run_scheduler(self):
        """스케줄러 실행"""
        self.setup_schedule()
        
        logger.info("News scheduler started")
        while self.is_running:
            schedule.run_pending()
            time.sleep(60)  # 1분마다 스케줄 확인
    
    def start(self):
        """스케줄러 시작"""
        if self.is_running:
            logger.warning("Scheduler is already running")
            return
        
        self.is_running = True
        self.thread = threading.Thread(target=self.run_scheduler)
        self.thread.daemon = True
        self.thread.start()
        
        logger.info("News scheduler started in background")
    
    def stop(self):
        """스케줄러 중지"""
        self.is_running = False
        if self.thread:
            self.thread.join()
        
        logger.info("News scheduler stopped")
    
    def run_now(self):
        """즉시 뉴스 수집 실행"""
        logger.info("Running news collection immediately...")
        self.collect_and_process_news()

# 전역 스케줄러 인스턴스
news_scheduler = NewsScheduler()
