import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Optional
import logging
import os
from datetime import datetime
import re
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.connection_params = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5433'),  # FactLab 포트
            'database': os.getenv('DB_NAME', 'factlab'),
            'user': os.getenv('DB_USER', 'factlab_user'),
            'password': os.getenv('DB_PASSWORD', 'password')  # FactLab 비밀번호
        }
    
    def normalize_url(self, url: str) -> str:
        """URL 정규화 - 중복 체크를 위해 URL을 표준화"""
        try:
            # 네이버 뉴스 URL에서 댓글 페이지 패턴 제거
            # 예: /mnews/article/comment/xxx/yyy -> /mnews/article/xxx/yyy
            url = re.sub(r'/mnews/article/comment/', '/mnews/article/', url)
            
            # URL 파싱
            parsed = urlparse(url)
            
            # 쿼리 파라미터 제거 (추적 파라미터 등)
            # 보존할 파라미터만 선별적으로 유지
            query_params = parse_qs(parsed.query)
            essential_params = {}
            
            # 네이버 뉴스에서 필요한 파라미터만 유지 (oid, aid)
            if 'oid' in query_params:
                essential_params['oid'] = query_params['oid']
            if 'aid' in query_params:
                essential_params['aid'] = query_params['aid']
            
            # 정규화된 쿼리 문자열 생성
            normalized_query = urlencode(essential_params, doseq=True) if essential_params else ''
            
            # 정규화된 URL 재구성
            normalized_url = urlunparse((
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                parsed.params,
                normalized_query,
                ''  # fragment 제거
            ))
            
            return normalized_url
            
        except Exception as e:
            logger.warning(f"URL normalization failed for {url}: {e}")
            return url
    
    def normalize_title(self, title: str) -> str:
        """제목 정규화 - 중복 체크를 위해 제목을 표준화"""
        if not title:
            return ""
        
        # 제목에서 특수문자와 공백 정리
        normalized = re.sub(r'\s+', ' ', title.strip())  # 연속된 공백을 하나로
        normalized = re.sub(r'[^\w\s가-힣]', '', normalized)  # 특수문자 제거 (한글, 영문, 숫자, 공백만 유지)
        
        return normalized.lower()
        
    def get_connection(self):
        """데이터베이스 연결 반환"""
        try:
            conn = psycopg2.connect(**self.connection_params)
            return conn
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def save_news_item(self, news_item) -> Optional[int]:
        """뉴스 아이템 저장 - 강화된 중복 체크"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    # URL 정규화
                    normalized_url = self.normalize_url(news_item.source_url)
                    normalized_title = self.normalize_title(news_item.title)
                    
                    # 1단계: 정규화된 URL로 중복 체크
                    # DB의 모든 URL을 정규화해서 비교
                    cursor.execute("""
                        SELECT id, title, url FROM news 
                        WHERE REGEXP_REPLACE(url, '/mnews/article/comment/', '/mnews/article/', 'g') = %s
                    """, (normalized_url,))
                    
                    existing = cursor.fetchone()
                    if existing:
                        logger.info(f"🔄 중복 뉴스 스킵 (URL): {news_item.title[:50]}... (기존 ID: {existing[0]})")
                        return None
                    
                    # 2단계: 제목 기반 중복 체크 (같은 날짜, 같은 소스)
                    if normalized_title:
                        cursor.execute("""
                            SELECT id, title, url FROM news 
                            WHERE source = %s 
                            AND DATE(publish_date) = DATE(%s)
                            AND LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^\\w\\s가-힣]', '', 'g'), '\\s+', ' ', 'g')) = %s
                        """, (news_item.source, news_item.publish_date, normalized_title))
                        
                        title_duplicate = cursor.fetchone()
                        if title_duplicate:
                            logger.info(f"🔄 중복 뉴스 스킵 (제목): {news_item.title[:50]}... (기존 ID: {title_duplicate[0]}, 기존 URL: {title_duplicate[2]})")
                            return None
                    
                    # 새 뉴스 저장 (정규화된 URL로 저장)
                    insert_query = """
                        INSERT INTO news (title, content, url, source, publish_date, original_publish_date, category, status, created_at, updated_at, thumbnail, main_featured, view_count, visibility)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    """
                    
                    # 실제 발행 시간 값 확인 및 로깅
                    crawling_time = getattr(news_item, 'publish_date', datetime.now())
                    original_pub_date = getattr(news_item, 'original_publish_date', crawling_time)
                    
                    logger.info(f"💾 DB 저장 시간 정보:")
                    logger.info(f"   - 크롤링 시간: {crawling_time}")
                    logger.info(f"   - 실제 발행 시간: {original_pub_date}")
                    logger.info(f"   - 같은 시간인가? {crawling_time == original_pub_date}")
                    
                    # 필드 길이 체크 및 로깅
                    title_len = len(news_item.title) if news_item.title else 0
                    content_len = len(news_item.content) if news_item.content else 0
                    url_len = len(normalized_url) if normalized_url else 0
                    source_len = len(news_item.source) if news_item.source else 0
                    category_len = len(news_item.category) if news_item.category else 0
                    thumbnail_len = len(getattr(news_item, 'thumbnail', '') or '') 
                    
                    logger.info(f"📏 필드 길이 정보:")
                    logger.info(f"   - title: {title_len}/255 자")
                    logger.info(f"   - content: {content_len} 자 (TEXT)")
                    logger.info(f"   - url: {url_len}/512 자")
                    logger.info(f"   - source: {source_len}/100 자")
                    logger.info(f"   - category: {category_len}/50 자")
                    logger.info(f"   - thumbnail: {thumbnail_len}/1000 자")
                    
                    # 길이 초과 필드 체크
                    if title_len > 255:
                        logger.error(f"❌ title 길이 초과: {title_len}/255")
                    if url_len > 512:
                        logger.error(f"❌ url 길이 초과: {url_len}/512")
                    if source_len > 100:
                        logger.error(f"❌ source 길이 초과: {source_len}/100")
                    if category_len > 50:
                        logger.error(f"❌ category 길이 초과: {category_len}/50")
                    if thumbnail_len > 1000:
                        logger.error(f"❌ thumbnail 길이 초과: {thumbnail_len}/1000")
                        logger.error(f"❌ thumbnail 내용: {getattr(news_item, 'thumbnail', '')[:200]}...")
                    
                    cursor.execute(insert_query, (
                        news_item.title,
                        news_item.content,
                        normalized_url,  # 정규화된 URL 저장
                        news_item.source,
                        crawling_time,  # 크롤링 시간
                        original_pub_date,  # 실제 발행 시간
                        news_item.category,
                        'PENDING',  # 기본 상태
                        datetime.now(),
                        datetime.now(),
                        getattr(news_item, 'thumbnail', None),  # 썸네일이 없는 경우 None
                        getattr(news_item, 'main_featured', False),
                        0, # view_count 기본값
                        'PUBLIC' # visibility 기본값
                    ))
                    
                    news_id = cursor.fetchone()[0]
                    conn.commit()
                    
                    logger.info(f"✅ DB 저장 성공 (ID: {news_id}): {news_item.title[:50]}...")
                    return news_id
                    
        except Exception as e:
            logger.error(f"Error saving news item: {e}")
            return None
    
    def save_news_batch(self, news_items: List) -> Dict[str, int]:
        """뉴스 배치 저장"""
        result = {
            'saved': 0,
            'duplicates': 0,
            'errors': 0
        }
        
        for news_item in news_items:
            try:
                news_id = self.save_news_item(news_item)
                if news_id:
                    result['saved'] += 1
                else:
                    result['duplicates'] += 1
            except Exception as e:
                logger.error(f"Error saving news item: {e}")
                result['errors'] += 1
        
        logger.info(f"Batch save result: {result}")
        return result
    
    def get_pending_news(self, limit: int = 10) -> List[Dict]:
        """승인 대기 중인 뉴스 조회"""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute("""
                        SELECT id, title, content, url, source, publish_date, category, created_at
                        FROM news 
                        WHERE status = 'PENDING'
                        ORDER BY created_at DESC
                        LIMIT %s
                    """, (limit,))
                    
                    return [dict(row) for row in cursor.fetchall()]
                    
        except Exception as e:
            logger.error(f"Error getting pending news: {e}")
            return []
    
    def update_news_status(self, news_id: int, status: str, admin_id: Optional[int] = None) -> bool:
        """뉴스 상태 업데이트"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE news 
                        SET status = %s, updated_at = %s
                        WHERE id = %s
                    """, (status, datetime.now(), news_id))
                    
                    conn.commit()
                    logger.info(f"Updated news {news_id} status to {status}")
                    return True
                    
        except Exception as e:
            logger.error(f"Error updating news status: {e}")
            return False
    
    def get_news_stats(self) -> Dict[str, int]:
        """뉴스 통계 조회"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT 
                            status,
                            COUNT(*) as count
                        FROM news
                        GROUP BY status
                    """)
                    
                    stats = {}
                    for row in cursor.fetchall():
                        stats[row[0]] = row[1]
                    
                    return stats
                    
        except Exception as e:
            logger.error(f"Error getting news stats: {e}")
            return {}
    
    def get_news_by_id(self, news_id: int) -> Optional[Dict]:
        """뉴스 ID로 뉴스 조회"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT id, title, content, url, source, publish_date, 
                               category, status, created_at, updated_at
                        FROM news 
                        WHERE id = %s
                    """, (news_id,))
                    
                    result = cursor.fetchone()
                    if result:
                        columns = ['id', 'title', 'content', 'url', 'source', 'publish_date', 
                                 'category', 'status', 'created_at', 'updated_at']
                        return dict(zip(columns, result))
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting news by id {news_id}: {e}")
            return None
    
    def test_connection(self) -> bool:
        """데이터베이스 연결 테스트"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    result = cursor.fetchone()
                    logger.info("Database connection test successful")
                    return result[0] == 1
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            return False
    
    def get_daum_news_with_unknown_source(self, limit: int = 100) -> List[Dict]:
        """source가 '알수없음'인 다음 뉴스들을 조회"""
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    query = """
                        SELECT id, title, url, source, category, publish_date
                        FROM news 
                        WHERE url LIKE '%v.daum.net%' 
                        AND source = '알수없음'
                        ORDER BY id DESC
                        LIMIT %s
                    """
                    cursor.execute(query, (limit,))
                    results = cursor.fetchall()
                    logger.info(f"다음 뉴스 (알수없음) 조회: {len(results)}개")
                    return [dict(row) for row in results]
        except Exception as e:
            logger.error(f"다음 뉴스 조회 실패: {e}")
            return []
    
    def update_news_source(self, news_id: int, new_source: str) -> bool:
        """뉴스의 source 필드를 업데이트"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    query = """
                        UPDATE news 
                        SET source = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """
                    cursor.execute(query, (new_source, news_id))
                    conn.commit()
                    
                    if cursor.rowcount > 0:
                        logger.info(f"뉴스 source 업데이트 성공: ID {news_id} -> {new_source}")
                        return True
                    else:
                        logger.warning(f"업데이트할 뉴스를 찾을 수 없음: ID {news_id}")
                        return False
        except Exception as e:
            logger.error(f"뉴스 source 업데이트 실패 (ID: {news_id}): {e}")
            return False

    def save_bills_batch(self, bills: List) -> Dict[str, int]:
        """법안 배치 저장"""
        result = {
            'saved': 0,
            'duplicates': 0,
            'errors': 0
        }
        
        for bill in bills:
            try:
                with self.get_connection() as conn:
                    with conn.cursor() as cursor:
                        # 중복 체크 (법안 번호 기준)
                        cursor.execute("SELECT id FROM bills WHERE bill_number = %s", (bill.bill_number,))
                        existing = cursor.fetchone()
                        
                        if existing:
                            logger.info(f"🔄 중복 법안 스킵: {bill.title[:50]}... (기존 ID: {existing[0]})")
                            result['duplicates'] += 1
                            continue
                        
                        # 새 법안 저장
                        insert_query = """
                            INSERT INTO bills (bill_number, title, summary, proposer_name, party_name, proposal_date, status, category, committee, stage, source_url, full_text, approval_status, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            RETURNING id
                        """
                        
                        cursor.execute(insert_query, (
                            bill.bill_number,
                            bill.title,
                            bill.summary,
                            bill.proposer_name,
                            bill.party_name,
                            bill.proposal_date,
                            bill.status,
                            bill.category,
                            bill.committee,
                            bill.stage,
                            bill.source_url,
                            bill.full_text,
                            'PENDING',  # 기본 상태
                            datetime.now(),
                            datetime.now()
                        ))
                        
                        bill_id = cursor.fetchone()[0]
                        conn.commit()
                        
                        logger.info(f"✅ DB 저장 성공 (ID: {bill_id}): {bill.title[:50]}...")
                        result['saved'] += 1

            except Exception as e:
                logger.error(f"Error saving bill item: {e}")
                result['errors'] += 1
        
        logger.info(f"Batch save result: {result}")
        return result