# ai-service/analyzers/gemini_analyzer.py
import os
import re
import time
import json
import logging
import requests
from typing import Optional, Dict, Any
from datetime import datetime
from psycopg2.extras import RealDictCursor
import psycopg2
from dotenv import load_dotenv

# optional konlpy for better keyword extraction
try:
    from konlpy.tag import Okt
    KONLPY_AVAILABLE = True
    okt = Okt()
except Exception:
    KONLPY_AVAILABLE = False

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiNewsAnalyzer:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        # 기본: 최신 flash 모델 주소(환경/권한에 따라 경로 변경 필요)
        self.api_url = os.getenv("GEMINI_API_URL",
                                 "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent")
        self.db_url = os.getenv("DATABASE_URL", "postgresql://factlab_user:password@database:5432/factlab")
        self.backend_url = os.getenv("BACKEND_URL", "http://backend-service:8080")
        self.max_retries = int(os.getenv("GEMINI_MAX_RETRIES", "2"))
        self.retry_backoff = float(os.getenv("GEMINI_RETRY_BACKOFF", "1.5"))

        if not self.api_key:
            logger.warning("GEMINI_API_KEY 미설정 — API 호출 비활성화, fallback 모드만 동작")
            self.enabled = False
        else:
            self.enabled = True

    # -------------------------
    # DB helpers
    # -------------------------
    def get_db_connection(self):
        return psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)

    def mark_analysis_status(self, news_id: int, status: str, error_msg: Optional[str] = None):
        """status: IN_PROGRESS / COMPLETED / FAILED"""
        conn = None
        try:
            conn = self.get_db_connection()
            cur = conn.cursor()
            now = datetime.now()
            # upsert-ish behavior
            cur.execute("SELECT id FROM news_summary WHERE news_id = %s", (news_id,))
            row = cur.fetchone()
            if row:
                cur.execute("""
                    UPDATE news_summary
                    SET status=%s, error_message=%s, updated_at=%s
                    WHERE news_id=%s
                """, (status, error_msg, now, news_id))
            else:
                cur.execute("""
                    INSERT INTO news_summary (news_id, status, error_message, created_at, updated_at, analysis_type)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (news_id, status, error_msg, now, now, 'COMPREHENSIVE'))
            conn.commit()
            cur.close()
            logger.debug(f"news_summary status updated: {news_id} -> {status}")
        except Exception as e:
            logger.error(f"DB status update error for {news_id}: {e}")
        finally:
            if conn:
                conn.close()

    def save_analysis_to_db(self, news_id: int, analysis: Dict[str, Any]) -> bool:
        """저장: 기존이 있으면 업데이트, 없으면 insert. analysis는 JSON serializable"""
        conn = None
        try:
            conn = self.get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT id FROM news_summary WHERE news_id = %s", (news_id,))
            existing = cur.fetchone()
            now = datetime.now()
            summary = analysis.get("summary", "")
            claim = analysis.get("claim", "")
            keywords = analysis.get("keywords", "")
            reliability = analysis.get("reliability_score", None)
            suspicious = analysis.get("suspicious_points", "")

            if existing:
                cur.execute("""
                    UPDATE news_summary
                    SET summary=%s, claim=%s, keywords=%s, reliability_score=%s,
                        suspicious_points=%s, status=%s, updated_at=%s, analysis_type=%s
                    WHERE news_id=%s
                """, (summary, claim, keywords, reliability, suspicious, 'COMPLETED', now, 'COMPREHENSIVE', news_id))
            else:
                cur.execute("""
                    INSERT INTO news_summary
                    (news_id, summary, claim, keywords, reliability_score, suspicious_points, status, created_at, updated_at, analysis_type)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (news_id, summary, claim, keywords, reliability, suspicious, 'COMPLETED', now, now, 'COMPREHENSIVE'))
            conn.commit()
            cur.close()
            logger.info(f"Saved analysis to DB for news {news_id}")
            return True
        except Exception as e:
            logger.error(f"DB save error for news {news_id}: {e}")
            # ensure we flag as failed in DB
            try:
                if conn:
                    conn.rollback()
            except:
                pass
            return False
        finally:
            if conn:
                conn.close()

    # -------------------------
    # Utility helpers
    # -------------------------
    def detect_category(self, title: str, content: str) -> str:
        text = (title + " " + content).lower()
        mapping = {
            "정치": ["정부", "국회", "대통령", "선거", "정당", "의원", "정책"],
            "경제": ["경제", "증시", "주가", "금리", "투자", "기업", "시장"],
            "사회": ["사회", "교육", "사건", "사고", "복지", "범죄"],
            "기술": ["it", "기술", "ai", "인공지능", "과학", "연구", "스타트업"],
            "연예": ["연예", "가수", "배우", "영화", "드라마"]
        }
        best = "일반"
        best_score = 0
        for cat, kws in mapping.items():
            score = sum(1 for k in kws if k in text)
            if score > best_score:
                best_score = score
                best = cat
        logger.debug(f"Detected category: {best} (score={best_score})")
        return best

    def build_prompt(self, title: str, content: str, category: str) -> str:
        # 고도화 프롬프트(정치/비정치 분기)
        base = (
            "당신은 전문 팩트체커이자 뉴스 분석가입니다. "
            "아래 뉴스 기사를 읽고 JSON 형식으로 결과만 출력하세요.\n\n"
            f"제목: {title}\n"
            f"내용: {content[:2000]}\n\n"
        )

        # politics: 더 엄격한 검증 지침
        if category == "정치":
            extra = (
                "정치 분야 기사이므로, 주장(claim)에 대해 출처·발언자·시점·근거가 명확한지 엄밀히 따져 주세요. "
                "객관적 근거가 부족한 부분은 '검증 필요'로 표시하고, 관련 사실을 확인할 수 있는 외부 출처(기관, 보도 등)를 제시 가능한 경우 추천하세요."
            )
        else:
            extra = (
                "비정치 분야 기사이므로, 핵심 사실의 검증 가능성과 출처의 명확성에 중점을 두고 분석하세요. "
                "과장된 표현과 누락된 정보가 있는지 간단히 지적하세요."
            )

        footer = (
            "\n출력 형식(JSON):\n"
            "{\n"
            '  "summary": "...",\n'
            '  "claim": "...",\n'
            '  "keywords": "키워드1,키워드2,키워드3,키워드4,키워드5",\n'
            '  "reliability_score": 0,\n'
            '  "suspicious_points": "..." \n'
            "}\n"
        )

        return base + extra + footer

    def call_gemini(self, prompt: str) -> Optional[str]:
        """동기 호출 + 재시도(backoff). 결과 텍스트 반환."""
        if not self.enabled:
            logger.debug("Gemini disabled - skipping API call")
            return None

        headers = {"Content-Type": "application/json"}
        payload = {"contents": [{"parts": [{"text": prompt}]}]}

        for attempt in range(1, self.max_retries + 2):
            try:
                resp = requests.post(f"{self.api_url}?key={self.api_key}",
                                     headers=headers,
                                     data=json.dumps(payload),
                                     timeout=30)
                if resp.status_code == 200:
                    j = resp.json()
                    # safe extraction
                    candidates = j.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [])[0].get("text", "")
                        return text.strip()
                    else:
                        logger.warning("Gemini 응답에 candidates 없음")
                        return None
                else:
                    logger.warning(f"Gemini API status {resp.status_code}: {resp.text}")
                    # on certain 5xx or rate limit, retry
            except requests.RequestException as e:
                logger.warning(f"Gemini request exception (attempt {attempt}): {e}")
            # backoff
            sleep_time = self.retry_backoff * attempt
            logger.debug(f"Retrying after {sleep_time}s...")
            time.sleep(sleep_time)

        logger.error("Gemini API 호출 실패 - 모든 재시도 후")
        return None

    def extract_json_from_text(self, text: str) -> Optional[Dict]:
        """응답 텍스트에서 JSON 객체를 안정적으로 추출하려고 시도"""
        if not text:
            return None
        # 1) fenced code block containing json
        m = re.search(r"```(?:json)?\s*({[\s\S]*?})\s*```", text, re.IGNORECASE)
        if m:
            candidate = m.group(1)
        else:
            # 2) find first {...} large block (greedy)
            m2 = re.search(r"({[\s\S]*})", text)
            candidate = m2.group(1) if m2 else None

        if not candidate:
            return None

        try:
            parsed = json.loads(candidate)
            return parsed
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse error: {e}")
            # try to clean trailing commas etc
            cleaned = re.sub(r",\s*}", "}", candidate)
            cleaned = re.sub(r",\s*]", "]", cleaned)
            try:
                return json.loads(cleaned)
            except Exception as e2:
                logger.error(f"JSON second parse failed: {e2}")
                return None

    def extract_keywords(self, text: str, top_n: int = 5) -> str:
        """konlpy가 있으면 명사 추출, 없으면 간단 빈도 기반"""
        if not text:
            return "키워드,없음"
        if KONLPY_AVAILABLE:
            try:
                nouns = okt.nouns(text)
                # filter short
                nouns = [n for n in nouns if len(n) > 1]
                freq = {}
                for n in nouns:
                    freq[n] = freq.get(n, 0) + 1
                top = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:top_n]
                return ",".join([t[0] for t in top]) if top else ",".join(nouns[:top_n])
            except Exception as e:
                logger.warning(f"konlpy error: {e}")
                # fallback
        # fallback: simple split by whitespace and punctuation
        tokens = re.findall(r"\w{2,}", text)
        freq = {}
        for t in tokens:
            freq[t] = freq.get(t, 0) + 1
        top = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:top_n]
        return ",".join([t[0] for t in top]) if top else "키워드,분석,뉴스"

    def generate_fallback_analysis(self, title: str, content: str) -> Dict:
        """간단하지만 더 신뢰할 수 있는 폴백: 제목 + 본문 초반 요약 + 키워드"""
        snippet = content.strip().replace("\n", " ")
        snippet = (snippet[:600] + "...") if len(snippet) > 600 else snippet
        keywords = self.extract_keywords(title + " " + snippet)
        reliability = 70 + (5 if len(content) > 400 else 0)
        return {
            "summary": f"{title} - {snippet[:800] if len(snippet) <= 800 else snippet[:800] + ' (계속...)'}",
            "claim": "본문에서 파악되는 주요 주장(자동 추출). 관리자 검토 필요",
            "keywords": keywords,
            "reliability_score": min(reliability, 90),
            "suspicious_points": "출처 및 구체적 근거가 부족할 수 있음"
        }

    def parse_free_text_analysis(self, text: str, title: str, content: str) -> Dict:
        """AI가 JSON이 아닌 자유 텍스트를 줄 경우 핵심 부분을 뽑아 폴더블한 structure로 변환"""
        # attempt to find labelled fields like "summary:", "keywords:" etc.
        res = {"summary": "", "claim": "", "keywords": "", "reliability_score": 75, "suspicious_points": ""}
        try:
            # try to extract lines starting with keywords
            lines = [l.strip() for l in text.splitlines() if l.strip()]
            joined = " ".join(lines)
            # naive heuristics
            sum_m = re.search(r"(summary[:\-]\s*)(.+?)(?=(claim[:\-]|keywords[:\-]|reliability|suspicious|$))",
                              joined, re.IGNORECASE)
            if sum_m:
                res["summary"] = sum_m.group(2).strip()
            else:
                # use more complete text as summary - avoid truncating
                res["summary"] = text[:1000] if len(text) <= 1000 else text[:1000] + " (계속...)"
            # keywords heuristic
            kw_m = re.search(r"(keywords?[:\-]\s*)([^\n]+)", joined, re.IGNORECASE)
            if kw_m:
                res["keywords"] = kw_m.group(2).strip()
            else:
                res["keywords"] = self.extract_keywords(title + " " + content)
            # suspicious points
            sp_m = re.search(r"(suspicious|검증|의심|issue)[:\-]\s*([^\n]+)", joined, re.IGNORECASE)
            if sp_m:
                res["suspicious_points"] = sp_m.group(2).strip()
            else:
                res["suspicious_points"] = ""
            # reliability attempt
            rel_m = re.search(r"(reliability_score|reliability|score)[:\-]\s*(\d{1,3})", joined, re.IGNORECASE)
            if rel_m:
                res["reliability_score"] = int(rel_m.group(2))
            return res
        except Exception as e:
            logger.error(f"parse_free_text_analysis error: {e}")
            return self.generate_fallback_analysis(title, content)

    # -------------------------
    # Main orchestration
    # -------------------------
    def analyze_news_complete(self, news_id: int, title: str, content: str) -> Dict[str, Any]:
        """종합 파이프라인: 상태 표시 -> AI 호출 -> 파싱 -> DB 저장 -> 백엔드 알림"""
        logger.info(f"Start analysis for news {news_id}")
        # 1) mark in progress
        self.mark_analysis_status(news_id, "IN_PROGRESS")

        category = self.detect_category(title, content)
        prompt = self.build_prompt(title, content, category)

        analysis_text = None
        if self.enabled:
            analysis_text = self.call_gemini(prompt)

        if not analysis_text:
            # fallback analysis
            analysis = self.generate_fallback_analysis(title, content)
            # save and mark failed? We'll save as COMPLETED but note fallback used.
            saved = self.save_analysis_to_db(news_id, analysis)
            self.mark_analysis_status(news_id, "COMPLETED" if saved else "FAILED")
            # notify backend but include note
            try:
                self.notify_backend(news_id, fallback=True)
            except:
                pass
            return {"news_id": news_id, "analysis": analysis, "db_saved": saved, "fallback": True}

        # try parse JSON
        parsed = self.extract_json_from_text(analysis_text)
        if parsed is None:
            # try to parse as free text labels
            parsed = self.parse_free_text_analysis(analysis_text, title, content)

        # ensure keys exist and types
        parsed.setdefault("summary", "")
        parsed.setdefault("claim", "")
        parsed.setdefault("keywords", self.extract_keywords(title + " " + content))
        parsed.setdefault("reliability_score", 75)
        parsed.setdefault("suspicious_points", "")

        # Save
        saved = self.save_analysis_to_db(news_id, parsed)
        # mark final status
        self.mark_analysis_status(news_id, "COMPLETED" if saved else "FAILED")
        # Notify backend
        try:
            self.notify_backend(news_id, fallback=False)
        except Exception as e:
            logger.warning(f"backend notify failed: {e}")

        return {"news_id": news_id, "analysis": parsed, "db_saved": saved, "fallback": False}

    # -------------------------
    # Backend notify
    # -------------------------
    def notify_backend(self, news_id: int, fallback: bool = False) -> bool:
        try:
            url = f"{self.backend_url}/api/news/{news_id}/analysis-complete"
            payload = {"news_id": news_id, "fallback": fallback}
            resp = requests.post(url, json=payload, timeout=10)
            if resp.status_code == 200:
                logger.info(f"Backend notified for {news_id}")
                return True
            else:
                logger.warning(f"Backend notify failed: {resp.status_code} {resp.text}")
                return False
        except Exception as e:
            logger.error(f"Backend notify error: {e}")
            return False
