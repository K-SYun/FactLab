package com.factlab.auth.service;

import com.factlab.auth.entity.EmailVerification;
import com.factlab.auth.repository.EmailVerificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class EmailVerificationService {

    private static final Logger logger = LoggerFactory.getLogger(EmailVerificationService.class);

    @Autowired
    private EmailVerificationRepository emailVerificationRepository;

    @Autowired
    private EmailService emailService;

    private static final int CODE_EXPIRY_MINUTES = 30;
    private static final SecureRandom random = new SecureRandom();
    
    /**
     * 6자리 숫자 인증 코드 생성
     */
    private String generateVerificationCode() {
        return String.format("%06d", random.nextInt(1000000));
    }
    
    /**
     * 이메일 인증 코드 발송
     */
    @Transactional
    public boolean sendVerificationCode(String email) {
        try {
            logger.info("이메일 인증 코드 발송 시작: {}", email);

            // 기존 인증 코드 삭제
            emailVerificationRepository.deleteByEmail(email);
            logger.debug("기존 인증 코드 삭제 완료: {}", email);

            // 새로운 인증 코드 생성
            String code = generateVerificationCode();
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES);
            logger.debug("새 인증 코드 생성 완료: email={}, expiresAt={}", email, expiresAt);

            // 인증 코드 저장
            EmailVerification verification = new EmailVerification(email, code, expiresAt);
            emailVerificationRepository.save(verification);
            logger.debug("인증 코드 DB 저장 완료: {}", email);

            // 이메일 발송
            boolean emailSent = emailService.sendVerificationCode(email, code);
            logger.info("이메일 발송 결과: email={}, sent={}", email, emailSent);

            if (!emailSent) {
                // 이메일 발송 실패 시 인증 코드 삭제
                emailVerificationRepository.deleteByEmail(email);
                logger.warn("이메일 발송 실패로 인증 코드 삭제: {}", email);
                return false;
            }

            logger.info("이메일 인증 코드 발송 완료: {}", email);
            return true;

        } catch (Exception e) {
            logger.error("이메일 발송 중 오류 발생: email={}, error={}", email, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * 인증 코드 검증
     */
    @Transactional
    public boolean verifyCode(String email, String code) {
        try {
            logger.debug("이메일 인증 시도: email={}", email);

            Optional<EmailVerification> verification =
                emailVerificationRepository.findByEmailAndVerificationCode(email, code);

            if (verification.isEmpty()) {
                logger.warn("인증 코드를 찾을 수 없음: email={}", email);
                return false;
            }

            EmailVerification emailVerification = verification.get();
            logger.debug("인증 코드 찾음: email={}, expiresAt={}", email, emailVerification.getExpiresAt());

            if (emailVerification.isExpired()) {
                logger.warn("인증 코드 만료됨: email={}", email);
                return false;
            }

            if (emailVerification.getIsVerified()) {
                logger.warn("이미 사용된 인증 코드: email={}", email);
                return false;
            }

            // 인증 완료 처리
            emailVerificationRepository.markAsVerified(email, code);
            logger.info("이메일 인증 성공: {}", email);

            return true;

        } catch (Exception e) {
            logger.error("이메일 인증 중 오류 발생: email={}, error={}", email, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * 이메일 인증 상태 확인
     */
    public boolean isEmailVerified(String email) {
        Optional<EmailVerification> verification = 
            emailVerificationRepository.findFirstByEmailOrderByCreatedAtDesc(email);
        
        return verification.isPresent() && 
               verification.get().getIsVerified() && 
               !verification.get().isExpired();
    }
    
    /**
     * 만료된 인증 코드 정리 (스케줄러에서 호출)
     */
    @Transactional
    public int cleanupExpiredVerifications() {
        return emailVerificationRepository.deleteExpiredVerifications(LocalDateTime.now());
    }

    /**
     * 이메일 인증 코드 발송 (개발용)
     */
    @Transactional
    public boolean sendVerificationCodeForDev(String email) {
        try {
            logger.info("이메일 인증 코드 발송 시작 (개발용): {}", email);

            // 기존 인증 코드 삭제
            emailVerificationRepository.deleteByEmail(email);
            logger.debug("기존 인증 코드 삭제 완료: {}", email);

            // 새로운 인증 코드 생성
            String code = "123456"; // Fixed code for dev
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES);
            logger.debug("새 인증 코드 생성 완료 (개발용): email={}, code={}, expiresAt={}", email, code, expiresAt);

            // 인증 코드 저장
            EmailVerification verification = new EmailVerification(email, code, expiresAt);
            emailVerificationRepository.save(verification);
            logger.debug("인증 코드 DB 저장 완료: {}", email);

            logger.info("이메일 인증 코드 발송 완료 (개발용): {}", email);
            return true;

        } catch (Exception e) {
            logger.error("이메일 발송 중 오류 발생 (개발용): email={}, error={}", email, e.getMessage(), e);
            return false;
        }
    }
}