"""
크롤링 통합 API 엔드포인트
- 수동 크롤링 실행
- 스케줄러 관리
- 크롤링 상태 및 로그 조회
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Dict, List, Optional
import logging
from datetime import datetime
import asyncio
import os
import sys
from pathlib import Path
import json
import time

# 프로젝트 루트 경로 추가
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from app.crawlers.crawler_manager import UnifiedCrawlerManager

router = APIRouter()
logger = logging.getLogger(__name__)

# 전역 매니저 인스턴스
manager_instance = None

def get_manager():
    global manager_instance
    if not manager_instance:
        database_url = os.getenv("DATABASE_URL", "postgresql://factlab_user:password@localhost:5433/factlab")
        manager_instance = UnifiedCrawlerManager(database_url)
    return manager_instance

@router.get("/health")
async def health_check():
    """API 헬스체크"""
    return {
        "status": "healthy",
        "service": "FactLab Unified Crawler API",
        "timestamp": datetime.now().isoformat()
    }

@router.post("/crawl/naver")
async def manual_crawl_naver():
    """네이버 뉴스 수동 크롤링"""
    try:
        manager = get_manager()
        result = await manager.crawl_naver_news()
        
        return {
            "success": True,
            "message": "네이버 크롤링 완료",
            **result
        }
        
    except Exception as e:
        logger.error(f"네이버 크롤링 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/crawl/daum")
async def manual_crawl_daum():
    """다음 뉴스 수동 크롤링"""
    try:
        manager = get_manager()
        result = await manager.crawl_daum_news()
        
        return {
            "success": True,
            "message": "다음 크롤링 완료",
            **result
        }
        
    except Exception as e:
        logger.error(f"다음 크롤링 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# 전역 크롤링 상태 저장
crawl_progress = {
    "is_running": False,
    "total_articles": 0,
    "completed_articles": 0,
    "current_category": "",
    "current_source": "",
    "details": [],
    "error": None,
    "crawl_type": "none"  # "manual", "schedule", "none"
}

@router.post("/crawl/all")
async def manual_crawl_all():
    """모든 소스 수동 크롤링"""
    try:
        manager = get_manager()
        result = await manager.manual_crawl_all()
        
        return {
            "success": True,
            "message": "전체 크롤링 완료",
            **result
        }
        
    except Exception as e:
        logger.error(f"전체 크롤링 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/crawl/progress")
async def get_crawl_progress():
    """크롤링 진행률 조회"""
    return {
        "success": True,
        "progress": crawl_progress
    }

@router.get("/crawl/progress/stream")
async def stream_crawl_progress():
    """SSE로 크롤링 진행률 스트리밍"""
    def generate():
        last_sent = {}
        while True:
            # 변경사항이 있을 때만 전송
            if crawl_progress != last_sent:
                data = json.dumps(crawl_progress)
                yield f"data: {data}\n\n"
                last_sent = crawl_progress.copy()
            
            # 크롤링이 완료되면 스트림 종료
            if not crawl_progress["is_running"] and crawl_progress["completed_articles"] > 0:
                break
                
            time.sleep(0.5)  # 0.5초마다 체크
    
    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*"
        }
    )

@router.get("/scheduler/status")
async def get_scheduler_status():
    """스케줄러 상태 조회"""
    try:
        manager = get_manager()
        status = manager.get_scheduler_status()
        return {
            "success": True,
            "scheduler": status,
        }
    except Exception as e:
        logger.error(f"스케줄러 상태 조회 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/crawl/all/schedule")
async def schedule_crawl_all_with_progress(background_tasks: BackgroundTasks):
    """스케줄에 의한 자동 크롤링 (카드 상태 표시용)"""
    global crawl_progress
    
    if crawl_progress["is_running"]:
        raise HTTPException(status_code=400, detail="크롤링이 이미 진행 중입니다")
    
    # 크롤링 상태 초기화 (스케줄 크롤링)
    crawl_progress.update({
        "is_running": True,
        "total_articles": 3,  # 3개 소스 (네이버, 다음, 구글)
        "completed_articles": 0,
        "current_category": "",
        "current_source": "네이버",
        "details": ["스케줄 크롤링 준비 중..."],
        "error": None,
        "crawl_type": "schedule"  # 스케줄 크롤링
    })
    
    # 백그라운드에서 실제 크롤링 실행
    background_tasks.add_task(run_real_crawl_with_progress)
    
    return {
        "success": True,
        "message": "스케줄 크롤링이 시작되었습니다."
    }

@router.post("/crawl/all/stream")
async def manual_crawl_all_with_progress(background_tasks: BackgroundTasks):
    """실시간 진행률과 함께 전체 크롤링 시작"""
    print("=== MANUAL CRAWL ENDPOINT CALLED ===")
    logger.info("🎯 manual_crawl_all_with_progress 엔드포인트 시작!")
    global crawl_progress
    
    if crawl_progress["is_running"]:
        raise HTTPException(status_code=400, detail="크롤링이 이미 진행 중입니다")
    
    # 크롤링 상태 초기화 (수동 크롤링)
    crawl_progress.update({
        "is_running": True,
        "total_articles": 3,  # 3개 소스 (네이버, 다음, 구글)
        "completed_articles": 0,
        "current_category": "",
        "current_source": "네이버",
        "details": ["크롤링 준비 중..."],
        "error": None,
        "crawl_type": "manual"  # 수동 크롤링
    })
    
    # 백그라운드에서 실제 크롤링 실행 (실제 크롤러 매니저 사용)
    logger.info("🎯 About to add run_real_crawl_with_progress to background_tasks")
    background_tasks.add_task(run_real_crawl_with_progress)
    logger.info("✅ Added run_real_crawl_with_progress to background_tasks")
    
    return {
        "success": True,
        "message": "크롤링이 시작되었습니다. /crawl/progress/stream에서 진행률을 확인하세요."
    }

async def run_real_crawl_with_progress():
    """실제 크롤러 매니저를 사용하여 진행률과 함께 크롤링 실행"""
    global crawl_progress
    
    try:
        logger.info("🚀 run_real_crawl_with_progress 함수 시작!")
        logger.info(f"🔍 초기 crawl_progress 상태: {crawl_progress}")
        manager = get_manager()
        
        # 진행률 업데이트를 위한 콜백 함수
        def progress_callback(source: str, category: str, completed: int, total: int, message: str):
            crawl_progress["current_source"] = source
            crawl_progress["current_category"] = category
            crawl_progress["completed_articles"] = completed
            crawl_progress["details"].append(message)
            
            # 최근 15개 로그만 유지
            if len(crawl_progress["details"]) > 15:
                crawl_progress["details"] = crawl_progress["details"][-15:]
        
        # 실제 크롤러 매니저의 manual_crawl_all 호출
        logger.info("🚀 실제 크롤러 매니저로 크롤링 시작")
        crawl_progress["details"].append("🚀 크롤링 매니저 시작...")
        
        # 각 소스별로 크롤링 실행하며 진행률 업데이트
        total_saved = 0
        
        # 네이버 크롤링
        crawl_progress["current_source"] = "네이버"
        crawl_progress["details"].append("📱 네이버 모바일 크롤링 시작...")
        naver_result = await manager.crawl_naver_news()
        naver_saved = naver_result.get('total_saved', 0)
        total_saved += naver_saved
        crawl_progress["completed_articles"] = 1  # 1개 소스 완료
        crawl_progress["details"].append(f"✅ 네이버 완료: {naver_saved}개 저장")
        
        # 다음 크롤링
        await asyncio.sleep(2)
        crawl_progress["current_source"] = "다음"
        crawl_progress["details"].append("📱 다음 모바일 크롤링 시작...")
        daum_result = await manager.crawl_daum_news()
        daum_saved = daum_result.get('total_saved', 0)
        total_saved += daum_saved
        crawl_progress["completed_articles"] = 2  # 2개 소스 완료
        crawl_progress["details"].append(f"✅ 다음 완료: {daum_saved}개 저장")
        
        # 구글 크롤링
        await asyncio.sleep(2)
        crawl_progress["current_source"] = "구글"
        crawl_progress["details"].append("🌐 구글 RSS 크롤링 시작...")
        google_result = await manager.crawl_google_news()
        google_saved = google_result.get('total_saved', 0)
        total_saved += google_saved
        crawl_progress["completed_articles"] = 3  # 3개 소스 완료
        crawl_progress["details"].append(f"✅ 구글 완료: {google_saved}개 저장")
        
        # 크롤링 완료
        crawl_progress.update({
            "is_running": False,
            "completed_articles": total_saved,
            "current_category": "완료",
            "current_source": "완료",
            "details": crawl_progress["details"] + [f"🎉 전체 크롤링 완료: 총 {total_saved}개 뉴스 저장"],
            "crawl_type": "none"  # 크롤링 종료
        })
        
        logger.info(f"✨ 크롤링 완료: 총 {total_saved}개 뉴스 저장")
        
    except Exception as e:
        logger.error(f"크롤링 중 오류: {e}")
        crawl_progress.update({
            "is_running": False,
            "error": str(e),
            "details": crawl_progress["details"] + [f"❌ 크롤링 실패: {str(e)}"],
            "crawl_type": "none"  # 크롤링 종료
        })

# 기존 시뮬레이션 함수는 유지 (테스트용)
async def run_crawl_with_progress_DISABLED():
    """진행률을 업데이트하면서 크롤링 실행 (시뮬레이션)"""
    global crawl_progress
    
    try:
        manager = get_manager()
        
        # 네이버 크롤링
        from app.crawlers.naver_crawler import NaverMobileCrawler
        naver_crawler = NaverMobileCrawler()
        
        categories = ["politics", "economy", "society", "technology", "world", "sports"]
        category_names = {
            "politics": "정치",
            "economy": "경제", 
            "society": "사회",
            "technology": "IT/과학",
            "world": "세계",
            "sports": "스포츠"
        }
        
        total_saved = 0
        
        for i, category in enumerate(categories):
            category_name = category_names.get(category, category)
            crawl_progress["current_category"] = category_name
            crawl_progress["details"].append(f"📂 {category_name} 분야 크롤링 시작...")
            
            try:
                # 실제 크롤링 실행
                news_items = await naver_crawler.crawl_category(category, 20)
                
                # 각 뉴스 아이템 저장 시뮬레이션
                saved_count = 0
                for j, news_item in enumerate(news_items):
                    try:
                        # 실제 DB 저장
                        success = await naver_crawler.save_news_to_db(news_item)
                        if success:
                            saved_count += 1
                            total_saved += 1
                            
                        # 진행률 업데이트
                        crawl_progress["completed_articles"] = total_saved
                        
                        # 각 뉴스마다 로그 추가 (요청된 형식: 번호-제목-출처)
                        if success:
                            news_log = f"📰 {total_saved}. {news_item.get('title', '제목없음')[:50]}{'...' if len(news_item.get('title', '')) > 50 else ''} - {news_item.get('source', '네이버')}"
                            crawl_progress["details"].append(news_log)
                            
                            # 최근 10개 로그만 유지
                            if len(crawl_progress["details"]) > 10:
                                crawl_progress["details"] = crawl_progress["details"][-10:]
                        
                        # 5개마다 진행 상황 요약
                        if (j + 1) % 5 == 0:
                            crawl_progress["details"].append(
                                f"✅ {category_name} 분야 {j + 1}개 처리 완료 (저장: {saved_count}개)"
                            )
                            # 최근 15개 로그만 유지 (뉴스 로그 + 요약 로그)
                            if len(crawl_progress["details"]) > 15:
                                crawl_progress["details"] = crawl_progress["details"][-15:]
                        
                        # 실제 크롤링 간격 (5초)
                        await asyncio.sleep(0.1)  # 데모용으로 짧게
                        
                    except Exception as e:
                        logger.error(f"뉴스 저장 실패: {e}")
                        continue
                
                crawl_progress["details"].append(
                    f"🎯 {category_name} 분야 완료: {saved_count}개 저장"
                )
                
            except Exception as e:
                logger.error(f"{category} 크롤링 실패: {e}")
                crawl_progress["details"].append(f"❌ {category_name} 분야 실패: {str(e)}")
                continue
        
        # 크롤링 완료
        crawl_progress.update({
            "is_running": False,
            "completed_articles": total_saved,
            "current_category": "완료",
            "details": crawl_progress["details"] + [f"✨ 전체 크롤링 완료: 총 {total_saved}개 뉴스 저장"]
        })
        
    except Exception as e:
        logger.error(f"크롤링 중 오류: {e}")
        crawl_progress.update({
            "is_running": False,
            "error": str(e),
            "details": crawl_progress["details"] + [f"❌ 크롤링 실패: {str(e)}"],
            "crawl_type": "none"  # 크롤링 종료
        })


@router.post("/scheduler/start")
async def start_scheduler(background_tasks: BackgroundTasks):
    """스케줄러 시작"""
    try:
        manager = get_manager()
        
        # 백그라운드에서 스케줄러 시작
        background_tasks.add_task(manager.start_scheduler)
        
        return {
            "success": True,
            "message": "크롤링 스케줄러가 백그라운드에서 시작되었습니다",
            "schedule": {
                "naver": "2시간 간격 정시 (00:00, 02:00, 04:00, ...)",
                "daum": "2시간 간격 20분 (00:20, 02:20, 04:20, ...)",
                "google": "2시간 간격 40분 (00:40, 02:40, 04:40, ...)"
            }
        }
        
    except Exception as e:
        logger.error(f"스케줄러 시작 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scheduler/stop")
async def stop_scheduler():
    """스케줄러 중지"""
    try:
        manager = get_manager()
        await manager.stop_scheduler()
        
        return {
            "success": True,
            "message": "크롤링 스케줄러가 중지되었습니다"
        }
        
    except Exception as e:
        logger.error(f"스케줄러 중지 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs")
async def get_crawl_logs(limit: int = 50):
    """크롤링 로그 조회"""
    try:
        manager = get_manager()
        
        if not manager.database_url:
            raise HTTPException(status_code=500, detail="Database URL not configured")
        
        import psycopg2
        from psycopg2.extras import RealDictCursor
        
        conn = psycopg2.connect(manager.database_url, cursor_factory=RealDictCursor)
        
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM crawl_logs 
                ORDER BY created_at DESC 
                LIMIT %s
            """, (limit,))
            
            logs = cursor.fetchall()
            
            return {
                "success": True,
                "logs": [dict(log) for log in logs],
                "count": len(logs)
            }
            
        finally:
            cursor.close()
            conn.close()
        
    except Exception as e:
        logger.error(f"크롤링 로그 조회 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_crawl_stats():
    """크롤링 통계 조회"""
    try:
        manager = get_manager()
        
        if not manager.database_url:
            raise HTTPException(status_code=500, detail="Database URL not configured")
        
        import psycopg2
        from psycopg2.extras import RealDictCursor
        
        conn = psycopg2.connect(manager.database_url, cursor_factory=RealDictCursor)
        
        try:
            cursor = conn.cursor()
            
            # 오늘 크롤링 통계
            cursor.execute("""
                SELECT source, 
                       COUNT(*) as crawl_count,
                       SUM(articles_saved) as total_articles,
                       AVG(duration_seconds) as avg_duration,
                       MAX(created_at) as last_crawl
                FROM crawl_logs 
                WHERE DATE(created_at) = CURRENT_DATE
                GROUP BY source
                ORDER BY total_articles DESC
            """)
            
            today_stats = cursor.fetchall()
            
            # 주간 통계
            cursor.execute("""
                SELECT source,
                       COUNT(*) as crawl_count,
                       SUM(articles_saved) as total_articles,
                       AVG(duration_seconds) as avg_duration
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
                       COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_news,
                       COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_news
                FROM news
            """)
            
            news_stats = cursor.fetchone()
            
            # 소스별 뉴스 수
            cursor.execute("""
                SELECT source, COUNT(*) as count
                FROM news
                GROUP BY source
                ORDER BY count DESC
            """)
            
            source_stats = cursor.fetchall()
            
            return {
                "success": True,
                "today": [dict(stat) for stat in today_stats],
                "weekly": [dict(stat) for stat in weekly_stats],
                "news_total": dict(news_stats),
                "by_source": [dict(stat) for stat in source_stats]
            }
            
        finally:
            cursor.close()
            conn.close()
        
    except Exception as e:
        logger.error(f"크롤링 통계 조회 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test/single")
async def test_single_source(source: str, count: int = 3):
    """단일 소스 크롤링 테스트"""
    try:
        manager = get_manager()
        
        if source.lower() == "naver":
            # 네이버 단일 카테고리 테스트
            result = await manager.naver_crawler.crawl_category("politics", count)
            items = [
                {
                    "title": item.title,
                    "url": item.url,
                    "content_length": len(item.content),
                    "category": item.category
                } for item in result
            ]
            
        elif source.lower() == "daum":
            # 다음 단일 카테고리 테스트
            result = await manager.daum_crawler.crawl_category("politics", count)
            items = [
                {
                    "title": item.title,
                    "url": item.url,
                    "content_length": len(item.content),
                    "category": item.category
                } for item in result
            ]
            
        elif source.lower() == "google":
            # 구글 단일 카테고리 테스트
            result = manager.google_crawler.crawl_rss("politics")[:count]
            items = [
                {
                    "title": item.title,
                    "url": item.source_url,
                    "content_length": len(item.content),
                    "category": item.category
                } for item in result
            ]
            
        else:
            raise HTTPException(status_code=400, detail="Invalid source. Use 'naver', 'daum', or 'google'")
        
        return {
            "success": True,
            "source": source,
            "crawled": len(items),
            "items": items
        }
        
    except Exception as e:
        logger.error(f"테스트 크롤링 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/config")
async def get_crawler_config():
    """크롤러 설정 조회"""
    try:
        manager = get_manager()
        
        return {
            "success": True,
            "config": {
                "articles_per_category": manager.articles_per_category,
                "crawl_interval_minutes": manager.crawl_interval_minutes,
                "supported_categories": manager.categories,
                "sources": ["naver", "daum", "google"],
                "schedule": {
                    "naver": "2시간 간격 정시 (00:00, 02:00, 04:00, ...)",
                    "daum": "2시간 간격 20분 (00:20, 02:20, 04:20, ...)",
                    "google": "2시간 간격 40분 (00:40, 02:40, 04:40, ...)"
                }
            }
        }
        
    except Exception as e:
        logger.error(f"설정 조회 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))