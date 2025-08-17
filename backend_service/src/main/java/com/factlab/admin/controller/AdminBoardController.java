package com.factlab.admin.controller;

import com.factlab.board.dto.BoardCreateDto;
import com.factlab.board.dto.BoardResponseDto;
import com.factlab.board.dto.BoardUpdateDto;
import com.factlab.board.dto.BoardCategoryDto;
import com.factlab.board.entity.BoardCategory;
import com.factlab.board.repository.BoardCategoryRepository;
import com.factlab.board.service.BoardService;
import com.factlab.community.service.PostService;
import com.factlab.community.dto.PostResponseDto;
import com.factlab.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminBoardController {

    @Autowired
    private BoardService boardService;

    @Autowired
    private BoardCategoryRepository categoryRepository;
    
    @Autowired
    private PostService postService;

    /**
     * 모든 게시판 목록 조회 (관리자용)
     * GET /api/admin/boards
     */
    @GetMapping("/boards")
    @Operation(summary = "모든 게시판 목록 조회", description = "관리자가 모든 게시판 목록을 조회합니다")
    public ApiResponse<List<BoardResponseDto>> getAllBoards() {
        try {
            List<BoardResponseDto> boards = boardService.getAllBoards();
            return ApiResponse.success(boards, "관리자 게시판 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("게시판 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 게시판 생성 (관리자용)
     * POST /api/admin/boards
     */
    @PostMapping("/boards")
    @Operation(summary = "게시판 생성", description = "관리자가 새로운 게시판을 생성합니다")
    public ApiResponse<BoardResponseDto> createBoard(@Valid @RequestBody BoardCreateDto createDto) {
        try {
            String adminUsername = "admin"; // 개발용 임시
            BoardResponseDto createdBoard = boardService.createBoard(createDto, adminUsername);
            return ApiResponse.success(createdBoard, "게시판이 성공적으로 생성되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("게시판 생성 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 게시판 수정 (관리자용)
     * PUT /api/admin/boards/{id}
     */
    @PutMapping("/boards/{id}")
    @Operation(summary = "게시판 수정", description = "관리자가 게시판 정보를 수정합니다")
    public ApiResponse<BoardResponseDto> updateBoard(
            @PathVariable Long id,
            @Valid @RequestBody BoardUpdateDto updateDto) {
        try {
            BoardResponseDto updatedBoard = boardService.updateBoard(id, updateDto);
            return ApiResponse.success(updatedBoard, "게시판이 성공적으로 수정되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("게시판 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 게시판 활성화/비활성화 토글 (관리자용)
     * POST /api/admin/boards/{id}/toggle
     */
    @PostMapping("/boards/{id}/toggle")
    @Operation(summary = "게시판 상태 토글", description = "관리자가 게시판 활성화 상태를 변경합니다")
    public ApiResponse<BoardResponseDto> toggleBoardStatus(@PathVariable Long id) {
        try {
            BoardResponseDto updatedBoard = boardService.toggleBoardStatus(id);
            return ApiResponse.success(updatedBoard, "게시판 상태가 성공적으로 변경되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("게시판 상태 변경 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 게시판 삭제 (관리자용)
     * DELETE /api/admin/boards/{id}
     */
    @DeleteMapping("/boards/{id}")
    @Operation(summary = "게시판 삭제", description = "관리자가 게시판을 삭제합니다")
    public ApiResponse<Void> deleteBoard(@PathVariable Long id) {
        try {
            boardService.deleteBoard(id);
            return ApiResponse.success(null, "게시판이 성공적으로 삭제되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("게시판 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // ===== 카테고리 관리 API =====

    /**
     * 게시판 카테고리 목록 조회 (관리자용)
     * GET /api/admin/board-categories
     */
    @GetMapping("/board-categories")
    @Operation(summary = "게시판 카테고리 목록 조회", description = "관리자가 게시판 카테고리 목록을 조회합니다")
    public ApiResponse<List<BoardCategoryDto>> getBoardCategories() {
        try {
            List<BoardCategory> categories = categoryRepository.findAllByOrderByDisplayOrderAsc();
            List<BoardCategoryDto> categoryDtos = categories.stream()
                .map(category -> new BoardCategoryDto(
                    category.getId(),
                    category.getName(),
                    category.getDescription(),
                    category.getDisplayOrder(),
                    category.getIsActive(),
                    0, // 게시판 수는 필요시 계산
                    category.getCreatedAt(),
                    category.getUpdatedAt()
                ))
                .toList();
            return ApiResponse.success(categoryDtos, "카테고리 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("카테고리 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 게시판 카테고리 생성 (관리자용)
     * POST /api/admin/board-categories
     */
    @PostMapping("/board-categories")
    @Operation(summary = "게시판 카테고리 생성", description = "관리자가 새로운 게시판 카테고리를 생성합니다")
    public ApiResponse<BoardCategory> createBoardCategory(@RequestBody BoardCategory category) {
        try {
            // 중복 이름 체크
            if (categoryRepository.findByName(category.getName()).isPresent()) {
                return ApiResponse.error("이미 존재하는 카테고리 이름입니다: " + category.getName());
            }

            BoardCategory savedCategory = categoryRepository.save(category);
            return ApiResponse.success(savedCategory, "카테고리가 성공적으로 생성되었습니다.");
        } catch (Exception e) {
            return ApiResponse.error("카테고리 생성 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 게시판 카테고리 수정 (관리자용)
     * PUT /api/admin/board-categories/{id}
     */
    @PutMapping("/board-categories/{id}")
    @Operation(summary = "게시판 카테고리 수정", description = "관리자가 게시판 카테고리를 수정합니다")
    public ApiResponse<BoardCategory> updateBoardCategory(@PathVariable Long id, @RequestBody BoardCategory category) {
        try {
            BoardCategory existingCategory = categoryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다. ID: " + id));

            // 중복 이름 체크 (자신 제외)
            if (categoryRepository.findByNameAndIdNot(category.getName(), id).isPresent()) {
                return ApiResponse.error("이미 존재하는 카테고리 이름입니다: " + category.getName());
            }

            existingCategory.setName(category.getName());
            existingCategory.setDescription(category.getDescription());
            existingCategory.setDisplayOrder(category.getDisplayOrder());
            existingCategory.setIsActive(category.getIsActive());

            BoardCategory savedCategory = categoryRepository.save(existingCategory);
            return ApiResponse.success(savedCategory, "카테고리가 성공적으로 수정되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("카테고리 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 게시판 카테고리 삭제 (관리자용)
     * DELETE /api/admin/board-categories/{id}
     */
    @DeleteMapping("/board-categories/{id}")
    @Operation(summary = "게시판 카테고리 삭제", description = "관리자가 게시판 카테고리를 삭제합니다")
    public ApiResponse<Void> deleteBoardCategory(@PathVariable Long id) {
        try {
            BoardCategory category = categoryRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다. ID: " + id));

            // 해당 카테고리를 사용하는 게시판이 있는지 확인
            if (!category.getBoards().isEmpty()) {
                return ApiResponse.error("해당 카테고리를 사용하는 게시판이 있어 삭제할 수 없습니다.");
            }

            categoryRepository.delete(category);
            return ApiResponse.success(null, "카테고리가 성공적으로 삭제되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("카테고리 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    // ===== BEST 게시판 관리 API =====
    
    /**
     * BEST 게시글 목록 조회 (관리자용)
     * GET /api/admin/best-posts
     */
    @GetMapping("/best-posts")
    @Operation(summary = "BEST 게시글 목록 조회", description = "관리자가 BEST 게시글 목록을 조회합니다")
    public ApiResponse<Page<PostResponseDto>> getBestPosts(Pageable pageable) {
        try {
            Page<PostResponseDto> posts = postService.getBestPosts(pageable);
            return ApiResponse.success(posts, "BEST 게시글 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("BEST 게시글 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 게시글의 BEST 게시판 제외 상태 토글 (관리자용)
     * POST /api/admin/posts/{postId}/toggle-best-exclusion
     */
    @PostMapping("/posts/{postId}/toggle-best-exclusion")
    @Operation(summary = "BEST 게시판 제외 상태 토글", description = "관리자가 게시글의 BEST 게시판 제외 상태를 변경합니다")
    public ApiResponse<Void> toggleBestExclusion(@PathVariable Long postId) {
        try {
            postService.toggleBestExclusion(postId);
            return ApiResponse.success(null, "BEST 게시판 제외 상태가 성공적으로 변경되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("BEST 게시판 제외 상태 변경 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}