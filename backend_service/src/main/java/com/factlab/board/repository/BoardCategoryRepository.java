package com.factlab.board.repository;

import com.factlab.board.entity.BoardCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoardCategoryRepository extends JpaRepository<BoardCategory, Long> {
    
    /**
     * 활성화된 카테고리 목록을 표시 순서대로 조회
     */
    List<BoardCategory> findByIsActiveTrueOrderByDisplayOrderAsc();
    
    /**
     * 모든 카테고리를 표시 순서대로 조회
     */
    List<BoardCategory> findAllByOrderByDisplayOrderAsc();
    
    /**
     * 카테고리명으로 조회
     */
    Optional<BoardCategory> findByName(String name);
    
    /**
     * 카테고리명으로 조회 (자신 제외)
     */
    Optional<BoardCategory> findByNameAndIdNot(String name, Long id);
}