package com.factlab.community.controller;

import com.factlab.common.dto.ApiResponse;
import com.factlab.community.dto.PostCreateDto;
import com.factlab.community.dto.PostResponseDto;
import com.factlab.community.dto.PostUpdateDto;
import com.factlab.community.service.PostService;
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
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostService postService;

    /**
     * 게시글 목록 조회
     * GET /api/posts?boardId=1&page=0&size=20
     */
    @GetMapping
    @Operation(summary = "게시글 목록 조회", description = "특정 게시판의 게시글 목록을 페이징하여 조회합니다")
    public ApiResponse<Page<PostResponseDto>> getPosts(
            @Parameter(description = "게시판 ID") @RequestParam Long boardId,
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PostResponseDto> posts = postService.getPosts(boardId, pageable);
            return ApiResponse.success(posts, "게시글 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("게시글 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 게시글 상세 조회
     * GET /api/posts/{postId}
     */
    @GetMapping("/{postId}")
    @Operation(summary = "게시글 상세 조회", description = "특정 게시글의 상세 정보와 댓글을 조회합니다")
    public ApiResponse<PostResponseDto> getPost(@PathVariable Long postId) {
        try {
            PostResponseDto post = postService.getPost(postId);
            return ApiResponse.success(post, "게시글을 성공적으로 조회했습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("게시글 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 게시글 검색
     * GET /api/posts/search?boardId=1&keyword=검색어
     */
    @GetMapping("/search")
    @Operation(summary = "게시글 검색", description = "제목 또는 내용으로 게시글을 검색합니다")
    public ApiResponse<Page<PostResponseDto>> searchPosts(
            @Parameter(description = "게시판 ID") @RequestParam Long boardId,
            @Parameter(description = "검색 키워드") @RequestParam String keyword,
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PostResponseDto> posts = postService.searchPosts(boardId, keyword, pageable);
            return ApiResponse.success(posts, "게시글 검색을 성공적으로 완료했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("게시글 검색 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 인기 게시글 조회
     * GET /api/posts/popular?boardId=1
     */
    @GetMapping("/popular")
    @Operation(summary = "인기 게시글 조회", description = "좋아요와 댓글 수를 기준으로 인기 게시글을 조회합니다")
    public ApiResponse<Page<PostResponseDto>> getPopularPosts(
            @Parameter(description = "게시판 ID") @RequestParam Long boardId,
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PostResponseDto> posts = postService.getPopularPosts(boardId, pageable);
            return ApiResponse.success(posts, "인기 게시글을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("인기 게시글 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 최근 게시글 조회
     * GET /api/posts/recent
     */
    @GetMapping("/recent")
    @Operation(summary = "최근 게시글 조회", description = "전체 게시판의 최근 게시글 10개를 조회합니다")
    public ApiResponse<List<PostResponseDto>> getRecentPosts() {
        try {
            List<PostResponseDto> posts = postService.getRecentPosts();
            return ApiResponse.success(posts, "최근 게시글을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("최근 게시글 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * BEST 게시글 조회 (관리자가 설정한 기준으로)
     * GET /api/posts/best
     */
    @GetMapping("/best")
    @Operation(summary = "BEST 게시글 조회", description = "조회수와 추천수 기준을 만족하는 인기 게시글을 조회합니다")
    public ApiResponse<Page<PostResponseDto>> getBestPosts(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PostResponseDto> posts = postService.getBestPosts(pageable);
            return ApiResponse.success(posts, "BEST 게시글을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("BEST 게시글 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 게시글 작성
     * POST /api/posts
     */
    @PostMapping
    @Operation(summary = "게시글 작성", description = "새로운 게시글을 작성합니다")
    public ApiResponse<PostResponseDto> createPost(
            @Valid @RequestBody PostCreateDto createDto,
            @Parameter(description = "사용자 ID") @RequestHeader("User-Id") Long userId) {
        try {
            PostResponseDto post = postService.createPost(createDto, userId);
            return ApiResponse.success(post, "게시글이 성공적으로 작성되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("게시글 작성 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 게시글 수정
     * PUT /api/posts/{postId}
     */
    @PutMapping("/{postId}")
    @Operation(summary = "게시글 수정", description = "기존 게시글을 수정합니다")
    public ApiResponse<PostResponseDto> updatePost(
            @PathVariable Long postId,
            @Valid @RequestBody PostUpdateDto updateDto,
            @Parameter(description = "사용자 ID") @RequestHeader("User-Id") Long userId) {
        try {
            PostResponseDto post = postService.updatePost(postId, updateDto, userId);
            return ApiResponse.success(post, "게시글이 성공적으로 수정되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("게시글 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 게시글 삭제
     * DELETE /api/posts/{postId}
     */
    @DeleteMapping("/{postId}")
    @Operation(summary = "게시글 삭제", description = "게시글을 삭제합니다")
    public ApiResponse<Void> deletePost(
            @PathVariable Long postId,
            @Parameter(description = "사용자 ID") @RequestHeader("User-Id") Long userId) {
        try {
            postService.deletePost(postId, userId);
            return ApiResponse.success(null, "게시글이 성공적으로 삭제되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("게시글 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 게시글 좋아요
     * POST /api/posts/{postId}/like
     */
    @PostMapping("/{postId}/like")
    @Operation(summary = "게시글 좋아요", description = "게시글에 좋아요를 추가합니다")
    public ApiResponse<Void> likePost(@PathVariable Long postId) {
        try {
            postService.likePost(postId);
            return ApiResponse.success(null, "게시글에 좋아요를 추가했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("좋아요 추가 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 게시글 좋아요 취소
     * DELETE /api/posts/{postId}/like
     */
    @DeleteMapping("/{postId}/like")
    @Operation(summary = "게시글 좋아요 취소", description = "게시글의 좋아요를 취소합니다")
    public ApiResponse<Void> unlikePost(@PathVariable Long postId) {
        try {
            postService.unlikePost(postId);
            return ApiResponse.success(null, "게시글의 좋아요를 취소했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("좋아요 취소 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 사용자가 작성한 게시글 목록
     * GET /api/posts/user/{userId}
     */
    @GetMapping("/user/{userId}")
    @Operation(summary = "사용자 게시글 목록", description = "특정 사용자가 작성한 게시글 목록을 조회합니다")
    public ApiResponse<Page<PostResponseDto>> getUserPosts(
            @PathVariable Long userId,
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<PostResponseDto> posts = postService.getUserPosts(userId, pageable);
            return ApiResponse.success(posts, "사용자 게시글 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("사용자 게시글 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}