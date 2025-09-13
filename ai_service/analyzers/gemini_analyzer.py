# Gemini AI 분석기 (통합 버전)

import os
import requests
import json
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional, Dict
from datetime import datetime
from dotenv import load_dotenv
from config.prompt_loader import get_prompt_loader

# 환경변수 로드
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiNewsAnalyzer:
    def __init__(self):
        # Gemini API 설정
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
        
        # 백엔드 API 엔드포인트
        self.backend_url = os.getenv('BACKEND_URL', 'http://backend-service:8080')
        
        # 데이터베이스 설정
        self.db_url = os.getenv("DATABASE_URL", "postgresql://factlab_user:password@database:5432/factlab")
        
        if not self.api_key:
            logger.warning("GEMINI_API_KEY가 설정되지 않았습니다. Fallback 분석을 사용합니다.")
            self.enabled = False
        else:
            self.enabled = True
            logger.info("Gemini API 분석기가 활성화되었습니다.")
    
    def get_db_connection(self):
        """데이터베이스 연결"""
        return psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)
    
    def analyze_news_content(self, title: str, content: str, source: str = "출처 불명", analysis_type: str = "COMPREHENSIVE") -> Dict:
        """뉴스 내용 종합 분석"""
        if not self.enabled:
            return self.generate_fallback_analysis(title, content)
        
        try:
            logger.info(f"Gemini AI 분석 시작 - 제목: {title[:50]}..., 타입: {analysis_type}")
            
            # YAML 파일에서 프롬프트 로드
            prompt_loader = get_prompt_loader()
            
            # source 매개변수를 직접 사용
            
            prompt = prompt_loader.build_prompt(analysis_type, title, content, source)
            
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            
            response = requests.post(
                f"{self.api_url}?key={self.api_key}",
                headers=headers,
                data=json.dumps(payload),
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                analysis_text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
                
                # JSON 파싱 시도
                try:
                    # JSON 블록 추출 (```json으로 감싸진 경우 처리)
                    if "```json" in analysis_text:
                        analysis_text = analysis_text.split("```json")[1].split("```")[0].strip()
                    elif "```" in analysis_text:
                        analysis_text = analysis_text.split("```")[1].split("```")[0].strip()
                    
                    analysis_result = json.loads(analysis_text)
                    logger.info(f"Gemini AI 분석 완료 - 신뢰도: {analysis_result.get('reliability_score', 'N/A')}")
                    return analysis_result
                    
                except json.JSONDecodeError as e:
                    logger.warning(f"JSON 파싱 실패, 텍스트 분석 사용: {e}")
                    return self.parse_text_analysis(analysis_text, title, content)
            
            else:
                logger.error(f"Gemini API 응답 오류: {response.status_code} {response.text}")
                return self.generate_fallback_analysis(title, content)
        
        except Exception as e:
            logger.error(f"Gemini 분석 중 오류: {e}")
            return self.generate_fallback_analysis(title, content)
    
    def parse_text_analysis(self, text: str, title: str, content: str) -> Dict:
        """텍스트 형태 분석 결과를 파싱"""
        try:
            # 기본값 설정
            result = {
                "summary": text[:200] + "..." if len(text) > 200 else text,
                "claim": "AI 분석 결과를 확인하시기 바랍니다.",
                "keywords": self.extract_keywords_from_content(title + " " + content),
                "reliability_score": 75,
                "suspicious_points": "추가 검증이 필요합니다."
            }
            
            return result
            
        except Exception as e:
            logger.error(f"텍스트 분석 파싱 오류: {e}")
            return self.generate_fallback_analysis(title, content)
    
    def extract_keywords_from_content(self, text: str) -> str:
        """간단한 키워드 추출"""
        # 한국어 불용어
        stopwords = {'은', '는', '이', '가', '을', '를', '에', '의', '로', '와', '과', '한', '할', '하는', '하며', '있는', '있다', '때문에', '통해', '위해', '대한', '관한', '같은', '따른', '위한'}
        
        words = []
        for word in text.split():
            if len(word) > 1 and word not in stopwords:
                words.append(word)
        
        # 빈도수 기준으로 상위 5개 추출 (간단 구현)
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
        keywords = [word[0] for word in top_words]
        
        return ','.join(keywords) if keywords else '키워드,분석,뉴스,정보,내용'
    
    def generate_fallback_analysis(self, title: str, content: str) -> Dict:
        """Gemini API 실패 시 fallback 분석"""
        logger.info("Fallback 분석 모드 사용")
        
        # 카테고리 감지
        category_keywords = {
            "정치": ["정부", "국회", "대통령", "정책", "법안", "선거", "정치", "당", "의원"],
            "경제": ["경제", "시장", "주식", "금리", "투자", "기업", "증시", "실적", "매출", "수익"],
            "사회": ["사회", "교육", "복지", "안전", "문화", "시민", "지역", "주민", "생활"],
            "기술": ["기술", "IT", "AI", "과학", "연구", "개발", "혁신", "디지털", "스마트"],
            "연예": ["연예", "배우", "가수", "드라마", "영화", "방송", "음악", "예능"]
        }
        
        detected_category = "일반"
        max_matches = 0
        text_lower = (title + " " + content).lower()
        
        for category, keywords in category_keywords.items():
            matches = sum(1 for keyword in keywords if keyword in text_lower)
            if matches > max_matches:
                max_matches = matches
                detected_category = category
        
        # 신뢰도 계산 (간단한 휴리스틱)
        reliability = 70
        if len(content) > 500:
            reliability += 10
        if max_matches > 2:
            reliability += 5
        
        return {
            "summary": f"{title}에 관한 {detected_category} 분야 뉴스입니다. 주요 내용과 관련 정보를 포함하고 있으며, 추가 검증이 필요할 수 있습니다.",
            "claim": f"{detected_category} 관련 주요 이슈로, 관련 기관이나 전문가의 입장과 대응 방안이 포함되어 있습니다.",
            "keywords": self.extract_keywords_from_content(title + " " + content),
            "reliability_score": min(reliability, 85),
            "suspicious_points": "구체적인 근거 자료와 출처 확인이 필요하며, 관련 전문가의 의견을 추가로 확인하는 것이 좋습니다."
        }
    
    def save_analysis_to_db(self, news_id: int, analysis: Dict, analysis_type: str = "COMPREHENSIVE", summary_id: int = None) -> bool:
        """AI 분석 결과를 DB에 저장 (수정된 로직)"""
        conn = None
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # summary_id가 제공된 경우 해당 레코드 직접 사용
            if summary_id:
                logger.info(f"제공된 summary_id 사용: {summary_id}")
                cursor.execute("SELECT id FROM news_summary WHERE id = %s", (summary_id,))
                record_to_update = cursor.fetchone()
                if not record_to_update:
                    logger.error(f"제공된 summary_id({summary_id})에 해당하는 레코드를 찾지 못했습니다")
                    return False
                update_summary_id = summary_id
            else:
                # 기존 로직: PENDING 상태의 특정 분석 타입 레코드 찾기
                logger.info(f"DB에서 업데이트할 레코드 검색: news_id={news_id}, analysis_type={analysis_type}")
                cursor.execute("SELECT id FROM news_summary WHERE news_id = %s AND analysis_type = %s AND status = 'PENDING' ORDER BY created_at DESC LIMIT 1",
                               (news_id, analysis_type))
                record_to_update = cursor.fetchone()

                if not record_to_update:
                    logger.error(f"업데이트할 PENDING 상태의 요약 레코드를 찾지 못했습니다: news_id={news_id}, type={analysis_type}")
                    # PENDING이 없으면, 그냥 news_id와 type으로 찾아본다 (재분석의 경우)
                    cursor.execute("SELECT id FROM news_summary WHERE news_id = %s AND analysis_type = %s ORDER BY created_at DESC LIMIT 1",
                                   (news_id, analysis_type))
                    record_to_update = cursor.fetchone()
                    if not record_to_update:
                        logger.error(f"재분석을 위한 요약 레코드도 찾지 못했습니다: news_id={news_id}, type={analysis_type}")
                        return False

                update_summary_id = record_to_update['id']
            logger.info(f"레코드 찾음 (ID: {update_summary_id}). 업데이트를 진행합니다.")

            # 공통 필드 추출
            summary = analysis.get('summary', '')
            claim = analysis.get('main_claim', analysis.get('claim', ''))
            keywords = ','.join(analysis.get('keywords', [])) if isinstance(analysis.get('keywords'), list) else analysis.get('keywords', '')
            reliability_score = analysis.get('credibility', {}).get('score') if isinstance(analysis.get('credibility'), dict) else analysis.get('reliability_score', 75)
            suspicious_points = analysis.get('suspicious_points', '')

            # 전체 분석 결과를 JSON으로 저장
            full_analysis_result = json.dumps(analysis, ensure_ascii=False, indent=2)

            # 업데이트 실행
            cursor.execute("""
                UPDATE news_summary
                SET summary = %s, claim = %s, keywords = %s,
                    reliability_score = %s, ai_confidence = %s,
                    updated_at = %s, status = 'COMPLETED',
                    full_analysis_result = %s, suspicious_points = %s
                WHERE id = %s
            """, (
                summary, claim, keywords, reliability_score,
                min(reliability_score, 95) if reliability_score else 80,
                datetime.now(), full_analysis_result, suspicious_points, update_summary_id
            ))
            
            conn.commit()
            logger.info(f"뉴스 {news_id} (Summary ID: {update_summary_id}) AI 분석 결과 DB 저장 완료 (타입: {analysis_type})")
            return True
            
        except Exception as e:
            logger.error(f"DB 저장 오류: {e}")
            if conn:
                conn.rollback()
            return False
        finally:
            if conn:
                cursor.close()
                conn.close()
    
    def notify_backend(self, news_id: int) -> bool:
        """백엔드에 분석 완료 알림"""
        try:
            url = f"{self.backend_url}/api/news/{news_id}/analysis-complete"
            response = requests.post(url, timeout=10)
            
            if response.status_code == 200:
                logger.info(f"백엔드 알림 성공: 뉴스 {news_id}")
                return True
            else:
                logger.warning(f"백엔드 알림 실패: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"백엔드 알림 오류: {e}")
            return False
    
    def analyze_news_complete(self, news_id: int, title: str, content: str, source: str = "출처 불명", analysis_type: str = "COMPREHENSIVE", prompt_type: str = None, summary_id: int = None) -> Dict:
        """뉴스 종합 분석 및 결과 저장"""
        try:
            logger.info(f"뉴스 {news_id} 종합 분석 시작")
            
            # AI 분석 수행 (prompt_type 우선 사용)
            effective_type = prompt_type or analysis_type
            analysis = self.analyze_news_content(title, content, source, effective_type)
            
            # DB에 저장 (summary_id가 제공된 경우 우선 사용)
            db_saved = self.save_analysis_to_db(news_id, analysis, analysis_type, summary_id)
            
            # 백엔드 알림
            backend_notified = self.notify_backend(news_id)
            
            result = {
                "news_id": news_id,
                "analysis": analysis,
                "db_saved": db_saved,
                "backend_notified": backend_notified,
                "status": "completed" if db_saved else "failed"
            }
            
            logger.info(f"뉴스 {news_id} 분석 완료 - DB: {db_saved}, Backend: {backend_notified}")
            return result
            
        except Exception as e:
            logger.error(f"뉴스 {news_id} 분석 실패: {e}")
            return {
                "news_id": news_id,
                "status": "failed",
                "error": str(e),
                "db_saved": False,
                "backend_notified": False
            }
