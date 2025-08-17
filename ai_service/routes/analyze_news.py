# Gemini AI 분석 라우터

from fastapi import APIRouter, HTTPException
from analyzers.gemini_analyzer import GeminiNewsAnalyzer
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# 데이터베이스 연결
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://factlab_user:password@database:5432/factlab")

def get_db_connection():
    """데이터베이스 연결"""
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def get_news_by_id(news_id: int):
    """뉴스 ID로 뉴스 조회"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM news WHERE id = %s", (news_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

@router.post("/analyze/news/{news_id}")
async def analyze_news(news_id: int):
    """뉴스 Gemini AI 분석 실행"""
    try:
        logger.info(f"뉴스 {news_id} AI 분석 요청")
        
        # 뉴스 조회
        news = get_news_by_id(news_id)
        if not news:
            raise HTTPException(status_code=404, detail="뉴스를 찾을 수 없습니다.")
        
        # Gemini 분석기 초기화
        analyzer = GeminiNewsAnalyzer()
        
        # 종합 분석 수행 (분석 + DB 저장 + 백엔드 알림)
        result = analyzer.analyze_news_complete(
            news_id=news_id,
            title=news.get('title', ''),
            content=news.get('content', '')
        )
        
        logger.info(f"뉴스 {news_id} AI 분석 완료")
        
        return {
            "success": True,
            "news_id": news_id,
            "title": news.get('title', ''),
            "analysis_summary": result.get('analysis', {}).get('summary', ''),
            "db_saved": result.get('db_saved', False),
            "backend_notified": result.get('backend_notified', False),
            "status": result.get('status', 'unknown')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"뉴스 {news_id} AI 분석 오류: {e}")
        raise HTTPException(status_code=500, detail=f"AI 분석 실패: {str(e)}")

@router.get("/analyze/status/{news_id}")
async def get_analysis_status(news_id: int):
    """뉴스 분석 상태 확인"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # news_summary에서 분석 상태 확인
        cursor.execute("""
            SELECT ns.*, n.title 
            FROM news_summary ns 
            JOIN news n ON ns.news_id = n.id 
            WHERE ns.news_id = %s
        """, (news_id,))
        
        result = cursor.fetchone()
        
        if result:
            return {
                "news_id": news_id,
                "title": result['title'],
                "status": result['status'],
                "has_summary": bool(result['summary']),
                "reliability_score": result['reliability_score'],
                "created_at": result['created_at'],
                "updated_at": result['updated_at']
            }
        else:
            return {
                "news_id": news_id,
                "status": "not_analyzed",
                "has_summary": False
            }
            
    except Exception as e:
        logger.error(f"분석 상태 확인 오류: {e}")
        raise HTTPException(status_code=500, detail="분석 상태 확인 실패")
    finally:
        if 'conn' in locals():
            cursor.close()
            conn.close()
