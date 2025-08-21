package com.factlab.community.repository;

import com.factlab.community.entity.Post;
import com.factlab.community.entity.Post.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    
    /**
     * 게시판별 활성 게시글 목록 조회 (페이징)
     */
    Page<Post> findByBoard_IdAndStatusOrderByIsNoticeDescCreatedAtDesc(
            Long boardId, PostStatus status, Pageable pageable);
    
    /**
     * 게시판별 활성 게시글 개수 조회
     */
    Long countByBoard_IdAndStatus(Long boardId, PostStatus status);
    
    /**
     * 특정 게시글 조회 (활성 상태만)
     */
    Optional<Post> findByIdAndStatus(Long id, PostStatus status);
    
    /**
     * 사용자가 작성한 게시글 목록 조회
     */
    Page<Post> findByUserIdAndStatusOrderByCreatedAtDesc(
            Long userId, PostStatus status, Pageable pageable);
    
    /**
     * 게시글 제목 또는 내용으로 검색
     */
    @Query("SELECT p FROM Post p WHERE p.board.id = :boardId AND p.status = :status " +
           "AND (p.title LIKE %:keyword% OR p.content LIKE %:keyword%) " +
           "ORDER BY p.isNotice DESC, p.createdAt DESC")
    Page<Post> findByBoardIdAndStatusAndTitleOrContentContaining(
            @Param("boardId") Long boardId, 
            @Param("status") PostStatus status,
            @Param("keyword") String keyword, 
            Pageable pageable);
    
    /**
     * 인기 게시글 조회 (좋아요 + 댓글 수 기준)
     */
    @Query("SELECT p FROM Post p WHERE p.board.id = :boardId AND p.status = :status " +
           "ORDER BY (p.likeCount + p.commentCount) DESC, p.createdAt DESC")
    Page<Post> findPopularPostsByBoardId(
            @Param("boardId") Long boardId, 
            @Param("status") PostStatus status, 
            Pageable pageable);
    
    /**
     * 조회수 증가
     */
    @Modifying
    @Query("UPDATE Post p SET p.viewCount = p.viewCount + 1 WHERE p.id = :postId")
    void incrementViewCount(@Param("postId") Long postId);
    
    /**
     * 좋아요 수 증가
     */
    @Modifying
    @Query("UPDATE Post p SET p.likeCount = p.likeCount + 1 WHERE p.id = :postId")
    void incrementLikeCount(@Param("postId") Long postId);
    
    /**
     * 좋아요 수 감소
     */
    @Modifying
    @Query("UPDATE Post p SET p.likeCount = p.likeCount - 1 WHERE p.id = :postId AND p.likeCount > 0")
    void decrementLikeCount(@Param("postId") Long postId);
    
    /**
     * 댓글 수 업데이트
     */
    @Modifying
    @Query("UPDATE Post p SET p.commentCount = " +
           "(SELECT COUNT(c) FROM PostComment c WHERE c.post.id = p.id AND c.status = 'ACTIVE') " +
           "WHERE p.id = :postId")
    void updateCommentCount(@Param("postId") Long postId);
    
    /**
     * BEST 게시판 제외 상태 토글
     */
    @Modifying
    @Query("UPDATE Post p SET p.excludedFromBest = :excluded WHERE p.id = :postId")
    void updateExcludedFromBest(@Param("postId") Long postId, @Param("excluded") Boolean excluded);
    
    /**
     * 최근 게시글 조회 (전체 게시판)
     */
    List<Post> findTop10ByStatusOrderByCreatedAtDesc(PostStatus status);
    
    /**
     * BEST 게시글 조회 (공지사항 게시판 제외, 조회수/추천수 기준, BEST 제외 안된 글만)
     */
    @Query("SELECT p FROM Post p JOIN p.board b " +
           "WHERE p.status = :status " +
           "AND b.category <> '공지' " +
           "AND p.viewCount >= :minViewCount " +
           "AND p.likeCount >= :minLikeCount " +
           "AND p.excludedFromBest = false " +
           "ORDER BY (p.viewCount + p.likeCount * 2) DESC, p.createdAt DESC")
    Page<Post> findBestPostsExcludingNoticeBoard(
            @Param("status") PostStatus status,
            @Param("minViewCount") Integer minViewCount,
            @Param("minLikeCount") Integer minLikeCount,
            Pageable pageable);
}