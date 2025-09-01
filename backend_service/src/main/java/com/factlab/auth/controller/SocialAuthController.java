package com.factlab.auth.controller;

import com.factlab.auth.dto.SocialLoginRequestDto;
import com.factlab.auth.dto.UserLoginResponseDto;
import com.factlab.auth.service.SocialAuthService;
import com.factlab.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class SocialAuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(SocialAuthController.class);
    
    private final SocialAuthService socialAuthService;
    
    @Value("${oauth.google.client-id:}")
    private String googleClientId;
    
    @Value("${oauth.naver.client-id:}")
    private String naverClientId;
    
    @Value("${oauth.kakao.client-id:}")
    private String kakaoClientId;
    
    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;
    
    public SocialAuthController(SocialAuthService socialAuthService) {
        this.socialAuthService = socialAuthService;
    }
    
    /**
     * 구글 로그인 URL 생성
     */
    @GetMapping("/google/login-url")
    public ResponseEntity<ApiResponse<String>> getGoogleLoginUrl() {
        String redirectUri = "http://localhost:8080/api/auth/google/callback";
        
        String loginUrl = UriComponentsBuilder
                .fromHttpUrl("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", googleClientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", "openid profile email")
                .queryParam("access_type", "offline")
                .toUriString();
        
        return ResponseEntity.ok(ApiResponse.success(loginUrl));
    }
    
    /**
     * 네이버 로그인 URL 생성
     */
    @GetMapping("/naver/login-url")
    public ResponseEntity<ApiResponse<String>> getNaverLoginUrl() {
        String redirectUri = "http://localhost:8080/api/auth/naver/callback";
        String state = String.valueOf(System.currentTimeMillis()); // 간단한 state 생성
        
        String loginUrl = UriComponentsBuilder
                .fromHttpUrl("https://nid.naver.com/oauth2.0/authorize")
                .queryParam("response_type", "code")
                .queryParam("client_id", naverClientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("state", state)
                .toUriString();
        
        return ResponseEntity.ok(ApiResponse.success(loginUrl));
    }
    
    /**
     * 카카오 로그인 URL 생성
     */
    @GetMapping("/kakao/login-url")
    public ResponseEntity<ApiResponse<String>> getKakaoLoginUrl() {
        String redirectUri = "http://localhost:8080/api/auth/kakao/callback";
        
        String loginUrl = UriComponentsBuilder
                .fromHttpUrl("https://kauth.kakao.com/oauth/authorize")
                .queryParam("client_id", kakaoClientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .toUriString();
        
        return ResponseEntity.ok(ApiResponse.success(loginUrl));
    }
    
    /**
     * 구글 OAuth 콜백 처리
     */
    @GetMapping("/google/callback")
    public RedirectView googleCallback(@RequestParam String code, 
                                     @RequestParam(required = false) String error) {
        if (error != null) {
            logger.error("구글 OAuth 오류: {}", error);
            return new RedirectView(frontendUrl + "/login?error=social_login_failed");
        }
        
        try {
            UserLoginResponseDto response = socialAuthService.processSocialLogin("GOOGLE", code, null);
            
            // 성공 시 프론트엔드로 토큰과 함께 리다이렉트
            String redirectUrl = UriComponentsBuilder
                    .fromHttpUrl(frontendUrl + "/login/callback")
                    .queryParam("token", response.getToken())
                    .queryParam("user_id", response.getId())
                    .queryParam("nickname", response.getNickname())
                    .toUriString();
            
            return new RedirectView(redirectUrl);
            
        } catch (Exception e) {
            logger.error("구글 로그인 처리 중 오류 발생", e);
            return new RedirectView(frontendUrl + "/login?error=social_login_failed");
        }
    }
    
    /**
     * 네이버 OAuth 콜백 처리
     */
    @GetMapping("/naver/callback")
    public RedirectView naverCallback(@RequestParam String code, 
                                    @RequestParam String state,
                                    @RequestParam(required = false) String error) {
        if (error != null) {
            logger.error("네이버 OAuth 오류: {}", error);
            return new RedirectView(frontendUrl + "/login?error=social_login_failed");
        }
        
        try {
            UserLoginResponseDto response = socialAuthService.processSocialLogin("NAVER", code, state);
            
            // 성공 시 프론트엔드로 토큰과 함께 리다이렉트
            String redirectUrl = UriComponentsBuilder
                    .fromHttpUrl(frontendUrl + "/login/callback")
                    .queryParam("token", response.getToken())
                    .queryParam("user_id", response.getId())
                    .queryParam("nickname", response.getNickname())
                    .toUriString();
            
            return new RedirectView(redirectUrl);
            
        } catch (Exception e) {
            logger.error("네이버 로그인 처리 중 오류 발생", e);
            return new RedirectView(frontendUrl + "/login?error=social_login_failed");
        }
    }
    
    /**
     * 카카오 OAuth 콜백 처리
     */
    @GetMapping("/kakao/callback")
    public RedirectView kakaoCallback(@RequestParam String code,
                                    @RequestParam(required = false) String error) {
        if (error != null) {
            logger.error("카카오 OAuth 오류: {}", error);
            return new RedirectView(frontendUrl + "/login?error=social_login_failed");
        }
        
        try {
            UserLoginResponseDto response = socialAuthService.processSocialLogin("KAKAO", code, null);
            
            // 성공 시 프론트엔드로 토큰과 함께 리다이렉트
            String redirectUrl = UriComponentsBuilder
                    .fromHttpUrl(frontendUrl + "/login/callback")
                    .queryParam("token", response.getToken())
                    .queryParam("user_id", response.getId())
                    .queryParam("nickname", response.getNickname())
                    .toUriString();
            
            return new RedirectView(redirectUrl);
            
        } catch (Exception e) {
            logger.error("카카오 로그인 처리 중 오류 발생", e);
            return new RedirectView(frontendUrl + "/login?error=social_login_failed");
        }
    }
    
    /**
     * 소셜 로그인 (프론트엔드에서 직접 코드 전송 시 사용)
     */
    @PostMapping("/social/login")
    public ResponseEntity<ApiResponse<UserLoginResponseDto>> socialLogin(@Valid @RequestBody SocialLoginRequestDto request) {
        try {
            UserLoginResponseDto response = socialAuthService.processSocialLogin(
                    request.getProvider(), 
                    request.getCode(), 
                    request.getState()
            );
            
            return ResponseEntity.ok(ApiResponse.success(response));
            
        } catch (Exception e) {
            logger.error("소셜 로그인 처리 중 오류 발생", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("SOCIAL_LOGIN_FAILED", "소셜 로그인 처리에 실패했습니다."));
        }
    }
}