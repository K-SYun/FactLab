package com.factlab.auth.service;

import com.factlab.auth.entity.EmailVerification;
import com.factlab.auth.repository.EmailVerificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class EmailVerificationService {
    
    @Autowired
    private EmailVerificationRepository emailVerificationRepository;
    
    @Autowired
    private EmailService emailService;
    
    private static final int CODE_EXPIRY_MINUTES = 30; // 30분 만료 (테스트용)
    private static final SecureRandom random = new SecureRandom();
    
    /**
     * 6자리 숫자 인증 코드 생성
     * 테스트를 위해 임시로 123456 하드코딩
     */
    private String generateVerificationCode() {
        // TODO: 실제 운영 시에는 아래 랜덤 코드 생성으로 변경
        // return String.format("%06d", random.nextInt(1000000));
        return "123456"; // 테스트용 하드코딩
    }
    
    /**
     * 이메일 인증 코드 발송
     */
    @Transactional
    public boolean sendVerificationCode(String email) {
        try {
            System.out.println("이메일 인증 코드 발송 시작: " + email); // 디버깅 로그
            
            // 기존 인증 코드 삭제
            emailVerificationRepository.deleteByEmail(email);
            System.out.println("기존 인증 코드 삭제 완료"); // 디버깅 로그
            
            // 새로운 인증 코드 생성
            String code = generateVerificationCode();
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES);
            System.out.println("새 인증 코드 생성: " + code + ", 만료시간: " + expiresAt); // 디버깅 로그
            
            // 인증 코드 저장
            EmailVerification verification = new EmailVerification(email, code, expiresAt);
            emailVerificationRepository.save(verification);
            System.out.println("인증 코드 DB 저장 완료"); // 디버깅 로그
            
            // 이메일 발송 (테스트용으로 true로 고정)
            boolean emailSent = true; // emailService.sendVerificationCode(email, code);
            System.out.println("이메일 발송 결과: " + emailSent); // 디버깅 로그
            
            if (!emailSent) {
                // 이메일 발송 실패 시 인증 코드 삭제
                emailVerificationRepository.deleteByEmail(email);
                System.out.println("이메일 발송 실패로 인증 코드 삭제"); // 디버깅 로그
                return false;
            }
            
            System.out.println("이메일 인증 코드 발송 완료: " + email); // 디버깅 로그
            return true;
            
        } catch (Exception e) {
            System.out.println("이메일 발송 중 예외 발생: " + e.getMessage()); // 디버깅 로그
            e.printStackTrace();
            return false;
        }
    }
    
    /**
     * 인증 코드 검증
     */
    @Transactional
    public boolean verifyCode(String email, String code) {
        try {
            System.out.println("이메일 인증 시도: email=" + email + ", code=" + code); // 디버깅 로그
            
            Optional<EmailVerification> verification = 
                emailVerificationRepository.findByEmailAndVerificationCode(email, code);
            
            if (verification.isEmpty()) {
                System.out.println("인증 코드를 찾을 수 없음"); // 디버깅 로그
                return false; // 인증 코드 없음
            }
            
            EmailVerification emailVerification = verification.get();
            System.out.println("인증 코드 찾음: " + emailVerification.getVerificationCode() + 
                             ", 만료시간: " + emailVerification.getExpiresAt() + 
                             ", 현재시간: " + java.time.LocalDateTime.now()); // 디버깅 로그
            
            if (emailVerification.isExpired()) {
                System.out.println("인증 코드 만료됨"); // 디버깅 로그
                return false; // 만료됨
            }
            
            if (emailVerification.getIsVerified()) {
                System.out.println("이미 사용된 인증 코드"); // 디버깅 로그
                return false; // 이미 사용됨
            }
            
            // 인증 완료 처리
            emailVerificationRepository.markAsVerified(email, code);
            System.out.println("이메일 인증 성공"); // 디버깅 로그
            
            return true;
            
        } catch (Exception e) {
            System.out.println("이메일 인증 중 예외 발생: " + e.getMessage()); // 디버깅 로그
            e.printStackTrace();
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
}