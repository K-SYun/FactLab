package com.factlab.user.repository;

import com.factlab.user.entity.User;
import com.factlab.user.entity.UserSocialAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSocialAccountRepository extends JpaRepository<UserSocialAccount, Long> {
    
    // 특정 소셜 프로바이더와 사용자 ID로 계정 찾기
    Optional<UserSocialAccount> findByProviderAndProviderUserId(
            UserSocialAccount.SocialProvider provider, String providerUserId);
    
    // 특정 사용자의 모든 소셜 계정 조회
    List<UserSocialAccount> findByUserAndIsActiveTrue(User user);
    
    // 특정 사용자의 특정 프로바이더 계정 조회
    Optional<UserSocialAccount> findByUserAndProviderAndIsActiveTrue(
            User user, UserSocialAccount.SocialProvider provider);
    
    // 특정 프로바이더의 활성 계정 수 조회
    @Query("SELECT COUNT(usa) FROM UserSocialAccount usa WHERE usa.provider = :provider AND usa.isActive = true")
    long countByProviderAndIsActiveTrue(@Param("provider") UserSocialAccount.SocialProvider provider);
    
    // 특정 사용자가 소셜 계정이 있는지 확인
    boolean existsByUserAndIsActiveTrue(User user);
    
    // 이메일로 소셜 계정 조회 (연동 시 중복 확인용)
    Optional<UserSocialAccount> findByProviderEmailAndIsActiveTrue(String providerEmail);
}