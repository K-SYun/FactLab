"""
법안 분석 AI 서비스
Bill Analysis AI Service using Gemini API
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import json
import re
from dataclasses import dataclass
from enum import Enum

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AnalysisType(Enum):
    """분석 유형"""
    SUMMARY = "summary"
    IMPACT = "impact"  
    KEYWORDS = "keywords"
    RELIABILITY = "reliability"
    CONTROVERSY = "controversy"
    PASSAGE_PROBABILITY = "passage_probability"

@dataclass
class BillAnalysisResult:
    """법안 분석 결과 데이터 클래스"""
    bill_id: str
    analysis_type: AnalysisType
    result: Dict[str, Any]
    confidence_score: float
    processing_time: float
    created_at: datetime
    ai_model: str = "gemini-pro"

class BillAnalyzer:
    """법안 분석 AI 서비스"""
    
    def __init__(self, api_key: str):
        """초기화"""
        self.api_key = api_key
        genai.configure(api_key=api_key)
        
        # Gemini 모델 설정
        self.model = genai.GenerativeModel(
            'gemini-pro',
            generation_config={
                'temperature': 0.7,
                'top_p': 0.8,
                'top_k': 40,
                'max_output_tokens': 2048,
            },
            safety_settings={
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            }
        )

    def _create_summary_prompt(self, bill_data: Dict) -> str:
        """법안 요약 프롬프트 생성"""
        
        prompt = f"""
다음 법안을 일반 시민이 이해하기 쉽게 3줄 이내로 요약해주세요.

법안 제목: {bill_data.get('title', '')}
발의자: {bill_data.get('proposer_name', '')} ({bill_data.get('party_name', '')})
소관위원회: {bill_data.get('committee', '')}
법안 내용: {bill_data.get('full_text', bill_data.get('summary', ''))}

요약 조건:
1. 핵심 내용만 간단명료하게
2. 전문용어는 쉬운 말로 설명
3. 국민 생활에 미치는 영향 중심으로 작성
4. 중립적 관점 유지

요약:"""

        return prompt

    def _create_impact_prompt(self, bill_data: Dict) -> str:
        """법안 영향 분석 프롬프트 생성"""
        
        prompt = f"""
다음 법안이 국민 생활과 사회에 미칠 영향을 분석해주세요.

법안 제목: {bill_data.get('title', '')}
발의자: {bill_data.get('proposer_name', '')} ({bill_data.get('party_name', '')})
카테고리: {bill_data.get('category', '')}
법안 내용: {bill_data.get('full_text', bill_data.get('summary', ''))}

분석 항목:
1. 긍정적 영향 (3개 이내)
2. 부정적 영향 또는 우려사항 (3개 이내)  
3. 영향을 받는 주요 대상 (시민, 기업, 정부기관 등)
4. 예상 시행시기와 준비기간
5. 전체적인 영향도 점수 (1-100점)

JSON 형식으로 답변해주세요:
{
  "positive_impacts": ["영향1", "영향2", "영향3"],
  "negative_impacts": ["우려1", "우려2", "우려3"],
  "affected_groups": ["대상1", "대상2", "대상3"],
  "implementation_timeline": "예상 시행시기",
  "overall_impact_score": 85
}"""

        return prompt

    def _create_keywords_prompt(self, bill_data: Dict) -> str:
        """키워드 추출 프롬프트 생성"""
        
        prompt = f"""
다음 법안에서 핵심 키워드를 추출해주세요.

법안 제목: {bill_data.get('title', '')}
법안 내용: {bill_data.get('full_text', bill_data.get('summary', ''))}

추출 조건:
1. 법안의 핵심 내용을 나타내는 키워드 5-10개
2. 일반인이 검색할만한 키워드 위주
3. 너무 전문적이거나 추상적인 용어 지양
4. 쉼표로 구분하여 나열

키워드:"""

        return prompt

    def _create_reliability_prompt(self, bill_data: Dict) -> str:
        """신뢰도 분석 프롬프트 생성"""
        
        prompt = f"""
다음 법안의 실현가능성과 신뢰도를 분석해주세요.

법안 제목: {bill_data.get('title', '')}
발의자: {bill_data.get('proposer_name', '')} ({bill_data.get('party_name', '')})
상태: {bill_data.get('status', '')}
법안 내용: {bill_data.get('full_text', bill_data.get('summary', ''))}

분석 기준:
1. 법안의 구체성과 실현가능성
2. 예산 확보 가능성 
3. 사회적 합의 가능성
4. 발의자의 정치적 영향력
5. 비슷한 법안의 과거 통과 사례

