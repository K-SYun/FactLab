# Gemini AI 분석 라우터

from fastapi import APIRouter, HTTPException, Query
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

def get_existing_analysis_type(news_id: int):
    """기존 분석 타입 조회"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT analysis_type FROM news_summary WHERE news_id = %s", (news_id,))
        result = cursor.fetchone()
        return result['analysis_type'] if result else None
    finally:
        cursor.close()
        conn.close()

@router.post("/analyze/news/{news_id}")
async def analyze_news(
    news_id: int,
    summary_id: int = Query(default=None, description="분석 작업 ID (선택)"),
    analysis_type: str = Query(default=None, description="분석 타입: COMPREHENSIVE, FACT_ANALYSIS, BIAS_ANALYSIS")
):
    """뉴스 Gemini AI 분석 실행"""
    try:
        # summary_id가 없으면 자동으로 조회
        if summary_id is None:
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM news_summary WHERE news_id = %s ORDER BY created_at DESC LIMIT 1", (news_id,))
                result = cursor.fetchone()
                if result:
                    summary_id = result['id']
                    logger.info(f"뉴스 {news_id}: summary_id 자동 조회 완료 (id={summary_id})")
                else:
                    raise HTTPException(status_code=404, detail=f"뉴스 {news_id}에 대한 요약 정보가 없습니다.")
            finally:
                cursor.close()
                conn.close()

        # 기존 분석 타입 조회 (재분석인 경우)
        existing_analysis_type = get_existing_analysis_type(news_id)
        
        # 분석 타입 결정: 기존 타입 > 요청 타입 > 기본값
        final_analysis_type = existing_analysis_type or analysis_type or "COMPREHENSIVE"
        
        # 분석 타입 검증 및 매핑 
        type_mapping = {
            "COMPREHENSIVE": "NEWS_COMPREHENSIVE",
            "FACT_ANALYSIS": "NEWS_FACT_ANALYSIS", 
            "BIAS_ANALYSIS": "NEWS_BIAS_ANALYSIS"
        }
        valid_types = ["COMPREHENSIVE", "FACT_ANALYSIS", "BIAS_ANALYSIS"]
        if final_analysis_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"유효하지 않은 분석 타입입니다. 허용되는 값: {valid_types}")
        
        # 재분석인지 신규 분석인지 로그로 표시
        if existing_analysis_type:
            logger.info(f"뉴스 {news_id} AI 재분석 요청 (기존 타입 유지: {final_analysis_type})")
        else:
            logger.info(f"뉴스 {news_id} AI 신규 분석 요청 (타입: {final_analysis_type})")
        
        # 뉴스 조회
        news = get_news_by_id(news_id)
        if not news:
            raise HTTPException(status_code=404, detail="뉴스를 찾을 수 없습니다.")
        
        # Gemini 분석기 초기화
        analyzer = GeminiNewsAnalyzer()
        
        # 분석 수행 (분석 + DB 저장 + 백엔드 알림)
        prompt_type = type_mapping[final_analysis_type]
        result = analyzer.analyze_news_complete(
            news_id=news_id,
            summary_id=summary_id, # summary_id 전달
            title=news.get('title', ''),
            content=news.get('content', ''),
            source=news.get('source', '출처 불명'),
            analysis_type=final_analysis_type,
            prompt_type=prompt_type
        )
        
        logger.info(f"뉴스 {news_id} AI 분석 완료")
        
        return {
            "success": True,
            "news_id": news_id,
            "title": news.get('title', ''),
            "analysis_type": final_analysis_type,
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
