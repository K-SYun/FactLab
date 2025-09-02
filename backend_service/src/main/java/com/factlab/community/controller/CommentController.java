package com.factlab.community.controller;

import com.factlab.common.dto.ApiResponse;
import com.factlab.community.dto.CommentCreateDto;
import com.factlab.community.dto.CommentResponseDto;
import com.factlab.community.dto.CommentUpdateDto;
import com.factlab.community.service.PostCommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private PostCommentService postCommentService;

    /**
     * 게시글의 댓글 목록 조회 (계층 구조)
     * GET /api/comments?postId=1
     */
    @GetMapping
    @Operation(summary = "댓글 목록 조회", description = "특정 게시글의 댓글을 계층 구조로 조회합니다")
    public ApiResponse<List<CommentResponseDto>> getComments(
            @Parameter(description = "게시글 ID") @RequestParam Long postId) {
        try {
            List<CommentResponseDto> comments = postCommentService.getComments(postId);
            return ApiResponse.success(comments, "댓글 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("댓글 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 최상위 댓글만 조회
     * GET /api/comments/top-level?postId=1
     */
    @GetMapping("/top-level")
    @Operation(summary = "최상위 댓글 조회", description = "게시글의 최상위 댓글만 조회합니다 (대댓글 제외)")
    public ApiResponse<List<CommentResponseDto>> getTopLevelComments(
            @Parameter(description = "게시글 ID") @RequestParam Long postId) {
        try {
            List<CommentResponseDto> comments = postCommentService.getTopLevelComments(postId);
            return ApiResponse.success(comments, "최상위 댓글을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("최상위 댓글 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 특정 댓글의 대댓글 조회
     * GET /api/comments/{commentId}/replies
     */
    @GetMapping("/{commentId}/replies")
    @Operation(summary = "대댓글 조회", description = "특정 댓글의 대댓글 목록을 조회합니다")
    public ApiResponse<List<CommentResponseDto>> getReplies(@PathVariable Long commentId) {
        try {
            List<CommentResponseDto> replies = postCommentService.getReplies(commentId);
            return ApiResponse.success(replies, "대댓글 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("대댓글 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 최근 댓글 조회
     * GET /api/comments/recent
     */
    @GetMapping("/recent")
    @Operation(summary = "최근 댓글 조회", description = "전체 게시판의 최근 댓글 10개를 조회합니다")
    public ApiResponse<List<CommentResponseDto>> getRecentComments() {
        try {
            List<CommentResponseDto> comments = postCommentService.getRecentComments();
            return ApiResponse.success(comments, "최근 댓글을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("최근 댓글 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 댓글 작성
     * POST /api/comments
     */
    @PostMapping
    @Operation(summary = "댓글 작성", description = "새로운 댓글 또는 대댓글을 작성합니다")
    public ApiResponse<CommentResponseDto> createComment(
            @Valid @RequestBody CommentCreateDto createDto,
            @Parameter(description = "사용자 ID") @RequestHeader("User-Id") Long userId) {
        try {
            CommentResponseDto comment = postCommentService.createComment(createDto, userId);
            return ApiResponse.success(comment, "댓글이 성공적으로 작성되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("댓글 작성 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 댓글 수정
     * PUT /api/comments/{commentId}
     */
    @PutMapping("/{commentId}")
    @Operation(summary = "댓글 수정", description = "기존 댓글을 수정합니다")
    public ApiResponse<CommentResponseDto> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentUpdateDto updateDto,
            @Parameter(description = "사용자 ID") @RequestHeader("User-Id") Long userId) {
        try {
            CommentResponseDto comment = postCommentService.updateComment(commentId, updateDto, userId);
            return ApiResponse.success(comment, "댓글이 성공적으로 수정되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("댓글 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 댓글 삭제
     * DELETE /api/comments/{commentId}
     */
    @DeleteMapping("/{commentId}")
    @Operation(summary = "댓글 삭제", description = "댓글과 모든 대댓글을 삭제합니다")
    public ApiResponse<Void> deleteComment(
            @PathVariable Long commentId,
            @Parameter(description = "사용자 ID") @RequestHeader("User-Id") Long userId) {
        try {
            postCommentService.deleteComment(commentId, userId);
            return ApiResponse.success(null, "댓글이 성공적으로 삭제되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("댓글 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 댓글 좋아요
     * POST /api/comments/{commentId}/like
     */
    @PostMapping("/{commentId}/like")
    @Operation(summary = "댓글 좋아요", description = "댓글에 좋아요를 추가합니다")
    public ApiResponse<Void> likeComment(
            @PathVariable Long commentId,
            @RequestBody LikeRequest likeRequest) {
        try {
            postCommentService.likeComment(commentId, likeRequest.getUserId());
            return ApiResponse.success(null, "댓글에 좋아요를 추가했습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("좋아요 추가 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 댓글 좋아요 취소
     * DELETE /api/comments/{commentId}/like
     */
    @DeleteMapping("/{commentId}/like")
    @Operation(summary = "댓글 좋아요 취소", description = "댓글의 좋아요를 취소합니다")
    public ApiResponse<Void> unlikeComment(@PathVariable Long commentId) {
        try {
            postCommentService.unlikeComment(commentId);
            return ApiResponse.success(null, "댓글의 좋아요를 취소했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("좋아요 취소 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 사용자가 작성한 댓글 목록
     * GET /api/comments/user/{userId}
     */
    @GetMapping("/user/{userId}")
    @Operation(summary = "사용자 댓글 목록", description = "특정 사용자가 작성한 댓글 목록을 조회합니다")
    public ApiResponse<Page<CommentResponseDto>> getUserComments(
            @PathVariable Long userId,
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<CommentResponseDto> comments = postCommentService.getUserComments(userId, pageable);
            return ApiResponse.success(comments, "사용자 댓글 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("사용자 댓글 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 좋아요 요청 DTO
    public static class LikeRequest {
        private Long userId;

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
    }
}