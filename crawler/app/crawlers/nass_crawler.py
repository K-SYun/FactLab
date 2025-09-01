"""
국회 의안정보시스템 크롤러 
National Assembly of South Korea Bill Crawler
"""

import asyncio
import aiohttp
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import xml.etree.ElementTree as ET
import json
from dataclasses import dataclass

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class BillInfo:
    """법안 정보 데이터 클래스"""
    bill_number: str
    title: str
    summary: str
    proposer_name: str
    party_name: str
    proposal_date: str
    status: str
    category: str
    committee: str
    stage: str
    source_url: str
    full_text: Optional[str] = None

class NassApiCrawler:
    """국회 의안정보시스템 API 크롤러"""
    
    def __init__(self):
        self.base_url = "https://open.assembly.go.kr/portal/openapi"
        self.api_key = "YOUR_API_KEY"  # 실제 API 키로 교체 필요
        self.session = None
        
        # 카테고리 매핑 (국회 분류 -> FactLab 분류)
        self.category_mapping = {
            "정무": "정치/행정",
            "외교": "정치/행정", 
            "통일": "정치/행정",
            "법무": "정치/행정",
            "행정안전": "정치/행정",
            "경제": "경제/산업",
            "산업": "경제/산업",
            "기획재정": "경제/산업",
            "공정거래": "경제/산업",
            "금융": "경제/산업",
            "노동": "노동/복지",
            "복지": "노동/복지",
            "보건": "노동/복지",
            "여성": "노동/복지",
            "교육": "교육/문화",
            "문화": "교육/문화",
            "체육": "교육/문화",
            "관광": "교육/문화",
            "환경": "환경/에너지",
            "에너지": "환경/에너지",
            "과학기술": "디지털/AI/데이터",
            "정보통신": "디지털/AI/데이터",
            "방송": "디지털/AI/데이터"
        }
        
        # 상태 매핑
        self.status_mapping = {
            "접수": "접수",
            "심사중": "심사중", 
            "소위심사": "소위심사",
            "법안소위": "법안소위",
            "본회의": "본회의",
            "가결": "통과",
            "부결": "폐기",
            "폐기": "폐기",
            "철회": "철회"
        }

    async def __aenter__(self):
        """비동기 컨텍스트 매니저 진입"""
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """비동기 컨텍스트 매니저 종료"""
        if self.session:
            await self.session.close()

    def _categorize_bill(self, title: str, committee: str) -> str:
        """법안 제목과 소관위원회를 기반으로 카테고리 분류"""
        
        # 위원회명 기반 분류
        for key, category in self.category_mapping.items():
            if key in committee:
                return category
        
        # 제목 키워드 기반 분류
        title_lower = title.lower()
        
        if any(keyword in title_lower for keyword in ['경제', '산업', '기업', '금융', '무역', '투자']):
            return "경제/산업"
        elif any(keyword in title_lower for keyword in ['노동', '복지', '보건', '의료', '연금']):
            return "노동/복지"
        elif any(keyword in title_lower for keyword in ['교육', '학교', '문화', '예술', '체육']):
            return "교육/문화"
        elif any(keyword in title_lower for keyword in ['환경', '에너지', '기후', '원전', '재생']):
            return "환경/에너지"
        elif any(keyword in title_lower for keyword in ['디지털', '인공지능', 'ai', '데이터', '정보통신']):
            return "디지털/AI/데이터"
        else:
            return "정치/행정"  # 기본값

    async def get_bill_list(self, start_date: str, end_date: str, page_size: int = 100) -> List[Dict]:
        """법안 목록 조회"""
        
        url = f"{self.base_url}/nzmimeepazxkubdpn"
        params = {
            'Key': self.api_key,
            'Type': 'xml',
            'pSize': page_size,
            'pIndex': 1,
            'AGE': '21',  # 21대 국회
            'PROPOSER': '',  # 발의자 (전체)
            'COMMITTEE': '',  # 소관위 (전체) 
            'PROC_RESULT': '',  # 처리결과 (전체)
            'BILL_NAME': '',  # 법안명 (전체)
            'PROPOSE_DT': f"{start_date}~{end_date}"  # 발의일자 범위
        }
        
        bills = []
        page = 1
        
        while True:
            params['pIndex'] = page
            
            try:
                async with self.session.get(url, params=params) as response:
                    if response.status != 200:
                        logger.error(f"API 요청 실패: {response.status}")
                        break
                        
                    content = await response.text()
                    root = ET.fromstring(content)
                    
                    # 결과 파싱
                    rows = root.findall('.//row')
                    if not rows:
                        break
                        
                    for row in rows:
                        bill_data = {}
                        for child in row:
                            bill_data[child.tag] = child.text
                            
                        bills.append(bill_data)
                    
                    # 다음 페이지가 없으면 종료
                    if len(rows) < page_size:
                        break
                        
                    page += 1
                    
                    # API 호출 간격 (과부하 방지)
                    await asyncio.sleep(0.5)
                    
            except Exception as e:
                logger.error(f"법안 목록 조회 오류: {e}")
                break
        
        logger.info(f"총 {len(bills)}개 법안 정보 수집 완료")
        return bills

    async def get_bill_detail(self, bill_id: str) -> Optional[Dict]:
        """법안 상세 정보 조회"""
        
        url = f"{self.base_url}/nwvrqwxyaytdsfvf"
        params = {
            'Key': self.api_key,
            'Type': 'xml',
            'BILL_ID': bill_id
        }
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status != 200:
                    logger.error(f"법안 상세 조회 실패: {response.status}")
                    return None
                    
                content = await response.text()
                root = ET.fromstring(content)
                
                row = root.find('.//row')
                if row is None:
                    return None
                
                detail_data = {}
                for child in row:
                    detail_data[child.tag] = child.text
                    
                return detail_data
                
        except Exception as e:
            logger.error(f"법안 상세 조회 오류: {e}")
            return None

    def _parse_bill_info(self, bill_data: Dict, detail_data: Optional[Dict] = None) -> BillInfo:
        """법안 데이터를 BillInfo 객체로 변환"""
        
        # 기본 정보 추출
        bill_number = bill_data.get('BILL_NO', '')
        title = bill_data.get('BILL_NAME', '')
        proposer_name = bill_data.get('PROPOSER', '')
        proposal_date = bill_data.get('PROPOSE_DT', '')
        committee = bill_data.get('COMMITTEE', '')
        proc_result = bill_data.get('PROC_RESULT', '')
        
        # 상세 정보가 있으면 추가
        summary = ''
        full_text = ''
        if detail_data:
            summary = detail_data.get('SUMMARY', '')
            full_text = detail_data.get('BILL_DETAIL', '')
        
        # 정당명 추출 (발의자명에서)
        party_name = self._extract_party_name(proposer_name)
        
        # 카테고리 분류
        category = self._categorize_bill(title, committee)
        
        # 상태 매핑
        status = self.status_mapping.get(proc_result, proc_result)
        
        # 소스 URL 생성
        source_url = f"https://likms.assembly.go.kr/bill/billDetail.do?billId={bill_data.get('BILL_ID', '')}"
        
        return BillInfo(
            bill_number=bill_number,
            title=title,
            summary=summary,
            proposer_name=proposer_name,
            party_name=party_name,
            proposal_date=proposal_date,
            status=status,
            category=category,
            committee=committee,
            stage=proc_result,
            source_url=source_url,
            full_text=full_text
        )

    def _extract_party_name(self, proposer_info: str) -> str:
        """발의자 정보에서 정당명 추출"""
        
        # 일반적인 정당명들
        parties = [
            "국민의힘", "더불어민주당", "정의당", "국민의당", "기본소득당", 
            "시대전환", "진보당", "무소속"
        ]
        
        for party in parties:
            if party in proposer_info:
                return party
                
        return "무소속"  # 기본값

    async def crawl_recent_bills(self, days: int = 30) -> List[BillInfo]:
        """최근 N일간 발의된 법안 크롤링"""
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        start_date_str = start_date.strftime("%Y%m%d")
        end_date_str = end_date.strftime("%Y%m%d")
        
        logger.info(f"법안 크롤링 시작: {start_date_str} ~ {end_date_str}")
        
        # 법안 목록 조회
        bill_list = await self.get_bill_list(start_date_str, end_date_str)
        
        bills_info = []
        
        for i, bill_data in enumerate(bill_list[:50]):  # 최대 50개로 제한
            logger.info(f"법안 상세 정보 수집 중: {i+1}/{len(bill_list[:50])}")
            
            # 상세 정보 조회
            bill_id = bill_data.get('BILL_ID')
            detail_data = None
            if bill_id:
                detail_data = await self.get_bill_detail(bill_id)
            
            # BillInfo 객체 생성
            bill_info = self._parse_bill_info(bill_data, detail_data)
            bills_info.append(bill_info)
            
            # API 호출 간격
            await asyncio.sleep(1)
        
        logger.info(f"총 {len(bills_info)}개 법안 크롤링 완료")
        return bills_info

    async def save_to_database(self, bills: List[BillInfo]):
        """법안 정보를 데이터베이스에 저장"""
        
        # TODO: 실제 데이터베이스 저장 로직 구현
        # 현재는 JSON 파일로 저장
        
        bills_data = []
        for bill in bills:
            bills_data.append({
                'bill_number': bill.bill_number,
                'title': bill.title,
                'summary': bill.summary,
                'proposer_name': bill.proposer_name,
                'party_name': bill.party_name,
                'proposal_date': bill.proposal_date,
                'status': bill.status,
                'category': bill.category,
                'committee': bill.committee,
                'stage': bill.stage,
                'source_url': bill.source_url,
                'full_text': bill.full_text,
                'created_at': datetime.now().isoformat()
            })
        
        # JSON 파일로 저장 (임시)
        filename = f"bills_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(bills_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"법안 정보를 {filename}에 저장했습니다.")

# 사용 예시
async def main():
    """메인 실행 함수"""
    
    async with NassApiCrawler() as crawler:
        # 최근 30일간 법안 크롤링
        bills = await crawler.crawl_recent_bills(days=30)
        
        # 데이터베이스에 저장
        await crawler.save_to_database(bills)
        
        # 결과 출력
        for bill in bills[:5]:  # 상위 5개만 출력
            print(f"법안번호: {bill.bill_number}")
            print(f"제목: {bill.title}")
            print(f"발의자: {bill.proposer_name} ({bill.party_name})")
            print(f"카테고리: {bill.category}")
            print(f"상태: {bill.status}")
            print("-" * 50)

if __name__ == "__main__":
    asyncio.run(main())