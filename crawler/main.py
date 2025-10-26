from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.crawlers.crawler_manager import UnifiedCrawlerManager
from app.api.crawler_api import router as crawler_router
# AI 분석은 관리자에서 별도 처리
from app.localization.messages import msg
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FactLab Crawler AI Service", version="1.0.0")

# API 라우터 등록
app.include_router(crawler_router)

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

@app.on_event("startup")
async def startup_event():
    """서비스 시작 시 스케줄러 시작"""
    logger.info("🚀 Starting UnifiedCrawlerManager scheduler...")
    await crawler_manager.start_scheduler()
    logger.info("✅ UnifiedCrawlerManager scheduler started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """서비스 종료 시 스케줄러 중지"""
    logger.info("🛑 Stopping UnifiedCrawlerManager scheduler...")
    await crawler_manager.stop_scheduler()
    logger.info("✅ UnifiedCrawlerManager scheduler stopped successfully")

@app.get("/")
def root():
    return {"message": "FactLab Crawler AI Service is running"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "crawler_ai"}

@app.post("/crawl/news")
async def crawl_news(background_tasks: BackgroundTasks, category: str = "politics"):
    """뉴스 수집 및 DB 저장"""
    async def crawl_task():
        try:
            result = await crawler_manager.manual_crawl_all()
            logger.info(f"Crawl result: {result}")
            return result
        except Exception as e:
            logger.error(f"Error crawling news: {e}")
            return {'saved': 0, 'duplicates': 0, 'errors': 1}
    
    background_tasks.add_task(crawl_task)
    return {"message": f"News crawling started"}

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

@app.post("/crawl/daum")
async def crawl_daum_only(background_tasks: BackgroundTasks):
    """다음 뉴스만 수집 및 DB 저장 (테스트용)"""
    async def crawl_task():
        try:
            result = await crawler_manager.crawl_daum_news()
            logger.info(f"Daum crawl result: {result}")
            return result
        except Exception as e:
            logger.error(f"Error crawling Daum news: {e}")
            return {'saved': 0, 'duplicates': 0, 'errors': 1}
    
    background_tasks.add_task(crawl_task)
    return {"message": "Daum news crawling started"}

@app.post("/crawl/bills")
async def crawl_bills(background_tasks: BackgroundTasks, days: int = 30):
    """국회 법안 수집 및 DB 저장"""
    async def crawl_task():
        try:
            result = await crawler_manager.crawl_bills(days=days)
            logger.info(f"Crawl result: {result}")
            return result
        except Exception as e:
            logger.error(f"Error crawling bills: {e}")
            return {'saved': 0, 'duplicates': 0, 'errors': 1}
    
    background_tasks.add_task(crawl_task)
    return {"message": f"Bill crawling started for the last {days} days"}

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

# 카드뉴스 생성 엔드포인트
@app.post("/api/card-news/generate")
async def generate_card_news(request_data: dict):
    """AI 분석 완료된 뉴스로 카드뉴스 생성"""
    try:
        from app.ai.card_news_generator import CardNewsGenerator

        news_data = request_data.get("news", {})
        num_slides = request_data.get("num_slides", 5)

        # 필수 데이터 검증
        if not news_data:
            raise HTTPException(status_code=400, detail="뉴스 데이터가 없습니다.")

        news_id = news_data.get("newsId")
        title = news_data.get("newsTitle", "")
        content = news_data.get("newsContent", "")
        summary = news_data.get("aiSummary", "")
        claim = news_data.get("aiClaim", "")
        keywords = news_data.get("aiKeywords", "")
        thumbnail_url = news_data.get("newsThumbnailUrl", "")

        if not news_id or not title:
            raise HTTPException(status_code=400, detail="필수 데이터가 누락되었습니다.")

        # 카드뉴스 생성기 초기화
        generator = CardNewsGenerator()

        # 카드뉴스 생성
        card_news = generator.generate_card_news_complete(
            news_id=news_id,
            title=title,
            content=content,
            summary=summary,
            claim=claim,
            keywords=keywords,
            thumbnail_url=thumbnail_url,
            num_slides=num_slides
        )

        logger.info(f"Card news generated successfully for news {news_id}")

        return {
            "success": True,
            "message": "카드뉴스 생성 성공",
            "card_news": card_news
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating card news: {e}")
        raise HTTPException(status_code=500, detail=f"카드뉴스 생성 실패: {str(e)}")
