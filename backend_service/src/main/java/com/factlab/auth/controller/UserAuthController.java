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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
// @CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})  // nginx에서 CORS 처리하므로 비활성화
public class UserAuthController {
    
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
            System.out.println("인증 코드 발송 요청: " + requestDto.getEmail()); // 디버깅 로그
            
            boolean sent = emailVerificationService.sendVerificationCode(requestDto.getEmail());
            
            if (sent) {
                System.out.println("인증 코드 발송 성공: " + requestDto.getEmail()); // 디버깅 로그
                return ResponseEntity.ok(ApiResponse.success("인증 코드가 발송되었습니다."));
            } else {
                System.out.println("인증 코드 발송 실패: " + requestDto.getEmail()); // 디버깅 로그
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("인증 코드 발송에 실패했습니다."));
            }
        } catch (Exception e) {
            System.out.println("인증 코드 발송 중 예외 발생: " + e.getMessage()); // 디버깅 로그
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("인증 코드 발송 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 이메일 인증 코드 확인
     */
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<String>> verifyEmail(
            @Valid @RequestBody EmailVerificationDto requestDto) {
        
        try {
            System.out.println("이메일 인증 요청 수신: " + requestDto.getEmail() + ", 코드: " + requestDto.getCode()); // 디버깅 로그
            
            // validation 체크
            if (requestDto.getEmail() == null || requestDto.getEmail().trim().isEmpty()) {
                System.out.println("이메일이 비어있음"); // 디버깅 로그
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("이메일은 필수입니다."));
            }
            
            if (requestDto.getCode() == null || requestDto.getCode().trim().isEmpty()) {
                System.out.println("인증 코드가 비어있음"); // 디버깅 로그
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("인증 코드는 필수입니다."));
            }
            
            if (requestDto.getCode().length() != 6) {
                System.out.println("인증 코드 길이 오류: " + requestDto.getCode().length()); // 디버깅 로그
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("인증 코드는 6자리여야 합니다."));
            }
            
            boolean verified = emailVerificationService.verifyCode(requestDto.getEmail(), requestDto.getCode());
            
            if (verified) {
                System.out.println("이메일 인증 성공: " + requestDto.getEmail()); // 디버깅 로그
                return ResponseEntity.ok(ApiResponse.success("이메일 인증이 완료되었습니다."));
            } else {
                System.out.println("이메일 인증 실패: " + requestDto.getEmail() + ", 코드: " + requestDto.getCode()); // 디버깅 로그
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("인증 코드가 올바르지 않거나 만료되었습니다."));
            }
        } catch (Exception e) {
            System.out.println("이메일 인증 중 예외 발생: " + e.getMessage()); // 디버깅 로그
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("이메일 인증 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }
    
    /**
     * 테스트용 이메일 인증 (간단 버전)
     */
    @PostMapping("/test-verify-email")
    public ResponseEntity<ApiResponse<String>> testVerifyEmail(
            @RequestBody EmailVerificationDto requestDto) {
        
        System.out.println("테스트 이메일 인증 요청: " + requestDto.getEmail() + ", 코드: " + requestDto.getCode());
        
        // 테스트용: 무조건 123456이면 성공
        if ("123456".equals(requestDto.getCode())) {
            System.out.println("테스트 인증 성공");
            return ResponseEntity.ok(ApiResponse.success("테스트 이메일 인증이 완료되었습니다."));
        } else {
            System.out.println("테스트 인증 실패");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("테스트: 123456을 입력하세요."));
        }
    }
    
    /**
     * 사용자 회원가입
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserRegisterResponseDto>> registerUser(
            @Valid @RequestBody UserRegisterRequestDto requestDto) {
        
        try {
            System.out.println("회원가입 요청: " + requestDto.getEmail() + ", " + requestDto.getNickname()); // 디버깅 로그
            
            // 테스트 환경에서는 이메일 인증 체크 우회 (임시)
            // TODO: 프로덕션에서는 이메일 인증 체크 활성화 필요
            boolean isTestMode = true; // 테스트 모드
            
            if (!isTestMode) {
                // 이메일 인증 상태 확인
                if (!emailVerificationService.isEmailVerified(requestDto.getEmail())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("이메일 인증을 완료해주세요."));
                }
            }
            
            UserRegisterResponseDto result = userAuthService.registerUser(requestDto);
            System.out.println("회원가입 성공: " + result.getEmail()); // 디버깅 로그
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(result, "회원가입이 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            System.out.println("회원가입 실패 (검증 오류): " + e.getMessage()); // 디버깅 로그
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.out.println("회원가입 실패 (내부 오류): " + e.getMessage()); // 디버깅 로그
            e.printStackTrace();
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