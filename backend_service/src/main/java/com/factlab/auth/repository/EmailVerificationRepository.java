package com.factlab.auth.repository;

import com.factlab.auth.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {
    
    // 이메일로 가장 최근 인증 코드 조회
    Optional<EmailVerification> findFirstByEmailOrderByCreatedAtDesc(String email);
    
    // 이메일과 인증 코드로 조회
    Optional<EmailVerification> findByEmailAndVerificationCode(String email, String verificationCode);
    
    // 만료된 인증 코드 삭제
    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerification e WHERE e.expiresAt < :now")
    int deleteExpiredVerifications(@Param("now") LocalDateTime now);
    
    // 특정 이메일의 모든 인증 코드 삭제 (새로운 인증 코드 생성 시)
    @Modifying
    @Transactional
    void deleteByEmail(String email);
    
    // 인증 완료 처리
    @Modifying
    @Transactional
    @Query("UPDATE EmailVerification e SET e.isVerified = true WHERE e.email = :email AND e.verificationCode = :code")
    int markAsVerified(@Param("email") String email, @Param("code") String code);
}