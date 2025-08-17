package com.factlab.board.service;

import com.factlab.board.dto.BoardCategoryDto;
import com.factlab.board.entity.BoardCategory;
import com.factlab.board.repository.BoardCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BoardCategoryService {
    
    @Autowired
    private BoardCategoryRepository categoryRepository;
    
    /**
     * 모든 카테고리 조회 (관리자용)
     */
    public List<BoardCategoryDto> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * 활성화된 카테고리 조회 (사용자용)
     */
    public List<BoardCategoryDto> getActiveCategories() {
        return categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * 카테고리 생성
     */
    public BoardCategoryDto createCategory(BoardCategoryDto categoryDto) {
        // 카테고리명 중복 체크
        if (categoryRepository.findByName(categoryDto.getName()).isPresent()) {
            throw new RuntimeException("이미 존재하는 카테고리명입니다: " + categoryDto.getName());
        }
        
        BoardCategory category = new BoardCategory();
        category.setName(categoryDto.getName());
        category.setDescription(categoryDto.getDescription());
        category.setDisplayOrder(categoryDto.getDisplayOrder());
        category.setIsActive(categoryDto.getIsActive());
        
        BoardCategory savedCategory = categoryRepository.save(category);
        return convertToDto(savedCategory);
    }
    
    /**
     * 카테고리 수정
     */
    public BoardCategoryDto updateCategory(Long id, BoardCategoryDto categoryDto) {
        BoardCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다. ID: " + id));
        
        // 카테고리명 중복 체크 (자신 제외)
        if (categoryRepository.findByNameAndIdNot(categoryDto.getName(), id).isPresent()) {
            throw new RuntimeException("이미 존재하는 카테고리명입니다: " + categoryDto.getName());
        }
        
        category.setName(categoryDto.getName());
        category.setDescription(categoryDto.getDescription());
        category.setDisplayOrder(categoryDto.getDisplayOrder());
        category.setIsActive(categoryDto.getIsActive());
        
        BoardCategory savedCategory = categoryRepository.save(category);
        return convertToDto(savedCategory);
    }
    
    /**
     * 카테고리 삭제
     */
    public void deleteCategory(Long id) {
        BoardCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다. ID: " + id));
        
        // 해당 카테고리에 게시판이 있는지 확인
        if (category.getBoards() != null && !category.getBoards().isEmpty()) {
            throw new RuntimeException("해당 카테고리에 게시판이 있어 삭제할 수 없습니다. 먼저 게시판을 다른 카테고리로 이동하거나 삭제해주세요.");
        }
        
        categoryRepository.delete(category);
    }
    
    /**
     * 카테고리 상태 토글
     */
    public BoardCategoryDto toggleCategoryStatus(Long id) {
        BoardCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다. ID: " + id));
        
        category.setIsActive(!category.getIsActive());
        BoardCategory savedCategory = categoryRepository.save(category);
        return convertToDto(savedCategory);
    }
    
    /**
     * 카테고리 ID로 조회
     */
    public BoardCategoryDto getCategoryById(Long id) {
        BoardCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("카테고리를 찾을 수 없습니다. ID: " + id));
        return convertToDto(category);
    }
    
    /**
     * Entity를 DTO로 변환
     */
    private BoardCategoryDto convertToDto(BoardCategory category) {
        BoardCategoryDto dto = new BoardCategoryDto();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setDescription(category.getDescription());
        dto.setDisplayOrder(category.getDisplayOrder());
        dto.setIsActive(category.getIsActive());
        dto.setBoardCount(category.getBoards() != null ? category.getBoards().size() : 0);
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        return dto;
    }
}