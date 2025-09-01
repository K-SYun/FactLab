package com.factlab.user.controller;

import com.factlab.user.dto.SocialAccountDto;
import com.factlab.user.service.UserSocialAccountService;
import com.factlab.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/social-accounts")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class UserSocialAccountController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserSocialAccountController.class);
    
    private final UserSocialAccountService socialAccountService;
    
    public UserSocialAccountController(UserSocialAccountService socialAccountService) {
        this.socialAccountService = socialAccountService;
    }
    
    /**
     * 사용자의 연결된 소셜 계정 목록 조회
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<List<SocialAccountDto>>> getUserSocialAccounts(@PathVariable Long userId) {
        try {
            List<SocialAccountDto> socialAccounts = socialAccountService.getUserSocialAccounts(userId);
            return ResponseEntity.ok(ApiResponse.success(socialAccounts));
            
        } catch (Exception e) {
            logger.error("소셜 계정 목록 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("FETCH_FAILED", "소셜 계정 목록을 불러올 수 없습니다."));
        }
    }
    
    /**
     * 특정 소셜 프로바이더 계정 조회
     */
    @GetMapping("/{userId}/{provider}")
    public ResponseEntity<ApiResponse<SocialAccountDto>> getUserSocialAccount(
            @PathVariable Long userId,
            @PathVariable String provider) {
        try {
            SocialAccountDto socialAccount = socialAccountService.getUserSocialAccount(userId, provider);
            
            if (socialAccount == null) {
                return ResponseEntity.ok(ApiResponse.success(null, "연결된 계정이 없습니다."));
            }
            
            return ResponseEntity.ok(ApiResponse.success(socialAccount));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("INVALID_PROVIDER", e.getMessage()));
        } catch (Exception e) {
            logger.error("소셜 계정 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("FETCH_FAILED", "소셜 계정을 불러올 수 없습니다."));
        }
    }
    
    /**
     * 소셜 계정 연결 해제
     */
    @DeleteMapping("/{userId}/{provider}")
    public ResponseEntity<ApiResponse<String>> disconnectSocialAccount(
            @PathVariable Long userId,
            @PathVariable String provider) {
        try {
            socialAccountService.disconnectSocialAccount(userId, provider);
            return ResponseEntity.ok(ApiResponse.success("소셜 계정 연결이 해제되었습니다."));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("INVALID_PROVIDER", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("DISCONNECT_NOT_ALLOWED", e.getMessage()));
        } catch (Exception e) {
            logger.error("소셜 계정 해제 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("DISCONNECT_FAILED", "소셜 계정 해제에 실패했습니다."));
        }
    }
    
    /**
     * 프로필 이미지 동기화
     */
    @PostMapping("/{userId}/{provider}/sync-profile")
    public ResponseEntity<ApiResponse<String>> syncProfileImage(
            @PathVariable Long userId,
            @PathVariable String provider) {
        try {
            socialAccountService.syncProfileImage(userId, provider);
            return ResponseEntity.ok(ApiResponse.success("프로필 이미지가 동기화되었습니다."));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("INVALID_PROVIDER", e.getMessage()));
        } catch (Exception e) {
            logger.error("프로필 이미지 동기화 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("SYNC_FAILED", "프로필 이미지 동기화에 실패했습니다."));
        }
    }
    
    /**
     * 소셜 계정 연결 상태 확인
     */
    @GetMapping("/{userId}/status")
    public ResponseEntity<ApiResponse<Boolean>> checkSocialAccountStatus(@PathVariable Long userId) {
        try {
            boolean hasActiveSocialAccount = socialAccountService.hasActiveSocialAccount(userId);
            return ResponseEntity.ok(ApiResponse.success(hasActiveSocialAccount));
            
        } catch (Exception e) {
            logger.error("소셜 계정 상태 확인 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("STATUS_CHECK_FAILED", "소셜 계정 상태를 확인할 수 없습니다."));
        }
    }
}