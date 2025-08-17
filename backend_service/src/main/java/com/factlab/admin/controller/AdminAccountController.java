package com.factlab.admin.controller;

import com.factlab.admin.dto.AdminUserDto;
import com.factlab.admin.dto.AdminUserRequestDto;
import com.factlab.admin.service.AdminAccountService;
import com.factlab.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/accounts")
public class AdminAccountController {
    
    private final AdminAccountService adminAccountService;
    
    @Autowired
    public AdminAccountController(AdminAccountService adminAccountService) {
        this.adminAccountService = adminAccountService;
    }
    
    /**
     * 모든 관리자 계정 조회
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminUserDto>>> getAllAdminUsers() {
        List<AdminUserDto> adminUsers = adminAccountService.getAllAdminUsers();
        return ResponseEntity.ok(ApiResponse.success(adminUsers));
    }
    
    /**
     * ID로 관리자 계정 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserDto>> getAdminUserById(@PathVariable Long id) {
        AdminUserDto adminUser = adminAccountService.getAdminUserById(id);
        return ResponseEntity.ok(ApiResponse.success(adminUser));
    }
    
    /**
     * 관리자 계정 생성
     */
    @PostMapping
    public ResponseEntity<ApiResponse<AdminUserDto>> createAdminUser(
            @Valid @RequestBody AdminUserRequestDto requestDto) {
        AdminUserDto createdUser = adminAccountService.createAdminUser(requestDto);
        return ResponseEntity.ok(ApiResponse.success(createdUser));
    }
    
    /**
     * 관리자 계정 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserDto>> updateAdminUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminUserRequestDto requestDto) {
        AdminUserDto updatedUser = adminAccountService.updateAdminUser(id, requestDto);
        return ResponseEntity.ok(ApiResponse.success(updatedUser));
    }
    
    /**
     * 관리자 계정 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteAdminUser(@PathVariable Long id) {
        adminAccountService.deleteAdminUser(id);
        return ResponseEntity.ok(ApiResponse.success("관리자 계정이 삭제되었습니다."));
    }
    
    /**
     * 활성화된 관리자 계정만 조회
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<AdminUserDto>>> getActiveAdminUsers() {
        List<AdminUserDto> activeUsers = adminAccountService.getActiveAdminUsers();
        return ResponseEntity.ok(ApiResponse.success(activeUsers));
    }
}