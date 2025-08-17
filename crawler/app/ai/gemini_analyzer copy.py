# Gemini AI 분석기 (crawler 서비스용)

import os
import requests
import json
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional, Dict
from datetime import datetime

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
        self.db_host = os.getenv('DB_HOST', 'database')
        self.db_port = os.getenv('DB_PORT', '5432')
        self.db_name = os.getenv('DB_NAME', 'factlab')
        self.db_user = os.getenv('DB_USER', 'factlab_user')
        self.db_password = os.getenv('DB_PASSWORD', 'password')
        
        if not self.api_key:
            logger.warning("GEMINI_API_KEY가 설정되지 않았습니다. Fallback 분석을 사용합니다.")
            self.enabled = False
        else:
            self.enabled = True
            logger.info("Gemini API 분석기가 활성화되었습니다.")
    
    def get_db_connection(self):
        """데이터베이스 연결"""
        return psycopg2.connect(
            host=self.db_host,
            port=self.db_port,
            database=self.db_name,
            user=self.db_user,
            password=self.db_password,
            cursor_factory=RealDictCursor
        )
    
    def analyze_news_content(self, title: str, content: str) -> Dict:
        """뉴스 내용 종합 분석"""
        if not self.enabled:
            return self.generate_fallback_analysis(title, content)
        
        try:
            logger.info(f"Gemini AI 분석 시작 - 제목: {title[:50]}...")
            
            # 한국어 프롬프트 구성 - 분석적이고 비판적인 관점
            prompt = f"""

당신은 전문 뉴스 팩트체커이자 정치·사회 데이터 분석가입니다.
아래의 뉴스 기사에 대해 독자가 신뢰할 수 있는 정보 판단을 내릴 수 있도록
심층 분석을 수행하세요.

[입력 데이터]
제목: {title}
내용: {content[:2000]}

[분석 지침]
1. summary:
   - 핵심 사건, 관련 인물, 시기, 주요 쟁점을 포함
   - 단순 재진술이 아니라 독자가 맥락을 이해할 수 있도록 3~4문장으로 작성

2. claim_analysis:
   - 기사에서 전달하는 핵심 주장이나 논점 식별
   - 주장의 타당성을 비판적으로 검토
   - 해당 주장의 근거가 명확한지, 출처가 신뢰할 만한지 판단

3. key_facts:
   - 기사에서 전달하는 주요 사실 5~10개를 bullet point로 나열
   - 각 사실이 검증 가능한지 표시 (true/false/unknown)

4. keywords:
   - 사건명, 인물명, 핵심 개념을 포함한 5~7개의 주요 키워드 (쉼표 구분)

5. reliability_score (0~100):
   - 평가 기준:
     * 출처의 명확성 (0~25)
     * 사실 확인 가능성 (0~25)
     * 편향성 여부 (0~25)
     * 구체적 증거 존재 여부 (0~25)

6. suspicious_points:
   - 팩트체킹이 필요한 구체적 주장
   - 과장된 표현
   - 누락된 정보
   - 편향된 시각
   (각각의 의심 지점에 이유를 간단히 덧붙임)

7. bias_analysis:
   - 어휘, 프레이밍, 맥락에서 드러나는 정치적·이념적 편향 가능성 분석
   - bias_score: 1~5 (1=강한 편향, 5=매우 중립)
   - 편향 근거를 간략히 설명

8. additional_info_needed:
   - 독자가 균형 잡힌 판단을 위해 추가로 확인해야 할 정보나 반대 시각 제시

[출력 형식: JSON]
{
  "summary": "...",
  "claim_analysis": "...",
  "key_facts": [
    {"fact": "...", "verifiable": true},
    {"fact": "...", "verifiable": false}
  ],
  "keywords": ["...", "...", "..."],
  "reliability_score": X,
  "suspicious_points": [
    {"point": "...", "reason": "..."}
  ],
  "bias_analysis": {
    "bias_score": X,
    "description": "..."
  },
  "additional_info_needed": ["...", "..."]
}

# 기존 내용 정치뉴스를 제외한 나머지 뉴스 분석.
# 당신은 뉴스 데이터 분석가입니다.
# 아래 뉴스 기사에 대해 독자가 빠르게 이해할 수 있도록 핵심 정보만 분석하세요.

# 제목: {title}
# 내용: {content[:2000]}

# [분석 항목]
# 1. summary:
#    - 2~3문장으로 간결하게 요약
#    - 사건, 관련 인물, 주요 내용 포함

# 2. key_points:
#    - 기사에서 전달하는 핵심 정보 3~5개 bullet point

# 3. keywords:
#    - 주요 키워드 3~5개 (쉼표 구분)

# 4. category:
#    - 기사의 주제 분야 (사회, 경제, IT, 문화, 스포츠, 국제 등)

# 5. reliability_score (0~100):
#    - 출처의 명확성, 사실 확인 가능성, 증거 존재 여부를 종합 평가

# JSON 형식으로만 응답해 주세요:
# {{
#   "summary": "핵심 내용 분석 (단순 요약 아님)",
#   "claim": "주요 주장에 대한 비판적 분석",
#   "keywords": "키워드1,키워드2,키워드3,키워드4,키워드5",
#   "reliability_score": 점수(숫자),
#   "suspicious_points": "팩트체킹이 필요한 구체적 내용"
# }}
"""
            
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
            "경제": ["경제", "시장", "주식", "금리", "투자", "기업", "증시", "실적", "매출", "수익","펀드"],
            "사회": ["사회", "교육", "복지", "안전", "문화", "시민", "지역", "주민", "생활"],
            "IT/과학": ["기술", "IT", "AI", "과학", "연구", "개발", "혁신", "디지털", "스마트"],
            "세계": ["국제", "해외", "외교", "글로벌", "세계", "미국", "중국", "일본", "유럽", "UN", "협정", "조약", "아프리카", "북미", "남미"],
            "기후/환경": ["기후", "환경", "탄소", "온실가스", "재생에너지", "친환경", "지구온난화", "오염", "생태계", "ESG"]
            # "연예": ["연예", "배우", "가수", "드라마", "영화", "방송", "음악", "예능"]
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
    
    def save_analysis_to_db(self, news_id: int, analysis: Dict) -> bool:
        """AI 분석 결과를 DB에 저장"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # 기존 분석 결과 확인
            cursor.execute("SELECT id FROM news_summary WHERE news_id = %s", (news_id,))
            existing = cursor.fetchone()
            
            if existing:
                # 업데이트
                cursor.execute("""
                    UPDATE news_summary 
                    SET summary = %s, claim = %s, keywords = %s, 
                        reliability_score = %s, ai_confidence = %s, 
                        suspicious_points = %s, updated_at = %s, status = 'COMPLETED'
                    WHERE news_id = %s
                """, (
                    analysis.get('summary', ''),
                    analysis.get('claim', ''),
                    analysis.get('keywords', ''),
                    analysis.get('reliability_score', 75),
                    min(analysis.get('reliability_score', 75), 95),  # ai_confidence
                    analysis.get('suspicious_points', ''),
                    datetime.now(),
                    news_id
                ))
            else:
                # 새로 생성
                cursor.execute("""
                    INSERT INTO news_summary 
                    (news_id, summary, claim, keywords, reliability_score, ai_confidence, 
                     suspicious_points, status, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    news_id,
                    analysis.get('summary', ''),
                    analysis.get('claim', ''),
                    analysis.get('keywords', ''),
                    analysis.get('reliability_score', 75),
                    min(analysis.get('reliability_score', 75), 95),
                    analysis.get('suspicious_points', ''),
                    'COMPLETED',
                    datetime.now(),
                    datetime.now()
                ))
            
            conn.commit()
            logger.info(f"뉴스 {news_id} AI 분석 결과 DB 저장 완료")
            return True
            
        except Exception as e:
            logger.error(f"DB 저장 오류: {e}")
            return False
        finally:
            if 'conn' in locals():
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
    
    def analyze_news_complete(self, news_id: int, title: str, content: str) -> dict:
        """뉴스 종합 분석 및 결과 저장"""
        try:
            logger.info(f"뉴스 {news_id} 종합 분석 시작")
            
            # AI 분석 수행
            analysis = self.analyze_news_content(title, content)
            
            # DB에 저장
            db_saved = self.save_analysis_to_db(news_id, analysis)
            
            # 백엔드 알림
            backend_notified = self.notify_backend(news_id)
            
            result = {
                "news_id": news_id,
                "summary": analysis.get('summary', ''),
                "sentiment": "neutral",  # 기존 호환성을 위해 유지
                "keywords": analysis.get('keywords', '').split(',') if analysis.get('keywords') else [],
                "category": "일반",  # 기존 호환성을 위해 유지
                "status": "completed",
                "db_saved": db_saved,
                "notification_sent": backend_notified
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
                "notification_sent": False
            }