신뢰도 점수 (0-100점)와 근거를 제시해주세요:

JSON 형식:
{
  "reliability_score": 75,
  "feasibility": "높음/보통/낮음",
  "budget_feasibility": "높음/보통/낮음", 
  "social_consensus": "높음/보통/낮음",
  "political_influence": "높음/보통/낮음",
  "reasoning": "점수 산정 근거"
}"""

        return prompt

    def _create_controversy_prompt(self, bill_data: Dict) -> str:
        """논란도 분석 프롬프트 생성"""
        
        prompt = f"""
다음 법안의 사회적 논란 가능성을 분석해주세요.

법안 제목: {bill_data.get('title', '')}
카테고리: {bill_data.get('category', '')}
법안 내용: {bill_data.get('full_text', bill_data.get('summary', ''))}

분석 요소:
1. 이해관계자 간 갈등 가능성
2. 이념적 대립 요소
3. 경제적 부담 논란
4. 사회적 가치 충돌
5. 과거 유사 법안의 논란 사례

논란도 점수 (0-100점)와 주요 논점을 제시해주세요:

JSON 형식:
{
  "controversy_score": 60,
  "main_issues": ["논점1", "논점2", "논점3"],
  "stakeholder_conflicts": ["갈등요소1", "갈등요소2"],
  "ideological_aspects": "이념적 쟁점 설명",
  "risk_level": "높음/보통/낮음"
}"""

        return prompt

    def _create_passage_probability_prompt(self, bill_data: Dict) -> str:
        """통과 가능성 분석 프롬프트 생성"""
        
        prompt = f"""
다음 법안의 국회 통과 가능성을 분석해주세요.

법안 제목: {bill_data.get('title', '')}
발의자: {bill_data.get('proposer_name', '')} ({bill_data.get('party_name', '')})
소관위원회: {bill_data.get('committee', '')}
현재 상태: {bill_data.get('status', '')}
법안 내용: {bill_data.get('full_text', bill_data.get('summary', ''))}

분석 요소:
1. 여야 정치적 상황
2. 법안의 사회적 관심도
3. 경제적 영향과 예산 문제
4. 기존 법률과의 충돌 여부
5. 시민사회 및 이익단체 지지도

통과 가능성을 분석해주세요:

