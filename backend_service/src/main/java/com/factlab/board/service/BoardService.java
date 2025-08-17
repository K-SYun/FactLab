package com.factlab.board.service;

import com.factlab.admin.entity.AdminUser;
import com.factlab.admin.repository.AdminUserRepository;
import com.factlab.board.dto.BoardCreateDto;
import com.factlab.board.dto.BoardResponseDto;
import com.factlab.board.dto.BoardUpdateDto;
import com.factlab.board.entity.Board;
import com.factlab.board.entity.BoardCategory;
import com.factlab.board.repository.BoardRepository;
import com.factlab.board.repository.BoardCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class BoardService {
    
    @Autowired
    private BoardRepository boardRepository;
    
    @Autowired
    private AdminUserRepository adminUserRepository;
    
    @Autowired
    private BoardCategoryRepository categoryRepository;
    
    /**
     * 모든 게시판 조회 (관리자용)
     */
    public List<BoardResponseDto> getAllBoards() {
        return boardRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }
    
    /**
     * 활성화된 게시판 조회 (사용자용)
     */
    public List<BoardResponseDto> getActiveBoards() {
        return boardRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }
    
    /**
     * 게시판 ID로 조회
     */
    public BoardResponseDto getBoardById(Long id) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시판을 찾을 수 없습니다. ID: " + id));
        return convertToResponseDto(board);
    }
    
    /**
     * 게시판 생성
     */
    public BoardResponseDto createBoard(BoardCreateDto createDto, String adminUsername) {
        // 게시판 이름 중복 체크
        if (boardRepository.findByName(createDto.getName()).isPresent()) {
            throw new RuntimeException("이미 존재하는 게시판 이름입니다: " + createDto.getName());
        }
        
        // 관리자 정보 조회
        AdminUser admin = adminUserRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new RuntimeException("관리자를 찾을 수 없습니다: " + adminUsername));
        
        // Board 엔티티 생성
        Board board = new Board();
        board.setName(createDto.getName());
        board.setDescription(createDto.getDescription());
        board.setCategory(createDto.getCategory());
        board.setDisplayOrder(createDto.getDisplayOrder());
        board.setAllowAnonymous(createDto.getAllowAnonymous());
        board.setRequireApproval(createDto.getRequireApproval());
        board.setIsActive(true);
        board.setCreatedBy(admin);
        
        // 카테고리 ID가 있는 경우 설정
        if (createDto.getCategoryId() != null) {
            BoardCategory category = categoryRepository.findById(createDto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다. ID: " + createDto.getCategoryId()));
            board.setBoardCategory(category);
        }
        
        Board savedBoard = boardRepository.save(board);
        return convertToResponseDto(savedBoard);
    }
    
    /**
     * 게시판 수정
     */
    public BoardResponseDto updateBoard(Long id, BoardUpdateDto updateDto) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시판을 찾을 수 없습니다. ID: " + id));
        
        // 게시판 이름 중복 체크 (자신 제외)
        Optional<Board> existingBoard = boardRepository.findByNameAndIdNot(updateDto.getName(), id);
        if (existingBoard.isPresent()) {
            throw new RuntimeException("이미 존재하는 게시판 이름입니다: " + updateDto.getName());
        }
        
        // 정보 업데이트
        board.setName(updateDto.getName());
        board.setDescription(updateDto.getDescription());
        board.setCategory(updateDto.getCategory());
        board.setDisplayOrder(updateDto.getDisplayOrder());
        board.setAllowAnonymous(updateDto.getAllowAnonymous());
        board.setRequireApproval(updateDto.getRequireApproval());
        
        // 카테고리 ID가 있는 경우 설정
        if (updateDto.getCategoryId() != null) {
            BoardCategory category = categoryRepository.findById(updateDto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다. ID: " + updateDto.getCategoryId()));
            board.setBoardCategory(category);
        }
        
        Board savedBoard = boardRepository.save(board);
        return convertToResponseDto(savedBoard);
    }
    
    /**
     * 게시판 활성화/비활성화 토글
     */
    public BoardResponseDto toggleBoardStatus(Long id) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시판을 찾을 수 없습니다. ID: " + id));
        
        board.setIsActive(!board.getIsActive());
        Board savedBoard = boardRepository.save(board);
        return convertToResponseDto(savedBoard);
    }
    
    /**
     * 게시판 삭제
     */
    public void deleteBoard(Long id) {
        Board board = boardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시판을 찾을 수 없습니다. ID: " + id));
        
        // 게시글이 있는 경우 삭제 불가 (CASCADE로 삭제되지만 안전을 위해)
        if (board.getPostCount() > 0) {
            throw new RuntimeException("게시글이 있는 게시판은 삭제할 수 없습니다. 먼저 모든 게시글을 삭제해주세요.");
        }
        
        boardRepository.delete(board);
    }
    
    /**
     * 카테고리별 게시판 조회
     */
    public List<BoardResponseDto> getBoardsByCategory(String category) {
        return boardRepository.findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc(category)
                .stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Board 엔티티를 ResponseDto로 변환
     */
    private BoardResponseDto convertToResponseDto(Board board) {
        BoardResponseDto dto = new BoardResponseDto();
        dto.setId(board.getId());
        dto.setName(board.getName());
        dto.setDescription(board.getDescription());
        dto.setCategory(board.getCategory());
        dto.setIsActive(board.getIsActive());
        dto.setDisplayOrder(board.getDisplayOrder());
        dto.setAllowAnonymous(board.getAllowAnonymous());
        dto.setRequireApproval(board.getRequireApproval());
        dto.setPostCount(board.getPostCount());
        dto.setLastPostAt(board.getLastPostAt());
        dto.setCreatedAt(board.getCreatedAt());
        dto.setUpdatedAt(board.getUpdatedAt());
        
        if (board.getCreatedBy() != null) {
            dto.setCreatedByUsername(board.getCreatedBy().getUsername());
        }
        
        // 카테고리 정보 설정
        if (board.getBoardCategory() != null) {
            dto.setCategoryId(board.getBoardCategory().getId());
            dto.setCategoryName(board.getBoardCategory().getName());
        }
        
        return dto;
    }
}
