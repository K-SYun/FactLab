package com.factlab.news.controller;

import com.factlab.common.dto.ApiResponse;
import com.factlab.community.dto.CommentCreateDto;
import com.factlab.community.dto.CommentResponseDto;
import com.factlab.community.dto.CommentUpdateDto;
import com.factlab.news.service.NewsCommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/news")
public class NewsCommentController {

    @Autowired
    private NewsCommentService newsCommentService;

    /**
     * 뉴스 댓글 목록 조회
     * GET /api/news/{newsId}/comments
     */
    @GetMapping("/{newsId}/comments")
    @Operation(summary = "뉴스 댓글 목록 조회", description = "특정 뉴스의 댓글을 계층 구조로 조회합니다")
    public ApiResponse<List<CommentResponseDto>> getNewsComments(
            @Parameter(description = "뉴스 ID") @PathVariable Long newsId) {
        try {
            List<CommentResponseDto> comments = newsCommentService.getNewsComments(newsId.intValue());
            return ApiResponse.success(comments, "뉴스 댓글 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("뉴스 댓글 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 뉴스 댓글 작성
     * POST /api/news/{newsId}/comments
     */
    @PostMapping("/{newsId}/comments")
    @Operation(summary = "뉴스 댓글 작성", description = "뉴스에 새로운 댓글 또는 대댓글을 작성합니다")
    public ApiResponse<CommentResponseDto> createNewsComment(
            @Parameter(description = "뉴스 ID") @PathVariable Long newsId,
            @Valid @RequestBody CommentCreateDto createDto,
            @Parameter(description = "사용자 ID") @RequestHeader(value = "User-Id", required = false) Long userId) {
        try {
            // newsId를 DTO에 설정
            createDto.setNewsId(newsId);
            
            // 임시로 userId가 없으면 1로 설정 (테스트용)
            if (userId == null) {
                userId = 1L;
            }
            
            CommentResponseDto comment = newsCommentService.createNewsComment(createDto, userId);
            return ApiResponse.success(comment, "뉴스 댓글이 성공적으로 작성되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("뉴스 댓글 작성 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 뉴스 댓글 수정
     * PUT /api/news/{newsId}/comments/{commentId}
     */
    @PutMapping("/{newsId}/comments/{commentId}")
    @Operation(summary = "뉴스 댓글 수정", description = "뉴스 댓글을 수정합니다")
    public ApiResponse<CommentResponseDto> updateNewsComment(
            @Parameter(description = "뉴스 ID") @PathVariable Long newsId,
            @Parameter(description = "댓글 ID") @PathVariable Long commentId,
            @Valid @RequestBody CommentUpdateDto updateDto,
            @Parameter(description = "사용자 ID") @RequestHeader(value = "User-Id", required = false) Long userId) {
        try {
            // 임시로 userId가 없으면 1로 설정 (테스트용)
            if (userId == null) {
                userId = 1L;
            }
            
            CommentResponseDto comment = newsCommentService.updateComment(commentId, updateDto, userId);
            return ApiResponse.success(comment, "뉴스 댓글이 성공적으로 수정되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("뉴스 댓글 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 뉴스 댓글 삭제
     * DELETE /api/news/{newsId}/comments/{commentId}
     */
    @DeleteMapping("/{newsId}/comments/{commentId}")
    @Operation(summary = "뉴스 댓글 삭제", description = "뉴스 댓글을 삭제합니다")
    public ApiResponse<Void> deleteNewsComment(
            @Parameter(description = "뉴스 ID") @PathVariable Long newsId,
            @Parameter(description = "댓글 ID") @PathVariable Long commentId,
            @Parameter(description = "사용자 ID") @RequestHeader(value = "User-Id", required = false) Long userId) {
        try {
            // 임시로 userId가 없으면 1로 설정 (테스트용)
            if (userId == null) {
                userId = 1L;
            }
            
            newsCommentService.deleteComment(commentId, userId);
            return ApiResponse.success(null, "뉴스 댓글이 성공적으로 삭제되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("뉴스 댓글 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 뉴스 댓글 좋아요
     * POST /api/news/{newsId}/comments/{commentId}/like
     */
    @PostMapping("/{newsId}/comments/{commentId}/like")
    @Operation(summary = "뉴스 댓글 좋아요", description = "뉴스 댓글에 좋아요를 추가합니다")
    public ApiResponse<Void> likeNewsComment(
            @Parameter(description = "뉴스 ID") @PathVariable Long newsId,
            @Parameter(description = "댓글 ID") @PathVariable Long commentId) {
        try {
            newsCommentService.likeComment(commentId);
            return ApiResponse.success(null, "뉴스 댓글에 좋아요를 추가했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("좋아요 추가 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}