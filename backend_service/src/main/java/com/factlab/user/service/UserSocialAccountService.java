package com.factlab.user.service;

import com.factlab.user.dto.SocialAccountDto;
import com.factlab.user.entity.User;
import com.factlab.user.entity.UserSocialAccount;
import com.factlab.user.repository.UserRepository;
import com.factlab.user.repository.UserSocialAccountRepository;
import com.factlab.common.exception.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class UserSocialAccountService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserSocialAccountService.class);
    
    private final UserRepository userRepository;
    private final UserSocialAccountRepository socialAccountRepository;
    
    public UserSocialAccountService(UserRepository userRepository, 
                                  UserSocialAccountRepository socialAccountRepository) {
        this.userRepository = userRepository;
        this.socialAccountRepository = socialAccountRepository;
    }
    
    /**
     * 사용자의 연결된 소셜 계정 목록 조회
     */
    public List<SocialAccountDto> getUserSocialAccounts(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        List<UserSocialAccount> socialAccounts = socialAccountRepository.findByUserAndIsActiveTrue(user);
        
        return socialAccounts.stream()
                .map(SocialAccountDto::new)
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 소셜 프로바이더 계정 조회
     */
    public SocialAccountDto getUserSocialAccount(Long userId, String provider) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        UserSocialAccount.SocialProvider socialProvider;
        try {
            socialProvider = UserSocialAccount.SocialProvider.valueOf(provider.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("지원하지 않는 소셜 프로바이더입니다: " + provider);
        }
        
        return socialAccountRepository.findByUserAndProviderAndIsActiveTrue(user, socialProvider)
                .map(SocialAccountDto::new)
                .orElse(null);
    }
    
    /**
     * 소셜 계정 연결 해제
     */
    @Transactional
    public void disconnectSocialAccount(Long userId, String provider) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        UserSocialAccount.SocialProvider socialProvider;
        try {
            socialProvider = UserSocialAccount.SocialProvider.valueOf(provider.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("지원하지 않는 소셜 프로바이더입니다: " + provider);
        }
        
        // 소셜 로그인으로만 가입한 사용자는 계정 해제 불가
        if (user.getRegistrationMethod() != User.RegistrationMethod.EMAIL && user.getPassword() == null) {
            long activeAccountCount = socialAccountRepository.findByUserAndIsActiveTrue(user).size();
            if (activeAccountCount <= 1) {
                throw new IllegalStateException("소셜 계정으로만 가입한 사용자는 마지막 계정을 해제할 수 없습니다.");
            }
        }
        
        UserSocialAccount socialAccount = socialAccountRepository
                .findByUserAndProviderAndIsActiveTrue(user, socialProvider)
                .orElseThrow(() -> new EntityNotFoundException("연결된 소셜 계정을 찾을 수 없습니다."));
        
        socialAccount.setIsActive(false);
        socialAccountRepository.save(socialAccount);
        
        logger.info("사용자 {}의 {} 계정이 해제되었습니다.", userId, provider);
    }
    
    /**
     * 프로필 이미지 동기화
     */
    @Transactional
    public void syncProfileImage(Long userId, String provider) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        UserSocialAccount.SocialProvider socialProvider;
        try {
            socialProvider = UserSocialAccount.SocialProvider.valueOf(provider.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("지원하지 않는 소셜 프로바이더입니다: " + provider);
        }
        
        UserSocialAccount socialAccount = socialAccountRepository
                .findByUserAndProviderAndIsActiveTrue(user, socialProvider)
                .orElseThrow(() -> new EntityNotFoundException("연결된 소셜 계정을 찾을 수 없습니다."));
        
        if (socialAccount.getProviderProfileImage() != null) {
            user.setProfileImageUrl(socialAccount.getProviderProfileImage());
            userRepository.save(user);
            
            logger.info("사용자 {}의 프로필 이미지가 {}에서 동기화되었습니다.", userId, provider);
        }
    }
    
    /**
     * 소셜 계정 연결 상태 확인
     */
    public boolean hasActiveSocialAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        return socialAccountRepository.existsByUserAndIsActiveTrue(user);
    }
}