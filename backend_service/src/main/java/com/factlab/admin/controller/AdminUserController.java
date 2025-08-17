package com.factlab.admin.controller;

import com.factlab.admin.dto.UserSuspensionDto;
import com.factlab.admin.service.AdminUserService;
import com.factlab.common.dto.ApiResponse;
import com.factlab.user.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @Autowired
    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    @Operation(summary = "사용자 목록 조회", description = "사용자 목록을 페이징하여 조회합니다")
    public ApiResponse<Page<User>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        try {
            Page<User> users = adminUserService.getUsers(PageRequest.of(page, size), status, keyword);
            return ApiResponse.success(users);
        } catch (Exception e) {
            return ApiResponse.error("사용자 목록 조회 실패: " + e.getMessage());
        }
    }

    @GetMapping("/{userId}")
    @Operation(summary = "사용자 상세 조회", description = "특정 사용자의 상세 정보를 조회합니다")
    public ApiResponse<User> getUserDetails(@PathVariable Long userId) {
        try {
            User user = adminUserService.getUserDetails(userId);
            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error("사용자 상세 조회 실패: " + e.getMessage());
        }
    }

    @PostMapping("/{userId}/suspend")
    @Operation(summary = "사용자 정지", description = "사용자를 정지시킵니다")
    public ApiResponse<String> suspendUser(@PathVariable Long userId, @RequestBody UserSuspensionDto suspension) {
        try {
            adminUserService.suspendUser(userId, suspension.getReason(), suspension.getDays());
            return ApiResponse.success("사용자가 정지되었습니다");
        } catch (Exception e) {
            return ApiResponse.error("사용자 정지 실패: " + e.getMessage());
        }
    }

    @PostMapping("/{userId}/unsuspend")
    @Operation(summary = "사용자 정지 해제", description = "사용자의 정지를 해제합니다")
    public ApiResponse<String> unsuspendUser(@PathVariable Long userId) {
        try {
            adminUserService.unsuspendUser(userId);
            return ApiResponse.success("사용자 정지가 해제되었습니다");
        } catch (Exception e) {
            return ApiResponse.error("사용자 정지 해제 실패: " + e.getMessage());
        }
    }

    @PostMapping("/{userId}/ban")
    @Operation(summary = "사용자 차단", description = "사용자를 영구 차단합니다")
    public ApiResponse<String> banUser(@PathVariable Long userId, @RequestBody UserSuspensionDto reason) {
        try {
            adminUserService.banUser(userId, reason.getReason());
            return ApiResponse.success("사용자가 차단되었습니다");
        } catch (Exception e) {
            return ApiResponse.error("사용자 차단 실패: " + e.getMessage());
        }
    }

    @GetMapping("/statistics")
    @Operation(summary = "사용자 통계", description = "사용자 관련 통계를 조회합니다")
    public ApiResponse<?> getUserStatistics() {
        try {
            var statistics = adminUserService.getUserStatistics();
            return ApiResponse.success(statistics);
        } catch (Exception e) {
            return ApiResponse.error("사용자 통계 조회 실패: " + e.getMessage());
        }
    }
}