JSON 형식:
{
  "passage_probability": "높음/보통/낮음",
  "probability_score": 70,
  "key_factors": ["요인1", "요인2", "요인3"],
  "obstacles": ["장애요인1", "장애요인2"],
  "timeline_prediction": "예상 처리 시기",
  "recommendation": "통과 가능성 향상 방안"
}"""

        return prompt

    async def _call_gemini_api(self, prompt: str) -> Optional[str]:
        """Gemini API 호출"""
        
        try:
            response = await asyncio.to_thread(
                self.model.generate_content, prompt
            )
            
            if response.text:
                return response.text.strip()
            else:
                logger.error("Gemini API 응답이 비어있습니다.")
                return None
                
        except Exception as e:
            logger.error(f"Gemini API 호출 오류: {e}")
            return None

    def _parse_json_response(self, response: str) -> Optional[Dict]:
        """JSON 응답 파싱"""
        
        try:
            # JSON 블록 추출 (```json...``` 형태)
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # 직접 JSON 형태인 경우
                json_str = response
            
            return json.loads(json_str)
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON 파싱 오류: {e}")
            return None

    async def analyze_bill_summary(self, bill_data: Dict) -> Optional[BillAnalysisResult]:
        """법안 요약 분석"""
        
        start_time = datetime.now()
        prompt = self._create_summary_prompt(bill_data)
        
        response = await self._call_gemini_api(prompt)
        if not response:
            return None
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        result = {
            "summary": response,
            "length": len(response),
            "readability": "중급"  # TODO: 실제 가독성 분석 로직 추가
        }
        
        return BillAnalysisResult(
            bill_id=bill_data.get('bill_number', ''),
            analysis_type=AnalysisType.SUMMARY,
            result=result,
            confidence_score=0.9,
            processing_time=processing_time,
            created_at=datetime.now()
        )

    async def analyze_bill_impact(self, bill_data: Dict) -> Optional[BillAnalysisResult]:
        """법안 영향 분석"""
        
        start_time = datetime.now()
        prompt = self._create_impact_prompt(bill_data)
        
        response = await self._call_gemini_api(prompt)
        if not response:
            return None
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # JSON 응답 파싱
        parsed_result = self._parse_json_response(response)
        if not parsed_result:
            # 파싱 실패 시 텍스트 그대로 저장
            parsed_result = {"analysis": response}
        
        return BillAnalysisResult(
            bill_id=bill_data.get('bill_number', ''),
            analysis_type=AnalysisType.IMPACT,
            result=parsed_result,
            confidence_score=0.85,
            processing_time=processing_time,
            created_at=datetime.now()
        )

    async def extract_bill_keywords(self, bill_data: Dict) -> Optional[BillAnalysisResult]:
        """법안 키워드 추출"""
        
        start_time = datetime.now()
        prompt = self._create_keywords_prompt(bill_data)
        
        response = await self._call_gemini_api(prompt)
        if not response:
            return None
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # 키워드 파싱 (쉼표로 분리)
        keywords = [kw.strip() for kw in response.split(',') if kw.strip()]
        
        result = {
            "keywords": keywords,
            "keyword_count": len(keywords),
            "raw_response": response
        }
        
        return BillAnalysisResult(
            bill_id=bill_data.get('bill_number', ''),
            analysis_type=AnalysisType.KEYWORDS,
            result=result,
            confidence_score=0.88,
            processing_time=processing_time,
            created_at=datetime.now()
        )

    async def analyze_comprehensive(self, bill_data: Dict) -> Dict[str, BillAnalysisResult]:
        """종합적 법안 분석"""
        
        logger.info(f"법안 종합 분석 시작: {bill_data.get('title', '')}")
        
        # 모든 분석을 병렬로 실행
        tasks = [
            self.analyze_bill_summary(bill_data),
            self.analyze_bill_impact(bill_data),
            self.extract_bill_keywords(bill_data)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        analysis_results = {}
        for result in results:
            if isinstance(result, BillAnalysisResult):
                analysis_results[result.analysis_type.value] = result
            elif isinstance(result, Exception):
                logger.error(f"분석 중 오류 발생: {result}")
        
        logger.info(f"법안 종합 분석 완료: {len(analysis_results)}개 분석 완료")
        return analysis_results

    async def save_analysis_results(self, results: Dict[str, BillAnalysisResult]):
        """분석 결과 저장"""
        
        # TODO: 실제 데이터베이스 저장 로직 구현
        # 현재는 JSON 파일로 저장
        
        results_data = {}
        for analysis_type, result in results.items():
            results_data[analysis_type] = {
                'bill_id': result.bill_id,
                'analysis_type': result.analysis_type.value,
                'result': result.result,
                'confidence_score': result.confidence_score,
                'processing_time': result.processing_time,
                'created_at': result.created_at.isoformat(),
                'ai_model': result.ai_model
            }
        
        # JSON 파일로 저장 (임시)
        filename = f"bill_analysis_{results_data.get('summary', {}).get('bill_id', 'unknown')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"분석 결과를 {filename}에 저장했습니다.")

# 사용 예시
async def main():
    """메인 실행 함수"""
    
    # API 키 설정 (실제 키로 교체)
    api_key = "YOUR_GEMINI_API_KEY"
    
    analyzer = BillAnalyzer(api_key)
    
    # 테스트 법안 데이터
    test_bill = {
        'bill_number': '2024-001',
        'title': '인공지능 윤리 기본법안',
        'proposer_name': '김의원',
        'party_name': '더불어민주당',
        'category': '디지털/AI/데이터',
        'committee': '과학기술정보방송통신위원회',
        'status': '심사중',
        'summary': 'AI 개발과 이용에 있어 윤리적 기준을 제시하고, AI로 인한 피해를 방지하기 위한 법적 근거를 마련하는 법안',
        'full_text': '인공지능 기술의 급속한 발전으로 인한 사회적 영향을 고려하여, AI 개발 및 활용 시 준수해야 할 윤리 기준과 안전장치를 법적으로 명시...'
    }
    
    # 종합 분석 실행
    results = await analyzer.analyze_comprehensive(test_bill)
    
    # 결과 저장
    await analyzer.save_analysis_results(results)
    
    # 결과 출력
    for analysis_type, result in results.items():
        print(f"\n=== {analysis_type.upper()} 분석 결과 ===")
        print(f"신뢰도: {result.confidence_score:.2f}")
        print(f"처리시간: {result.processing_time:.2f}초")
        print(f"결과: {json.dumps(result.result, ensure_ascii=False, indent=2)}")
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(main())