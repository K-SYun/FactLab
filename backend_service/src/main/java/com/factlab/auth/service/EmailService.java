package com.factlab.auth.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    /**
     * 이메일 인증 코드 발송
     * TODO: 실제 이메일 발송 구현 (JavaMailSender, SendGrid, AWS SES 등)
     */
    public boolean sendVerificationCode(String email, String code) {
        try {
            // 개발 환경에서는 콘솔에 출력
            logger.info("=== 이메일 인증 코드 발송 ===");
            logger.info("수신자: {}", email);
            logger.info("인증 코드: {}", code);
            logger.info("============================");
            
            // TODO: 실제 이메일 발송 구현
            // 현재는 항상 성공으로 처리
            return true;
            
        } catch (Exception e) {
            logger.error("이메일 발송 실패: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * 이메일 인증 코드 템플릿 생성
     */
    private String createEmailTemplate(String code) {
        return String.format("""
            안녕하세요, FactLab입니다.
            
            회원가입을 위한 이메일 인증 코드입니다.
            
            인증 코드: %s
            
            인증 코드는 5분간 유효합니다.
            본인이 요청하지 않은 경우 이 메일을 무시하시기 바랍니다.
            
            감사합니다.
            FactLab 팀
            """, code);
    }
}