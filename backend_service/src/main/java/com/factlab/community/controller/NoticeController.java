package com.factlab.community.controller;

import com.factlab.common.dto.ApiResponse;
import com.factlab.community.dto.PostResponseDto;
import com.factlab.community.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notices")
@Tag(name = "Notice", description = "공지사항 API")
public class NoticeController {

    @Autowired
    private PostService postService;

    /**
     * 사용자용 공지사항 목록 조회 (활성화된 공지사항만)
     * GET /api/notices
     */
    @GetMapping
    @Operation(summary = "공지사항 목록 조회", description = "사용자에게 표시되는 활성화된 공지사항 목록을 조회합니다")
    public ApiResponse<Page<PostResponseDto>> getActiveNotices(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PostResponseDto> notices = postService.getActiveNotices(pageable);
            return ApiResponse.success(notices, "공지사항 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("공지사항 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 공지사항 상세 조회
     * GET /api/notices/{noticeId}
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
     * 푸터용 최신 공지사항 조회 (5개)
     * GET /api/notices/footer
     */
    @GetMapping("/footer")
    @Operation(summary = "푸터용 공지사항", description = "푸터에 표시될 최신 공지사항 5개를 조회합니다")
    public ApiResponse<Page<PostResponseDto>> getFooterNotices() {
        try {
            Pageable pageable = PageRequest.of(0, 5);
            Page<PostResponseDto> notices = postService.getActiveNotices(pageable);
            return ApiResponse.success(notices, "푸터용 공지사항을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("푸터용 공지사항 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 특정 게시판의 공지사항 조회 (게시판 상단 표시용)
     * GET /api/notices/board/{boardId}
     */
    @GetMapping("/board/{boardId}")
    @Operation(summary = "게시판용 공지사항", description = "특정 게시판 상단에 표시될 공지사항을 조회합니다")
    public ApiResponse<Page<PostResponseDto>> getBoardNotices(
            @PathVariable Long boardId,
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "5") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PostResponseDto> notices = postService.getBoardNotices(boardId, pageable);
            return ApiResponse.success(notices, "게시판 공지사항을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("게시판 공지사항 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}