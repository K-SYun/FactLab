"""
AI 프롬프트 로더
YAML 파일에서 프롬프트를 로드하고 관리하는 모듈
"""

import yaml
import os
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class PromptLoader:
    def __init__(self, config_path: str = None):
        if config_path is None:
            # prompts.yml 사용
            config_path = os.path.join(os.path.dirname(__file__), "prompts.yml")
        
        self.config_path = config_path
        self.prompts = {}
        self.load_prompts()
    
    def load_prompts(self):
        """YAML 파일에서 프롬프트 설정 로드"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as file:
                config = yaml.safe_load(file)
                self.prompts = config.get('prompts', {})
                logger.info(f"프롬프트 설정 로드 완료: {len(self.prompts)}개 타입")
        except FileNotFoundError:
            logger.error(f"프롬프트 설정 파일을 찾을 수 없습니다: {self.config_path}")
            raise
        except yaml.YAMLError as e:
            logger.error(f"YAML 파싱 오류: {e}")
            raise
        except Exception as e:
            logger.error(f"프롬프트 로드 중 오류: {e}")
            raise
    
    def get_system_prompt(self, analysis_type: str) -> str:
        """분석 타입에 따른 시스템 프롬프트 반환"""
        prompt_config = self.prompts.get(analysis_type)
        if not prompt_config:
            raise ValueError(f"지원하지 않는 분석 타입: {analysis_type}")
        
        return prompt_config.get('system', '')
    
    def get_user_prompt(self, analysis_type: str) -> str:
        """분석 타입에 따른 사용자 프롬프트 반환"""
        prompt_config = self.prompts.get(analysis_type)
        if not prompt_config:
            raise ValueError(f"지원하지 않는 분석 타입: {analysis_type}")
        
        return prompt_config.get('user', '')
    
    def build_prompt(self, analysis_type: str, title: str, content: str, source: str = None) -> str:
        """완성된 프롬프트 생성"""
        system_prompt = self.get_system_prompt(analysis_type)
        user_template = self.get_user_prompt(analysis_type)
        
        # 템플릿 변수 치환
        try:
            user_prompt = user_template.format(
                title=title or "제목 없음",
                content=content[:2000] if content else "내용 없음",
                source=source or "출처 불명"
            )
        except KeyError:
            # source 변수가 없는 기존 프롬프트와의 호환성
            user_prompt = user_template.format(
                title=title or "제목 없음",
                content=content[:2000] if content else "내용 없음"
            )
        
        # 시스템 프롬프트와 사용자 프롬프트 결합
        return f"{system_prompt}\n\n{user_prompt}"
    
    def get_available_types(self) -> list:
        """사용 가능한 분석 타입 목록 반환"""
        return list(self.prompts.keys())
    
    def reload_prompts(self):
        """프롬프트 설정 다시 로드"""
        self.load_prompts()
        logger.info("프롬프트 설정 다시 로드 완료")

# 전역 프롬프트 로더 인스턴스
_prompt_loader = None

def get_prompt_loader() -> PromptLoader:
    """전역 프롬프트 로더 인스턴스 반환"""
    global _prompt_loader
    if _prompt_loader is None:
        _prompt_loader = PromptLoader()
    return _prompt_loader