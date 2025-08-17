package com.factlab.board.controller;

import com.factlab.board.dto.BoardCategoryDto;
import com.factlab.board.dto.BoardResponseDto;
import com.factlab.board.service.BoardCategoryService;
import com.factlab.board.service.BoardService;
import com.factlab.community.service.PostService;
import com.factlab.community.dto.PostResponseDto;
import com.factlab.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boards")
public class BoardController {

    @Autowired
    private BoardService boardService;
    
    @Autowired
    private BoardCategoryService categoryService;
    
    @Autowired
    private PostService postService;

    /**
     * 활성화된 게시판 목록 조회 (사용자용) - 커뮤니티Lab 메뉴 구성용
     * GET /api/boards
     */
    @GetMapping
    @Operation(summary = "활성화된 게시판 목록 조회", description = "사용자가 활성화된 게시판 목록을 조회합니다 (커뮤니티Lab 메뉴용)")
    public ApiResponse<List<BoardResponseDto>> getActiveBoards() {
        try {
            List<BoardResponseDto> boards = boardService.getActiveBoards();
            return ApiResponse.success(boards, "게시판 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("게시판 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 게시판 상세 조회
     * GET /api/boards/{id}
     */
    @GetMapping("/{id}")
    @Operation(summary = "게시판 상세 조회", description = "특정 게시판의 상세 정보를 조회합니다")
    public ApiResponse<BoardResponseDto> getBoardById(@PathVariable Long id) {
        try {
            BoardResponseDto board = boardService.getBoardById(id);
            return ApiResponse.success(board, "게시판 정보를 성공적으로 조회했습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("게시판 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 카테고리별 게시판 조회
     * GET /api/boards/category/{category}
     */
    @GetMapping("/category/{category}")
    @Operation(summary = "카테고리별 게시판 조회", description = "특정 카테고리의 게시판 목록을 조회합니다")
    public ApiResponse<List<BoardResponseDto>> getBoardsByCategory(@PathVariable String category) {
        try {
            List<BoardResponseDto> boards = boardService.getBoardsByCategory(category);
            return ApiResponse.success(boards, "카테고리별 게시판 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("카테고리별 게시판 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // ===== 카테고리 관리 API =====
    
    /**
     * 활성화된 카테고리 목록 조회 (사용자용)
     * GET /api/boards/categories
     */
    @GetMapping("/categories")
    @Operation(summary = "활성화된 카테고리 목록 조회", description = "사용자가 활성화된 카테고리 목록을 조회합니다")
    public ApiResponse<List<BoardCategoryDto>> getActiveCategories() {
        try {
            List<BoardCategoryDto> categories = categoryService.getActiveCategories();
            return ApiResponse.success(categories, "카테고리 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("카테고리 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 카테고리 상세 조회
     * GET /api/boards/categories/{id}
     */
    @GetMapping("/categories/{id}")
    @Operation(summary = "카테고리 상세 조회", description = "특정 카테고리의 상세 정보를 조회합니다")
    public ApiResponse<BoardCategoryDto> getCategoryById(@PathVariable Long id) {
        try {
            BoardCategoryDto category = categoryService.getCategoryById(id);
            return ApiResponse.success(category, "카테고리 정보를 성공적으로 조회했습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("카테고리 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}