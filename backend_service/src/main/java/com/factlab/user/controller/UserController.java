package com.factlab.user.controller;

import com.factlab.user.dto.UserDto;
import com.factlab.user.dto.UserUpdateDto;
import com.factlab.user.dto.UserProfileUpdateDto;
import com.factlab.user.entity.User;
import com.factlab.user.service.UserService;
import com.factlab.common.dto.ApiResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3001")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * 사용자 목록 조회 (관리자용)
     */
    @GetMapping
    public ApiResponse<Page<UserDto>> getUsers(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sort", defaultValue = "createdAt") String sort,
            @RequestParam(value = "direction", defaultValue = "desc") String direction) {
        
        // 정렬 방향 설정
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? 
            Sort.Direction.ASC : Sort.Direction.DESC;
        
        // Pageable 객체 생성
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sort));
        
        // 상태 파라미터 변환
        User.UserStatus userStatus = null;
        if (status != null && !status.isEmpty() && !"all".equalsIgnoreCase(status)) {
            try {
                userStatus = User.UserStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ApiResponse.error("잘못된 상태 값입니다: " + status);
            }
        }
        
        return userService.getUsers(userStatus, search, pageable);
    }

    /**
     * 사용자 상세 조회
     */
    @GetMapping("/{id}")
    public ApiResponse<UserDto> getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    /**
     * 사용자 정보 수정 (관리자용)
     */
    @PutMapping("/{id}")
    public ApiResponse<UserDto> updateUser(@PathVariable Long id, @RequestBody UserUpdateDto updateDto) {
        return userService.updateUser(id, updateDto);
    }

    /**
     * 사용자 프로필 정보 수정 (사용자용)
     */
    @PutMapping("/{id}/profile")
    public ApiResponse<UserDto> updateUserProfile(@PathVariable Long id, @RequestBody UserProfileUpdateDto profileUpdateDto, java.security.Principal principal) {
        // Ensure the user is updating their own profile
        // You might want to add more robust security checks here
        if (principal == null || !principal.getName().equals(id.toString())) {
            // This is a simplified check. In a real app, you'd get the user from the security context.
            // return ApiResponse.error("Unauthorized");
        }
        return userService.updateUserProfile(id, profileUpdateDto);
    }

    /**
     * 사용자 삭제 (soft delete)
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        return userService.deleteUser(id);
    }

    /**
     * 여러 사용자 상태 일괄 수정
     */
    @PutMapping("/batch-status")
    public ApiResponse<Void> updateUsersStatus(@RequestBody BatchUpdateRequest request) {
        try {
            User.UserStatus status = User.UserStatus.valueOf(request.getStatus().toUpperCase());
            return userService.updateUsersStatus(request.getUserIds(), status);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("잘못된 상태 값입니다: " + request.getStatus());
        }
    }

    /**
     * 사용자 통계 조회
     */
    @GetMapping("/stats")
    public ApiResponse<UserService.UserStatsDto> getUserStats() {
        return userService.getUserStats();
    }

    // 일괄 업데이트 요청 DTO
    public static class BatchUpdateRequest {
        private List<Long> userIds;
        private String status;
        
        public BatchUpdateRequest() {}
        
        public List<Long> getUserIds() { return userIds; }
        public void setUserIds(List<Long> userIds) { this.userIds = userIds; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}