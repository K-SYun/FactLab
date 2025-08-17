from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.crawlers.crawler_manager import UnifiedCrawlerManager
from app.api.crawler_api import router as crawler_router
# AI 분석은 관리자에서 별도 처리
from app.scheduler.news_scheduler import news_scheduler
from app.localization.messages import msg
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FactLab Crawler AI Service", version="1.0.0")

# API 라우터 등록
app.include_router(crawler_router, prefix="/crawler")

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",  # Admin 서비스
        "http://localhost:3000",  # User 서비스
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 서비스 초기화 - UnifiedCrawlerManager 사용
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://factlab_user:password@localhost:5433/factlab")
crawler_manager = UnifiedCrawlerManager(DATABASE_URL)
# AI 분석기는 관리자에서 별도 처리


   # """서비스 시작 시 스케줄러 시작"""


   # """서비스 종료 시 스케줄러 중지"""


@app.get("/")
def root():
    return {"message": "FactLab Crawler AI Service is running"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "crawler_ai"}

@app.post("/crawl/news")
async def crawl_news(background_tasks: BackgroundTasks, category: str = "politics"):
    """뉴스 수집 및 DB 저장"""
    def crawl_task():
        try:
            result = crawler_manager.crawl_and_save_all_sources(category)
            logger.info(f"Crawl result for {category}: {result}")
            return result
        except Exception as e:
            logger.error(f"Error crawling news: {e}")
            return {'saved': 0, 'duplicates': 0, 'errors': 1}
    
    background_tasks.add_task(crawl_task)
    return {"message": f"News crawling started for category: {category}"}

@app.post("/crawl/all")
async def crawl_all_news(background_tasks: BackgroundTasks):
    """모든 카테고리 뉴스 수집 및 DB 저장"""
    async def crawl_all_task():
        try:
            results = await crawler_manager.manual_crawl_all()
            logger.info(f"Full crawl results: {results}")
            return results
        except Exception as e:
            logger.error(f"Error crawling all news: {e}")
            return {}
    
    background_tasks.add_task(crawl_all_task)
    return {"message": "Full news crawling and saving started"}

# AI 분석 엔드포인트 
@app.post("/analyze/news/{news_id}")
@app.post("/api/analyze/news/{news_id}")  # 프론트엔드 호환성을 위한 추가 경로
async def analyze_news(news_id: int):
    """뉴스 AI 분석 수행"""
    try:
        # 뉴스 조회
        news = crawler_manager.db_manager.get_news_by_id(news_id)
        if not news:
            raise HTTPException(status_code=404, detail="뉴스를 찾을 수 없습니다.")
        
        # Gemini AI 분석기 사용
        from app.ai.gemini_analyzer import GeminiNewsAnalyzer
        ai_analyzer = GeminiNewsAnalyzer()
        
        # 종합 AI 분석 수행 (Gemini 기반)
        analysis_result = ai_analyzer.analyze_news_complete(
            news_id=news_id,
            title=news.get('title', ''),
            content=news.get('content', '')
        )
        
        logger.info(f"AI analysis completed for news {news_id}")
        
        return {
            "success": True,
            "news_id": news_id,
            "title": news.get('title', ''),
            "analysis": analysis_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing news {news_id}: {e}")
        raise HTTPException(status_code=500, detail=f"AI 분석 실패: {str(e)}")

@app.post("/scheduler/run-now")
async def run_scheduler_now(background_tasks: BackgroundTasks):
    """즉시 뉴스 수집 실행"""
    background_tasks.add_task(news_scheduler.run_now)
    return {"message": "News collection started immediately"}

@app.get("/scheduler/status")
async def get_scheduler_status():
    """스케줄러 상태 확인"""
    return {
        "is_running": news_scheduler.is_running,
        "status": "active" if news_scheduler.is_running else "stopped"
    }

@app.get("/db/test")
async def test_database():
    """데이터베이스 연결 테스트"""
    try:
        is_connected = crawler_manager.db_manager.test_connection()
        return {
            "status": "connected" if is_connected else "disconnected",
            "message": "Database connection successful" if is_connected else "Database connection failed"
        }
    except Exception as e:
        logger.error(f"Database test error: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/db/stats")
async def get_database_stats():
    """데이터베이스 뉴스 통계"""
    try:
        stats = crawler_manager.db_manager.get_news_stats()
        return {"stats": stats}
    except Exception as e:
        logger.error(f"Error getting database stats: {e}")
        return {"error": str(e)}

@app.get("/news/pending")
async def get_pending_news(limit: int = 10):
    """승인 대기 중인 뉴스 조회"""
    try:
        pending_news = crawler_manager.db_manager.get_pending_news(limit)
        return {"news": pending_news, "count": len(pending_news)}
    except Exception as e:
        logger.error(f"Error getting pending news: {e}")
        return {"error": str(e)}

@app.get("/categories")
async def get_categories():
    """지원되는 카테고리 목록 조회"""
    try:
        categories = {
            "politics": msg.get("categories.politics"),
            "economy": msg.get("categories.economy"),
            "society": msg.get("categories.society"),
            "technology": msg.get("categories.technology"),
            "world": msg.get("categories.world"),
            "environment": msg.get("categories.environment")
        }
        return {"categories": categories}
    except Exception as e:
        logger.error(f"Error getting categories: {e}")
        return {"error": str(e)}
