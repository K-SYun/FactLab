package com.factlab.admin.controller;

import com.factlab.common.dto.ApiResponse;
import com.factlab.community.dto.PostCreateDto;
import com.factlab.community.dto.PostResponseDto;
import com.factlab.community.dto.PostUpdateDto;
import com.factlab.community.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/notices")
@Tag(name = "Admin Notice", description = "관리자 공지사항 관리")
public class AdminNoticeController {

    @Autowired
    private PostService postService;

    /**
     * 공지사항 목록 조회
     * GET /api/admin/notices
     */
    @GetMapping
    @Operation(summary = "공지사항 목록 조회", description = "전체 공지사항 목록을 페이징하여 조회합니다")
    public ApiResponse<Page<PostResponseDto>> getNotices(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PostResponseDto> notices = postService.getNotices(pageable);
            return ApiResponse.success(notices, "공지사항 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("공지사항 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 공지사항 상세 조회
     * GET /api/admin/notices/{noticeId}
     */
    @GetMapping("/{noticeId}")
    @Operation(summary = "공지사항 상세 조회", description = "특정 공지사항의 상세 정보를 조회합니다")
    public ApiResponse<PostResponseDto> getNotice(@PathVariable Long noticeId) {
        try {
            PostResponseDto notice = postService.getPost(noticeId);
            if (!notice.getIsNotice()) {
                return ApiResponse.error("해당 게시글은 공지사항이 아닙니다.");
            }
            return ApiResponse.success(notice, "공지사항을 성공적으로 조회했습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("공지사항 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 공지사항 작성
     * POST /api/admin/notices
     */
    @PostMapping
    @Operation(summary = "공지사항 작성", description = "새로운 공지사항을 작성합니다")
    public ApiResponse<PostResponseDto> createNotice(
            @Valid @RequestBody PostCreateDto createDto,
            @Parameter(description = "관리자 ID") @RequestHeader("Admin-Id") Long adminId) {
        try {
            // 공지사항으로 설정
            createDto.setIsNotice(true);
            // boardId가 없으면 임시로 1을 설정 (나중에 createNotice에서 공지사항 게시판으로 변경됨)
            if (createDto.getBoardId() == null) {
                createDto.setBoardId(1L);
            }
            
            System.out.println("=== AdminNoticeController: createNotice 호출 ===");
            System.out.println("adminId: " + adminId);
            System.out.println("createDto.getIsNotice(): " + createDto.getIsNotice());
            System.out.println("createDto.getBoardId(): " + createDto.getBoardId());
            
            PostResponseDto notice = postService.createNotice(createDto, adminId);
            
            System.out.println("createNotice 결과 boardId: " + notice.getBoardId());
            return ApiResponse.success(notice, "공지사항이 성공적으로 작성되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("공지사항 작성 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 공지사항 수정
     * PUT /api/admin/notices/{noticeId}
     */
    @PutMapping("/{noticeId}")
    @Operation(summary = "공지사항 수정", description = "기존 공지사항을 수정합니다")
    public ApiResponse<PostResponseDto> updateNotice(
            @PathVariable Long noticeId,
            @Valid @RequestBody PostUpdateDto updateDto,
            @Parameter(description = "관리자 ID") @RequestHeader("Admin-Id") Long adminId) {
        try {
            PostResponseDto notice = postService.updateNotice(noticeId, updateDto, adminId);
            return ApiResponse.success(notice, "공지사항이 성공적으로 수정되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("공지사항 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 공지사항 삭제
     * DELETE /api/admin/notices/{noticeId}
     */
    @DeleteMapping("/{noticeId}")
    @Operation(summary = "공지사항 삭제", description = "공지사항을 삭제합니다")
    public ApiResponse<Void> deleteNotice(
            @PathVariable Long noticeId,
            @Parameter(description = "관리자 ID") @RequestHeader("Admin-Id") Long adminId) {
        try {
            postService.deleteNotice(noticeId, adminId);
            return ApiResponse.success(null, "공지사항이 성공적으로 삭제되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("공지사항 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 공지사항 활성화/비활성화
     * PUT /api/admin/notices/{noticeId}/toggle-status
     */
    @PutMapping("/{noticeId}/toggle-status")
    @Operation(summary = "공지사항 상태 변경", description = "공지사항의 활성화/비활성화 상태를 변경합니다")
    public ApiResponse<PostResponseDto> toggleNoticeStatus(
            @PathVariable Long noticeId,
            @Parameter(description = "관리자 ID") @RequestHeader("Admin-Id") Long adminId) {
        try {
            PostResponseDto notice = postService.toggleNoticeStatus(noticeId, adminId);
            return ApiResponse.success(notice, "공지사항 상태가 성공적으로 변경되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("공지사항 상태 변경 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 공지사항 핀(상단 고정) 설정/해제
     * PUT /api/admin/notices/{noticeId}/toggle-pin
     */
    @PutMapping("/{noticeId}/toggle-pin")
    @Operation(summary = "공지사항 고정 설정", description = "공지사항의 상단 고정을 설정/해제합니다")
    public ApiResponse<PostResponseDto> toggleNoticePin(
            @PathVariable Long noticeId,
            @Parameter(description = "관리자 ID") @RequestHeader("Admin-Id") Long adminId) {
        try {
            PostResponseDto notice = postService.toggleNoticePin(noticeId, adminId);
            return ApiResponse.success(notice, "공지사항 고정 설정이 성공적으로 변경되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("공지사항 고정 설정 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 사용자용 공지사항 목록 조회 (활성화된 공지사항만)
     * GET /api/admin/notices/active
     */
    @GetMapping("/active")
    @Operation(summary = "활성화된 공지사항 목록", description = "사용자에게 표시될 활성화된 공지사항 목록을 조회합니다")
    public ApiResponse<Page<PostResponseDto>> getActiveNotices(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PostResponseDto> notices = postService.getActiveNotices(pageable);
            return ApiResponse.success(notices, "활성화된 공지사항 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("활성화된 공지사항 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}