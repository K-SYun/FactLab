package com.factlab.board.repository;

import com.factlab.board.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {
    
    /**
     * 활성화된 게시판 목록을 표시 순서대로 조회
     */
    List<Board> findByIsActiveTrueOrderByDisplayOrderAsc();
    
    /**
     * 모든 게시판을 표시 순서대로 조회 (관리자용)
     */
    List<Board> findAllByOrderByDisplayOrderAsc();
    
    /**
     * 카테고리별 활성화된 게시판 조회
     */
    List<Board> findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc(String category);
    
    /**
     * 게시판 이름으로 조회 (중복 체크용)
     */
    Optional<Board> findByName(String name);
    
    /**
     * 게시판 이름으로 조회 (ID 제외, 수정 시 중복 체크용)
     */
    Optional<Board> findByNameAndIdNot(String name, Long id);
    
    /**
     * 특정 표시 순서보다 큰 게시판들 조회
     */
    @Query("SELECT b FROM Board b WHERE b.displayOrder > :displayOrder ORDER BY b.displayOrder ASC")
    List<Board> findByDisplayOrderGreaterThanOrderByDisplayOrderAsc(Integer displayOrder);
    
    /**
     * 카테고리별 게시판 수 조회
     */
    Long countByCategory(String category);
    
    /**
     * 활성화된 게시판 수 조회
     */
    Long countByIsActiveTrue();
}
