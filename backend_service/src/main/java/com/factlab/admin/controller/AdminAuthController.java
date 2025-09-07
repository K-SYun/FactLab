package com.factlab.admin.controller;

import com.factlab.admin.dto.AdminLoginRequestDto;
import com.factlab.admin.dto.AdminLoginResponseDto;
import com.factlab.admin.dto.AdminUserDto;
import com.factlab.admin.entity.AdminUser;
import com.factlab.admin.service.AdminAuthService;
import com.factlab.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/auth")
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
        AdminLoginResponseDto response = adminAuthService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 현재 로그인한 관리자 정보 조회
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AdminUserDto>> getCurrentAdmin(@AuthenticationPrincipal AdminUser adminUser) {
        return ResponseEntity.ok(ApiResponse.success(AdminUserDto.from(adminUser)));
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
     * 패스워드 해시 생성 (개발용 임시)
     */
    @PostMapping("/hash-password")
    public ResponseEntity<ApiResponse<String>> hashPassword(@RequestBody Map<String, String> request) {
        String password = request.get("password");
        String hashedPassword = adminAuthService.hashPassword(password);
        return ResponseEntity.ok(ApiResponse.success(hashedPassword));
    }
}