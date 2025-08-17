package com.factlab.admin.controller;

import com.factlab.admin.dto.AdminLoginRequestDto;
import com.factlab.admin.dto.AdminLoginResponseDto;
import com.factlab.admin.dto.AdminUserDto;
import com.factlab.admin.service.AdminAuthService;
import com.factlab.common.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/auth")
// @CrossOrigin(origins = "*")  // nginx에서 CORS 처리하므로 비활성화
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @Autowired
    public AdminAuthController(AdminAuthService adminAuthService) {
        this.adminAuthService = adminAuthService;
    }

    /**
     * 관리자 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AdminLoginResponseDto>> login(
            @Valid @RequestBody AdminLoginRequestDto loginRequest) {

        System.out.println("=== ADMIN CONTROLLER LOGIN CALLED ===");
        System.out.println("Request username: " + loginRequest.getUsername());
        System.out.println("Request password length: " + (loginRequest.getPassword() != null ? loginRequest.getPassword().length() : "null"));

        AdminLoginResponseDto response = adminAuthService.login(loginRequest);

        System.out.println("=== ADMIN CONTROLLER LOGIN SUCCESS ===");
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 현재 로그인한 관리자 정보 조회
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AdminUserDto>> getCurrentAdmin(HttpServletRequest request) {
        String token = extractTokenFromRequest(request);
        AdminUserDto adminUser = adminAuthService.getCurrentAdmin(token);
        return ResponseEntity.ok(ApiResponse.success(adminUser));
    }

    /**
     * 관리자 로그아웃
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        // JWT는 stateless이므로 클라이언트에서 토큰을 삭제하면 됨
        // 필요시 Redis 등을 이용한 토큰 블랙리스트 구현 가능
        return ResponseEntity.ok(ApiResponse.success("로그아웃 되었습니다."));
    }

    /**
     * 토큰 검증
     */
    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<Boolean>> validateToken(HttpServletRequest request) {
        try {
            String token = extractTokenFromRequest(request);
            boolean isValid = adminAuthService.validateToken(token);
            return ResponseEntity.ok(ApiResponse.success(isValid));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.success(false));
        }
    }

    /**
     * 패스워드 해시 생성 (개발용 임시)
     */
    @PostMapping("/hash-password")
    public ResponseEntity<ApiResponse<String>> hashPassword(@RequestBody Map<String, String> request) {
        String password = request.get("password");
        String hashedPassword = adminAuthService.hashPassword(password);
        return ResponseEntity.ok(ApiResponse.success(hashedPassword));
    }

    /**
     * 패스워드 검증 테스트 (디버깅용)
     */
    @PostMapping("/test-password")
    public ResponseEntity<ApiResponse<Boolean>> testPassword(
            @RequestBody Map<String, String> request) {
        String plainPassword = request.get("password");
        String hash = request.get("hash");

        boolean matches = adminAuthService.testPasswordMatch(plainPassword, hash);
        return ResponseEntity.ok(ApiResponse.success(matches));
    }

    /**
     * 요청에서 토큰 추출
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        throw new IllegalArgumentException("토큰이 제공되지 않았습니다.");
    }
}