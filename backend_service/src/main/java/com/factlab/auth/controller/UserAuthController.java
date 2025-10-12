package com.factlab.auth.controller;

import com.factlab.auth.dto.DuplicateCheckDto;
import com.factlab.auth.dto.EmailVerificationRequestDto;
import com.factlab.auth.dto.EmailVerificationDto;
import com.factlab.auth.dto.UserRegisterRequestDto;
import com.factlab.auth.dto.UserRegisterResponseDto;
import com.factlab.auth.dto.UserLoginRequestDto;
import com.factlab.auth.dto.UserLoginResponseDto;
import com.factlab.auth.service.UserAuthService;
import com.factlab.auth.service.EmailVerificationService;
import com.factlab.common.dto.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class UserAuthController {

    private static final Logger logger = LoggerFactory.getLogger(UserAuthController.class);

    @Autowired
    private UserAuthService userAuthService;

    @Autowired
    private EmailVerificationService emailVerificationService;
    
    /**
     * 이메일 중복 확인
     */
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<DuplicateCheckDto>> checkEmailDuplicate(
            @RequestParam @NotBlank(message = "이메일은 필수입니다") @Email(message = "올바른 이메일 형식이 아닙니다") String email) {
        
        try {
            DuplicateCheckDto result = userAuthService.checkEmailDuplicate(email);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("이메일 중복 확인 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 닉네임 중복 확인
     */
    @GetMapping("/check-nickname")
    public ResponseEntity<ApiResponse<DuplicateCheckDto>> checkNicknameDuplicate(
            @RequestParam @NotBlank(message = "닉네임은 필수입니다") String nickname) {
        
        try {
            DuplicateCheckDto result = userAuthService.checkNicknameDuplicate(nickname);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("닉네임 중복 확인 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 이메일 인증 코드 발송
     */
    @PostMapping("/send-verification")
    public ResponseEntity<ApiResponse<String>> sendVerificationCode(
            @Valid @RequestBody EmailVerificationRequestDto requestDto) {
        
        try {
            logger.info("이메일 인증 코드 발송 요청: {}", requestDto.getEmail());

            boolean sent = emailVerificationService.sendVerificationCode(requestDto.getEmail());

            if (sent) {
                logger.info("이메일 인증 코드 발송 성공: {}", requestDto.getEmail());
                return ResponseEntity.ok(ApiResponse.success("인증 코드가 발송되었습니다."));
            } else {
                logger.warn("이메일 인증 코드 발송 실패: {}", requestDto.getEmail());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("인증 코드 발송에 실패했습니다."));
            }
        } catch (Exception e) {
            logger.error("이메일 인증 코드 발송 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("인증 코드 발송 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 이메일 인증 코드 확인
     */
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<String>> verifyEmail(
            @Valid @RequestBody EmailVerificationDto requestDto) {
        
        try {
            logger.debug("이메일 인증 요청: email={}", requestDto.getEmail());

            // validation 체크
            if (requestDto.getEmail() == null || requestDto.getEmail().trim().isEmpty()) {
                logger.warn("이메일 인증 실패: 이메일이 비어있음");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("이메일은 필수입니다."));
            }

            if (requestDto.getCode() == null || requestDto.getCode().trim().isEmpty()) {
                logger.warn("이메일 인증 실패: 인증 코드가 비어있음");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("인증 코드는 필수입니다."));
            }

            if (requestDto.getCode().length() != 6) {
                logger.warn("이메일 인증 실패: 인증 코드 길이 오류 ({}자)", requestDto.getCode().length());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("인증 코드는 6자리여야 합니다."));
            }

            boolean verified = emailVerificationService.verifyCode(requestDto.getEmail(), requestDto.getCode());

            if (verified) {
                logger.info("이메일 인증 성공: {}", requestDto.getEmail());
                return ResponseEntity.ok(ApiResponse.success("이메일 인증이 완료되었습니다."));
            } else {
                logger.warn("이메일 인증 실패: email={}", requestDto.getEmail());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("인증 코드가 올바르지 않거나 만료되었습니다."));
            }
        } catch (Exception e) {
            logger.error("이메일 인증 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("이메일 인증 중 오류가 발생했습니다."));
        }
    }
    /**
     * 사용자 회원가입
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserRegisterResponseDto>> registerUser(
            @Valid @RequestBody UserRegisterRequestDto requestDto) {
        
        try {
            logger.info("회원가입 요청: email={}, nickname={}", requestDto.getEmail(), requestDto.getNickname());

            // 이메일 인증 상태 확인
            if (!emailVerificationService.isEmailVerified(requestDto.getEmail())) {
                logger.warn("회원가입 실패: 이메일 미인증 - {}", requestDto.getEmail());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("이메일 인증을 완료해주세요."));
            }

            UserRegisterResponseDto result = userAuthService.registerUser(requestDto);
            logger.info("회원가입 성공: email={}, userId={}", result.getEmail(), result.getId());
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(result, "회원가입이 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            logger.warn("회원가입 실패 (검증 오류): {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("회원가입 실패 (내부 오류): {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("회원가입 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 사용자 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserLoginResponseDto>> loginUser(
            @Valid @RequestBody UserLoginRequestDto requestDto) {
        
        try {
            UserLoginResponseDto result = userAuthService.loginUser(requestDto);
            return ResponseEntity.ok(ApiResponse.success(result, "로그인이 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("로그인 중 오류가 발생했습니다."));
        }
    }
}