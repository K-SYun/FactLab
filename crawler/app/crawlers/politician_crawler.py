"""
국회의원 정보 크롤러
National Assembly Member Information Crawler
"""

import asyncio
import aiohttp
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import xml.etree.ElementTree as ET
import json
from dataclasses import dataclass

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PoliticianInfo:
    """정치인 정보 데이터 클래스"""
    name: str
    english_name: Optional[str]
    party_name: str
    position: str
    electoral_district: Optional[str]
    committee: Optional[str]
    profile_image_url: Optional[str]
    birth_date: Optional[str]
    career: Optional[str]
    education: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    office_address: Optional[str]
    homepage: Optional[str]
    term_start_date: Optional[str]
    term_end_date: Optional[str]

@dataclass
class PartyInfo:
    """정당 정보 데이터 클래스"""
    name: str
    short_name: Optional[str]
    english_name: Optional[str]
    representative: Optional[str]
    founding_date: Optional[str]
    official_website: Optional[str]
    logo_url: Optional[str]
    description: Optional[str]
    ideology: Optional[str]

class PoliticianCrawler:
    """국회의원 정보 크롤러"""
    
    def __init__(self):
        self.base_url = "https://open.assembly.go.kr/portal/openapi"
        self.api_key = "YOUR_API_KEY"  # 실제 API 키로 교체 필요
        self.session = None
        
        # 정당 정보 (하드코딩 - 실제로는 DB나 설정파일에서 관리)
        # 정의당 삭제, 조국혁신당, 개혁신당 추가
        self.party_info = {
            "국민의힘": {
                "short_name": "국힘",
                "english_name": "People Power Party",
                "representative": "한동훈",
                "ideology": "보수",
                "official_website": "https://www.peoplepowerparty.kr/"
            },
            "더불어민주당": {
                "short_name": "민주",
                "english_name": "Democratic Party of Korea",
                "representative": "이재명",
                "ideology": "진보",
                "official_website": "https://theminjoo.kr/"
            },
            "조국혁신당": {
                "short_name": "조국당",
                "english_name": "Rebuilding Korea Party",
                "representative": "조국",
                "ideology": "진보",
                "official_website": "https://kookmin.kr/"
            },
            "개혁신당": {
                "short_name": "개혁신당",
                "english_name": "Reform Party",
                "representative": "이준석",
                "ideology": "중도",
                "official_website": "https://www.krparty.kr/"
            }
        }

    async def __aenter__(self):
        """비동기 컨텍스트 매니저 진입"""
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """비동기 컨텍스트 매니저 종료"""
        if self.session:
            await self.session.close()

    async def get_assembly_members(self, age: str = "21") -> List[Dict]:
        """국회의원 목록 조회"""
        
        url = f"{self.base_url}/nwbpacrgavhjryiph"
        params = {
            'Key': self.api_key,
            'Type': 'xml',
            'pSize': 300,  # 전체 의원수
            'pIndex': 1,
            'AGE': age  # 국회 대수 (21대)
        }
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status != 200:
                    logger.error(f"국회의원 목록 조회 실패: {response.status}")
                    return []
                    
                content = await response.text()
                root = ET.fromstring(content)
                
                members = []
                rows = root.findall('.//row')
                
                for row in rows:
                    member_data = {}
                    for child in row:
                        member_data[child.tag] = child.text
                    members.append(member_data)
                
                logger.info(f"총 {len(members)}명의 국회의원 정보 수집")
                return members
                
        except Exception as e:
            logger.error(f"국회의원 목록 조회 오류: {e}")
            return []

    async def get_member_detail(self, member_id: str) -> Optional[Dict]:
        """국회의원 상세 정보 조회"""
        
        url = f"{self.base_url}/nwbqwytyjzwbvzjr"
        params = {
            'Key': self.api_key,
            'Type': 'xml', 
            'MEMBER_ID': member_id
        }
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status != 200:
                    logger.error(f"의원 상세 정보 조회 실패: {response.status}")
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
            logger.error(f"의원 상세 정보 조회 오류: {e}")
            return None

    def _parse_politician_info(self, member_data: Dict, detail_data: Optional[Dict] = None) -> PoliticianInfo:
        """의원 데이터를 PoliticianInfo 객체로 변환"""
        
        name = member_data.get('HG_NM', '')
        eng_name = member_data.get('ENG_NM', '')
        party_name = member_data.get('POLY_NM', '')
        electoral_district = member_data.get('ORIG_NM', '')
        
        # 상세 정보가 있으면 추가
        career = ''
        education = ''
        phone = ''
        email = ''
        office_address = ''
        homepage = ''
        
        if detail_data:
            career = detail_data.get('CAREER', '')
            education = detail_data.get('SCHOOL', '')
            phone = detail_data.get('TEL_NO', '')
            email = detail_data.get('E_MAIL', '')
            office_address = detail_data.get('ASSEM_ADDR', '')
            homepage = detail_data.get('HOMEPAGE', '')
        
        # 프로필 이미지 URL (일반적인 패턴 추정)
        profile_image_url = None
        if member_data.get('MEMBER_ID'):
            profile_image_url = f"https://www.assembly.go.kr/photo/9770/{member_data['MEMBER_ID']}.jpg"
        
        return PoliticianInfo(
            name=name,
            english_name=eng_name if eng_name else None,
            party_name=party_name,
            position="의원",
            electoral_district=electoral_district,
            committee=member_data.get('COMMITTEE', ''),
            profile_image_url=profile_image_url,
            birth_date=None,  # API에서 제공하지 않음
            career=career if career else None,
            education=education if education else None,
            phone=phone if phone else None,
            email=email if email else None,
            office_address=office_address if office_address else None,
            homepage=homepage if homepage else None,
            term_start_date="2020-05-30",  # 21대 국회 시작일
            term_end_date="2024-05-29"     # 21대 국회 종료일
        )

    def _get_party_info(self, party_name: str) -> PartyInfo:
        """정당 정보 가져오기"""
        
        info = self.party_info.get(party_name, {})
        
        return PartyInfo(
            name=party_name,
            short_name=info.get('short_name'),
            english_name=info.get('english_name'),
            representative=info.get('representative'),
            founding_date=None,  # 별도 조회 필요
            official_website=info.get('official_website'),
            logo_url=None,  # 별도 조회 필요
            description=None,
            ideology=info.get('ideology')
        )

    async def crawl_politicians(self) -> tuple[List[PoliticianInfo], List[PartyInfo]]:
        """정치인 및 정당 정보 크롤링"""
        
        logger.info("국회의원 정보 크롤링 시작")
        
        # 국회의원 목록 조회
        members = await self.get_assembly_members()
        
        politicians = []
        parties_dict = {}
        
        for i, member_data in enumerate(members):
            logger.info(f"의원 상세 정보 수집 중: {i+1}/{len(members)}")
            
            # 상세 정보 조회
            member_id = member_data.get('MEMBER_ID')
            detail_data = None
            if member_id:
                detail_data = await self.get_member_detail(member_id)
            
            # PoliticianInfo 객체 생성
            politician = self._parse_politician_info(member_data, detail_data)
            politicians.append(politician)
            
            # 정당 정보 수집 (중복 제거)
            if politician.party_name and politician.party_name not in parties_dict:
                party_info = self._get_party_info(politician.party_name)
                parties_dict[politician.party_name] = party_info
            
            # API 호출 간격
            await asyncio.sleep(0.5)
        
        parties = list(parties_dict.values())
        
        logger.info(f"총 {len(politicians)}명의 정치인, {len(parties)}개의 정당 정보 수집 완료")
        return politicians, parties

    async def save_to_database(self, politicians: List[PoliticianInfo], parties: List[PartyInfo]):
        """정치인 및 정당 정보를 데이터베이스에 저장"""
        
        # TODO: 실제 데이터베이스 저장 로직 구현
        # 현재는 JSON 파일로 저장
        
        # 정당 데이터
        parties_data = []
        for party in parties:
            parties_data.append({
                'name': party.name,
                'short_name': party.short_name,
                'english_name': party.english_name,
                'representative': party.representative,
                'founding_date': party.founding_date,
                'official_website': party.official_website,
                'logo_url': party.logo_url,
                'description': party.description,
                'ideology': party.ideology,
                'is_active': True,
                'created_at': datetime.now().isoformat()
            })
        
        # 정치인 데이터
        politicians_data = []
        for politician in politicians:
            politicians_data.append({
                'name': politician.name,
                'english_name': politician.english_name,
                'party_name': politician.party_name,
                'position': politician.position,
                'electoral_district': politician.electoral_district,
                'committee': politician.committee,
                'profile_image_url': politician.profile_image_url,
                'birth_date': politician.birth_date,
                'career': politician.career,
                'education': politician.education,
                'phone': politician.phone,
                'email': politician.email,
                'office_address': politician.office_address,
                'homepage': politician.homepage,
                'is_active': True,
                'term_start_date': politician.term_start_date,
                'term_end_date': politician.term_end_date,
                'created_at': datetime.now().isoformat()
            })
        
        # JSON 파일로 저장 (임시)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        parties_filename = f"parties_{timestamp}.json"
        with open(parties_filename, 'w', encoding='utf-8') as f:
            json.dump(parties_data, f, ensure_ascii=False, indent=2)
        
        politicians_filename = f"politicians_{timestamp}.json"  
        with open(politicians_filename, 'w', encoding='utf-8') as f:
            json.dump(politicians_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"정당 정보를 {parties_filename}에 저장했습니다.")
        logger.info(f"정치인 정보를 {politicians_filename}에 저장했습니다.")

# 사용 예시
async def main():
    """메인 실행 함수"""
    
    async with PoliticianCrawler() as crawler:
        # 정치인 및 정당 정보 크롤링
        politicians, parties = await crawler.crawl_politicians()
        
        # 데이터베이스에 저장
        await crawler.save_to_database(politicians, parties)
        
        # 결과 출력
        print(f"\n=== 정당 정보 ({len(parties)}개) ===")
        for party in parties[:5]:  # 상위 5개만 출력
            print(f"정당명: {party.name}")
            print(f"영문명: {party.english_name}")
            print(f"대표: {party.representative}")
            print(f"성향: {party.ideology}")
            print("-" * 30)
        
        print(f"\n=== 정치인 정보 ({len(politicians)}명) ===")
        for politician in politicians[:5]:  # 상위 5명만 출력
            print(f"이름: {politician.name}")
            print(f"정당: {politician.party_name}")
            print(f"선거구: {politician.electoral_district}")
            print(f"위원회: {politician.committee}")
            print("-" * 30)

if __name__ == "__main__":
    asyncio.run(main())