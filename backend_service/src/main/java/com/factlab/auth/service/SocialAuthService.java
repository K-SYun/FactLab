package com.factlab.auth.service;

import com.factlab.auth.dto.SocialUserInfoDto;
import com.factlab.auth.dto.UserLoginResponseDto;
import com.factlab.admin.service.JwtTokenService;
import com.factlab.user.entity.User;
import com.factlab.user.entity.UserSocialAccount;
import com.factlab.user.repository.UserRepository;
import com.factlab.user.repository.UserSocialAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class SocialAuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(SocialAuthService.class);
    
    private final UserRepository userRepository;
    private final UserSocialAccountRepository socialAccountRepository;
    private final JwtTokenService jwtTokenService;
    private final RestTemplate restTemplate;
    
    @Value("${oauth.google.client-id:}")
    private String googleClientId;
    
    @Value("${oauth.google.client-secret:}")
    private String googleClientSecret;
    
    @Value("${oauth.google.redirect-uri:http://localhost:8080/api/auth/google/callback}")
    private String googleRedirectUri;
    
    @Value("${oauth.naver.client-id:}")
    private String naverClientId;
    
    @Value("${oauth.naver.client-secret:}")
    private String naverClientSecret;
    
    @Value("${oauth.naver.redirect-uri:http://localhost:8080/api/auth/naver/callback}")
    private String naverRedirectUri;
    
    @Value("${oauth.kakao.client-id:}")
    private String kakaoClientId;
    
    @Value("${oauth.kakao.redirect-uri:http://localhost:8080/api/auth/kakao/callback}")
    private String kakaoRedirectUri;
    
    public SocialAuthService(UserRepository userRepository, 
                           UserSocialAccountRepository socialAccountRepository,
                           JwtTokenService jwtTokenService,
                           RestTemplate restTemplate) {
        this.userRepository = userRepository;
        this.socialAccountRepository = socialAccountRepository;
        this.jwtTokenService = jwtTokenService;
        this.restTemplate = restTemplate;
    }
    
    public UserLoginResponseDto processSocialLogin(String provider, String code, String state) {
        try {
            // 1. Authorization Code로 Access Token 획득
            String accessToken = getAccessToken(provider, code, state);
            
            // 2. Access Token으로 사용자 정보 획득
            SocialUserInfoDto socialUserInfo = getUserInfo(provider, accessToken);
            
            // 3. 기존 사용자 확인 또는 새 사용자 생성
            User user = findOrCreateUser(socialUserInfo);
            
            // 4. 소셜 계정 정보 저장/업데이트
            saveSocialAccount(user, socialUserInfo, accessToken);
            
            // 5. JWT 토큰 생성 및 반환
            String token = jwtTokenService.generateToken(user.getNickname(), user.getId());
            
            // 6. 마지막 로그인 시간 업데이트  
            LocalDateTime loginTime = LocalDateTime.now();
            user.setLastLoginAt(loginTime);
            userRepository.save(user);
            
            return new UserLoginResponseDto(user.getId(), user.getEmail(), user.getNickname(), token, loginTime);
            
        } catch (Exception e) {
            logger.error("소셜 로그인 처리 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("소셜 로그인 처리에 실패했습니다.");
        }
    }
    
    private String getAccessToken(String provider, String code, String state) {
        switch (provider.toUpperCase()) {
            case "GOOGLE":
                return getGoogleAccessToken(code);
            case "NAVER":
                return getNaverAccessToken(code, state);
            case "KAKAO":
                return getKakaoAccessToken(code);
            default:
                throw new IllegalArgumentException("지원하지 않는 소셜 프로바이더입니다: " + provider);
        }
    }
    
    private String getGoogleAccessToken(String code) {
        String tokenUrl = "https://oauth2.googleapis.com/token";
        
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", googleClientId);
        params.add("client_secret", googleClientSecret);
        params.add("code", code);
        params.add("grant_type", "authorization_code");
        params.add("redirect_uri", googleRedirectUri);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
        
        Map<String, Object> responseBody = response.getBody();
        return (String) responseBody.get("access_token");
    }
    
    private String getNaverAccessToken(String code, String state) {
        String tokenUrl = "https://nid.naver.com/oauth2.0/token";
        
        String url = UriComponentsBuilder.fromHttpUrl(tokenUrl)
                .queryParam("grant_type", "authorization_code")
                .queryParam("client_id", naverClientId)
                .queryParam("client_secret", naverClientSecret)
                .queryParam("code", code)
                .queryParam("state", state)
                .toUriString();
        
        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        Map<String, Object> responseBody = response.getBody();
        return (String) responseBody.get("access_token");
    }
    
    private String getKakaoAccessToken(String code) {
        String tokenUrl = "https://kauth.kakao.com/oauth/token";
        
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", kakaoClientId);
        params.add("redirect_uri", kakaoRedirectUri);
        params.add("code", code);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
        
        Map<String, Object> responseBody = response.getBody();
        return (String) responseBody.get("access_token");
    }
    
    private SocialUserInfoDto getUserInfo(String provider, String accessToken) {
        switch (provider.toUpperCase()) {
            case "GOOGLE":
                return getGoogleUserInfo(accessToken);
            case "NAVER":
                return getNaverUserInfo(accessToken);
            case "KAKAO":
                return getKakaoUserInfo(accessToken);
            default:
                throw new IllegalArgumentException("지원하지 않는 소셜 프로바이더입니다: " + provider);
        }
    }
    
    private SocialUserInfoDto getGoogleUserInfo(String accessToken) {
        String userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        
        HttpEntity<String> request = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(userInfoUrl, HttpMethod.GET, request, Map.class);
        
        Map<String, Object> userInfo = response.getBody();
        
        SocialUserInfoDto dto = new SocialUserInfoDto();
        dto.setId((String) userInfo.get("id"));
        dto.setEmail((String) userInfo.get("email"));
        dto.setName((String) userInfo.get("name"));
        dto.setProfileImageUrl((String) userInfo.get("picture"));
        dto.setProvider("GOOGLE");
        
        return dto;
    }
    
    private SocialUserInfoDto getNaverUserInfo(String accessToken) {
        String userInfoUrl = "https://openapi.naver.com/v1/nid/me";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        
        HttpEntity<String> request = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(userInfoUrl, HttpMethod.GET, request, Map.class);
        
        Map<String, Object> responseBody = response.getBody();
        Map<String, Object> userInfo = (Map<String, Object>) responseBody.get("response");
        
        SocialUserInfoDto dto = new SocialUserInfoDto();
        dto.setId((String) userInfo.get("id"));
        dto.setEmail((String) userInfo.get("email"));
        dto.setName((String) userInfo.get("name"));
        dto.setNickname((String) userInfo.get("nickname"));
        dto.setProfileImageUrl((String) userInfo.get("profile_image"));
        dto.setProvider("NAVER");
        
        return dto;
    }
    
    private SocialUserInfoDto getKakaoUserInfo(String accessToken) {
        String userInfoUrl = "https://kapi.kakao.com/v2/user/me";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        
        HttpEntity<String> request = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(userInfoUrl, HttpMethod.GET, request, Map.class);
        
        Map<String, Object> userInfo = response.getBody();
        Map<String, Object> kakaoAccount = (Map<String, Object>) userInfo.get("kakao_account");
        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
        
        SocialUserInfoDto dto = new SocialUserInfoDto();
        dto.setId(userInfo.get("id").toString());
        dto.setEmail((String) kakaoAccount.get("email"));
        dto.setName((String) profile.get("nickname"));
        dto.setNickname((String) profile.get("nickname"));
        dto.setProfileImageUrl((String) profile.get("profile_image_url"));
        dto.setProvider("KAKAO");
        
        return dto;
    }
    
    private User findOrCreateUser(SocialUserInfoDto socialUserInfo) {
        // 1. 먼저 소셜 계정으로 기존 사용자 찾기
        UserSocialAccount.SocialProvider provider = UserSocialAccount.SocialProvider.valueOf(socialUserInfo.getProvider());
        Optional<UserSocialAccount> existingSocialAccount = 
            socialAccountRepository.findByProviderAndProviderUserId(provider, socialUserInfo.getId());
        
        if (existingSocialAccount.isPresent()) {
            return existingSocialAccount.get().getUser();
        }
        
        // 2. 이메일로 기존 사용자 찾기
        if (socialUserInfo.getEmail() != null) {
            Optional<User> existingUser = userRepository.findByEmail(socialUserInfo.getEmail());
            if (existingUser.isPresent()) {
                return existingUser.get();
            }
        }
        
        // 3. 새 사용자 생성
        User newUser = new User();
        newUser.setEmail(socialUserInfo.getEmail());
        newUser.setNickname(generateNickname(socialUserInfo));
        newUser.setPassword(null); // 소셜 로그인은 비밀번호 없음
        newUser.setRegistrationMethod(User.RegistrationMethod.valueOf(socialUserInfo.getProvider()));
        newUser.setSocialProviderId(socialUserInfo.getId());
        newUser.setProfileImageUrl(socialUserInfo.getProfileImageUrl());
        
        return userRepository.save(newUser);
    }
    
    private String generateNickname(SocialUserInfoDto socialUserInfo) {
        String baseName = socialUserInfo.getNickname() != null ? 
                         socialUserInfo.getNickname() : 
                         socialUserInfo.getName();
        
        if (baseName == null || baseName.trim().isEmpty()) {
            baseName = socialUserInfo.getProvider() + "사용자";
        }
        
        // 닉네임 중복 체크 및 고유 닉네임 생성
        String nickname = baseName;
        int counter = 1;
        while (userRepository.existsByNickname(nickname)) {
            nickname = baseName + counter;
            counter++;
        }
        
        return nickname;
    }
    
    private void saveSocialAccount(User user, SocialUserInfoDto socialUserInfo, String accessToken) {
        UserSocialAccount.SocialProvider provider = UserSocialAccount.SocialProvider.valueOf(socialUserInfo.getProvider());
        
        Optional<UserSocialAccount> existingAccount = 
            socialAccountRepository.findByProviderAndProviderUserId(provider, socialUserInfo.getId());
        
        UserSocialAccount socialAccount;
        if (existingAccount.isPresent()) {
            socialAccount = existingAccount.get();
            socialAccount.setUser(user); // 사용자 연결 업데이트
        } else {
            socialAccount = new UserSocialAccount(user, provider, socialUserInfo.getId());
        }
        
        // 소셜 계정 정보 업데이트
        socialAccount.setProviderEmail(socialUserInfo.getEmail());
        socialAccount.setProviderName(socialUserInfo.getName());
        socialAccount.setProviderProfileImage(socialUserInfo.getProfileImageUrl());
        socialAccount.setAccessToken(accessToken);
        socialAccount.setIsActive(true);
        
        socialAccountRepository.save(socialAccount);
    }
}