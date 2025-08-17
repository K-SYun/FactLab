"""
크롤링 관련 API 라우트
- 수동 크롤링 실행
- 스케줄러 상태 관리
- 크롤링 로그 조회
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, List
import logging
from datetime import datetime
import asyncio
import os

from crawlers.naver_mobile_crawler import NaverMobileCrawler
from crawlers.daum_mobile_crawler import DaumMobileCrawler
from schedulers.crawl_scheduler import CrawlScheduler

router = APIRouter()
logger = logging.getLogger(__name__)

# 전역 스케줄러 인스턴스
scheduler_instance = None

def get_scheduler():
    global scheduler_instance
    if not scheduler_instance:
        database_url = os.getenv("DATABASE_URL", "postgresql://factlab_user:password@localhost:5433/factlab")
        scheduler_instance = CrawlScheduler(database_url)
    return scheduler_instance

@router.post("/crawl/naver")
async def manual_crawl_naver(count_per_category: int = 20):
    """네이버 뉴스 수동 크롤링"""
    try:
        crawler = NaverMobileCrawler()
        scheduler = get_scheduler()
        
        start_time = datetime.now()
        logger.info(f"Starting manual Naver crawling with {count_per_category} articles per category")
        
        results = await crawler.crawl_all_categories(count_per_category)
        
        total_saved = 0
        category_results = {}
        
        for category, articles in results.items():
            if articles:
                saved = await scheduler.save_news_to_db(articles, "네이버")
                total_saved += saved
                category_results[category] = {
                    "crawled": len(articles),
                    "saved": saved
                }
            else:
                category_results[category] = {
                    "crawled": 0,
                    "saved": 0
                }
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        await scheduler.log_crawl_result("naver_manual", total_saved, duration, "SUCCESS")
        
        return {
            "success": True,
            "source": "naver",
            "total_saved": total_saved,
            "duration_seconds": duration,
            "categories": category_results,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in manual Naver crawling: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/crawl/daum")
async def manual_crawl_daum(count_per_category: int = 20):
    """다음 뉴스 수동 크롤링"""
    try:
        crawler = DaumMobileCrawler()
        scheduler = get_scheduler()
        
        start_time = datetime.now()
        logger.info(f"Starting manual Daum crawling with {count_per_category} articles per category")
        
        results = await crawler.crawl_all_categories(count_per_category)
        
        total_saved = 0
        category_results = {}
        
        for category, articles in results.items():
            if articles:
                saved = await scheduler.save_news_to_db(articles, "다음")
                total_saved += saved
                category_results[category] = {
                    "crawled": len(articles),
                    "saved": saved
                }
            else:
                category_results[category] = {
                    "crawled": 0,
                    "saved": 0
                }
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        await scheduler.log_crawl_result("daum_manual", total_saved, duration, "SUCCESS")
        
        return {
            "success": True,
            "source": "daum",
            "total_saved": total_saved,
            "duration_seconds": duration,
            "categories": category_results,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in manual Daum crawling: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 전역 크롤링 상태 관리
crawling_status = {
    "is_running": False,
    "current_source": None,
    "current_category": None,
    "progress": 0,
    "total_target": 0,
    "collected_count": 0,
    "start_time": None,
    "estimated_end_time": None
}

def update_crawling_status(is_running: bool = None, source: str = None, category: str = None, 
                          progress: int = None, total_target: int = None, collected: int = None):
    """크롤링 상태 업데이트"""
    global crawling_status
    
    if is_running is not None:
        crawling_status["is_running"] = is_running
    if source is not None:
        crawling_status["current_source"] = source
    if category is not None:
        crawling_status["current_category"] = category
    if progress is not None:
        crawling_status["progress"] = progress
    if total_target is not None:
        crawling_status["total_target"] = total_target
    if collected is not None:
        crawling_status["collected_count"] = collected
    
    if is_running and crawling_status["start_time"] is None:
        crawling_status["start_time"] = datetime.now().isoformat()
    elif not is_running:
        crawling_status["start_time"] = None
        crawling_status["estimated_end_time"] = None
    
    logger.info(f"크롤링 상태 업데이트: {crawling_status}")

@router.get("/crawl/status")
async def get_crawling_status():
    """현재 크롤링 상태 조회"""
    return {
        "success": True,
        "status": crawling_status
    }

@router.post("/crawl/all")
async def manual_crawl_all(count_per_category: int = 10):
    """모든 소스 뉴스 수동 크롤링 (실시간 상태 업데이트)"""
    try:
        # 크롤링 시작 상태 설정
        update_crawling_status(is_running=True, total_target=count_per_category * 2)
        
        start_time = datetime.now()
        results = {}
        total_collected = 0
        
        # 네이버 크롤링
        update_crawling_status(source="네이버", progress=0)
        naver_result = await manual_crawl_naver_with_status(count_per_category)
        results["naver"] = naver_result
        total_collected += naver_result["total_saved"]
        
        # 간격 두기
        await asyncio.sleep(10)
        
        # 다음 크롤링
        update_crawling_status(source="다음", progress=50, collected=total_collected)
        daum_result = await manual_crawl_daum_with_status(count_per_category)
        results["daum"] = daum_result
        total_collected += daum_result["total_saved"]
        
        # 크롤링 완료
        update_crawling_status(is_running=False, progress=100, collected=total_collected)
        
        end_time = datetime.now()
        total_duration = (end_time - start_time).total_seconds()
        
        return {
            "success": True,
            "total_saved": total_collected,
            "total_duration_seconds": total_duration,
            "results": results,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in manual all crawling: {e}")
        # 오류 시 크롤링 상태 리셋
        update_crawling_status(is_running=False)
        raise HTTPException(status_code=500, detail=str(e))

async def manual_crawl_naver_with_status(count_per_category: int = 20):
    """네이버 뉴스 수동 크롤링 (상태 업데이트 포함)"""
    try:
        crawler = NaverMobileCrawler()
        scheduler = get_scheduler()
        
        start_time = datetime.now()
        logger.info(f"Starting manual Naver crawling with {count_per_category} articles per category")
        
        results = await crawler.crawl_all_categories_with_status(count_per_category, update_crawling_status)
        
        total_saved = 0
        category_results = {}
        
        for category, articles in results.items():
            if articles:
                saved = await scheduler.save_news_to_db(articles, "네이버")
                total_saved += saved
                category_results[category] = {
                    "crawled": len(articles),
                    "saved": saved
                }
            else:
                category_results[category] = {
                    "crawled": 0,
                    "saved": 0
                }
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        await scheduler.log_crawl_result("naver_manual", total_saved, duration, "SUCCESS")
        
        return {
            "success": True,
            "source": "naver",
            "total_saved": total_saved,
            "duration_seconds": duration,
            "categories": category_results,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in manual Naver crawling: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def manual_crawl_daum_with_status(count_per_category: int = 20):
    """다음 뉴스 수동 크롤링 (상태 업데이트 포함)"""
    try:
        crawler = DaumMobileCrawler()
        scheduler = get_scheduler()
        
        start_time = datetime.now()
        logger.info(f"Starting manual Daum crawling with {count_per_category} articles per category")
        
        results = await crawler.crawl_all_categories_with_status(count_per_category, update_crawling_status)
        
        total_saved = 0
        category_results = {}
        
        for category, articles in results.items():
            if articles:
                saved = await scheduler.save_news_to_db(articles, "다음")
                total_saved += saved
                category_results[category] = {
                    "crawled": len(articles),
                    "saved": saved
                }
            else:
                category_results[category] = {
                    "crawled": 0,
                    "saved": 0
                }
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        await scheduler.log_crawl_result("daum_manual", total_saved, duration, "SUCCESS")
        
        return {
            "success": True,
            "source": "daum",
            "total_saved": total_saved,
            "duration_seconds": duration,
            "categories": category_results,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in manual Daum crawling: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scheduler/status")
async def get_scheduler_status():
    """스케줄러 상태 조회"""
    try:
        scheduler = get_scheduler()
        status = scheduler.get_scheduler_status()
        
        return {
            "success": True,
            "scheduler": status
        }
        
    except Exception as e:
        logger.error(f"Error getting scheduler status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scheduler/start")
async def start_scheduler(background_tasks: BackgroundTasks):
    """스케줄러 시작"""
    try:
        scheduler = get_scheduler()
        
        # 백그라운드에서 스케줄러 시작
        background_tasks.add_task(scheduler.start_scheduler)
        
        return {
            "success": True,
            "message": "Scheduler starting in background"
        }
        
    except Exception as e:
        logger.error(f"Error starting scheduler: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scheduler/stop")
async def stop_scheduler():
    """스케줄러 중지"""
    try:
        scheduler = get_scheduler()
        await scheduler.stop_scheduler()
        
        return {
            "success": True,
            "message": "Scheduler stopped"
        }
        
    except Exception as e:
        logger.error(f"Error stopping scheduler: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/crawl/logs")
async def get_crawl_logs(limit: int = 50):
    """크롤링 로그 조회"""
    try:
        scheduler = get_scheduler()
        conn = scheduler.get_db_connection()
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM crawl_logs 
            ORDER BY created_at DESC 
            LIMIT %s
        """, (limit,))
        
        logs = cursor.fetchall()
        
        return {
            "success": True,
            "logs": [dict(log) for log in logs]
        }
        
    except Exception as e:
        logger.error(f"Error fetching crawl logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@router.get("/crawl/stats")
async def get_crawl_stats():
    """크롤링 통계 조회"""
    try:
        scheduler = get_scheduler()
        conn = scheduler.get_db_connection()
        
        cursor = conn.cursor()
        
        # 오늘 크롤링 통계
        cursor.execute("""
            SELECT source, 
                   COUNT(*) as crawl_count,
                   SUM(articles_saved) as total_articles,
                   AVG(duration_seconds) as avg_duration
            FROM crawl_logs 
            WHERE DATE(created_at) = CURRENT_DATE
            GROUP BY source
            ORDER BY crawl_count DESC
        """)
        
        today_stats = cursor.fetchall()
        
        # 주간 통계
        cursor.execute("""
            SELECT source,
                   COUNT(*) as crawl_count,
                   SUM(articles_saved) as total_articles
            FROM crawl_logs 
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY source
            ORDER BY total_articles DESC
        """)
        
        weekly_stats = cursor.fetchall()
        
        # 전체 뉴스 수
        cursor.execute("""
            SELECT COUNT(*) as total_news,
                   COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_news,
                   COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_news
            FROM news
        """)
        
        news_stats = cursor.fetchone()
        
        return {
            "success": True,
            "today": [dict(stat) for stat in today_stats],
            "weekly": [dict(stat) for stat in weekly_stats],
            "news_total": dict(news_stats)
        }
        
    except Exception as e:
        logger.error(f"Error fetching crawl stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@router.post("/test/crawl-single")
async def test_crawl_single(source: str, category: str, count: int = 3):
    """단일 카테고리 크롤링 테스트"""
    try:
        if source.lower() == "naver":
            crawler = NaverMobileCrawler()
        elif source.lower() == "daum":
            crawler = DaumMobileCrawler()
        else:
            raise HTTPException(status_code=400, detail="Invalid source. Use 'naver' or 'daum'")
        
        scheduler = get_scheduler()
        start_time = datetime.now()
        
        articles = await crawler.crawl_category(category, count)
        
        if articles:
            saved = await scheduler.save_news_to_db(articles, f"{source}_test")
        else:
            saved = 0
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        return {
            "success": True,
            "source": source,
            "category": category,
            "crawled": len(articles),
            "saved": saved,
            "duration_seconds": duration,
            "articles": [
                {
                    "title": article.title,
                    "url": article.url,
                    "content_length": len(article.content)
                } for article in articles[:3]  # 최대 3개만 미리보기
            ]
        }
        
    except Exception as e:
        logger.error(f"Error in test crawl: {e}")
        raise HTTPException(status_code=500, detail=str(e))