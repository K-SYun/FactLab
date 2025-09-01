package com.factlab.board.repository;

import com.factlab.board.entity.NoticeBoardMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeBoardMappingRepository extends JpaRepository<NoticeBoardMapping, Long> {

    // 특정 게시판에 연결된 공지사항 조회 (display_order 오름차순)
    List<NoticeBoardMapping> findByBoardIdOrderByDisplayOrderAsc(Long boardId);

    // 특정 공지사항(post_id)에 연결된 게시판 목록 조회
    List<NoticeBoardMapping> findByPostId(Long postId);

    // 특정 공지사항의 특정 게시판 매핑 존재 여부 확인
    boolean existsByPostIdAndBoardId(Long postId, Long boardId);

    // 특정 공지사항의 모든 게시판 매핑 삭제
    @Modifying
    @Query("DELETE FROM NoticeBoardMapping nbm WHERE nbm.postId = :postId")
    void deleteByPostId(@Param("postId") Long postId);

    // 특정 게시판의 모든 공지사항 매핑 삭제
    @Modifying
    @Query("DELETE FROM NoticeBoardMapping nbm WHERE nbm.boardId = :boardId")
    void deleteByBoardId(@Param("boardId") Long boardId);

    // 특정 공지사항의 특정 게시판 매핑 삭제
    @Modifying
    @Query("DELETE FROM NoticeBoardMapping nbm WHERE nbm.postId = :postId AND nbm.boardId = :boardId")
    void deleteByPostIdAndBoardId(@Param("postId") Long postId, @Param("boardId") Long boardId);

    // 게시판별 공지사항 개수 조회
    @Query("SELECT COUNT(nbm) FROM NoticeBoardMapping nbm WHERE nbm.boardId = :boardId")
    long countByBoardId(@Param("boardId") Long boardId);
}