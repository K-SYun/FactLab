package com.factlab.news.repository;

import com.factlab.news.entity.NewsComment;
import com.factlab.news.entity.NewsComment.CommentStatus;
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
public interface NewsCommentRepository extends JpaRepository<NewsComment, Long> {
    
    /**
     * 뉴스의 최상위 댓글 조회 (depth = 0)
     */
    List<NewsComment> findByNewsIdAndParentCommentIdIsNullAndStatusOrderByCreatedAtAsc(
            Integer newsId, CommentStatus status);
    
    /**
     * 특정 댓글의 대댓글 조회
     */
    List<NewsComment> findByParentCommentIdAndStatusOrderByCreatedAtAsc(
            Long parentCommentId, CommentStatus status);
    
    /**
     * 뉴스의 전체 댓글 조회 (계층 구조 포함)
     */
    @Query("SELECT c FROM NewsComment c " +
           "LEFT JOIN FETCH c.user " +
           "WHERE c.news.id = :newsId AND c.status = :status " +
           "ORDER BY " +
           "CASE WHEN c.parentComment IS NULL THEN c.id ELSE c.parentComment.id END ASC, " +
           "c.depth ASC, c.createdAt ASC")
    List<NewsComment> findCommentsHierarchyByNewsId(
            @Param("newsId") Integer newsId, 
            @Param("status") CommentStatus status);
    
    /**
     * 뉴스의 전체 댓글 조회 (삭제된 댓글 포함, 대댓글이 있는 경우에만)
     */
    @Query("SELECT c FROM NewsComment c " +
           "LEFT JOIN FETCH c.user " +
           "WHERE c.news.id = :newsId AND (c.status = 'ACTIVE' OR " +
           "(c.status = 'DELETED' AND EXISTS (SELECT r FROM NewsComment r WHERE r.parentComment.id = c.id AND r.status = 'ACTIVE'))) " +
           "ORDER BY " +
           "CASE WHEN c.parentComment IS NULL THEN c.id ELSE c.parentComment.id END ASC, " +
           "c.depth ASC, c.createdAt ASC")
    List<NewsComment> findCommentsHierarchyByNewsIdIncludeDeleted(@Param("newsId") Integer newsId);
    
    /**
     * 특정 댓글 조회 (활성 상태만)
     */
    Optional<NewsComment> findByIdAndStatus(Long id, CommentStatus status);
    
    /**
     * 사용자가 작성한 댓글 목록 조회
     */
    Page<NewsComment> findByUserIdAndStatusOrderByCreatedAtDesc(
            Long userId, CommentStatus status, Pageable pageable);
    
    /**
     * 뉴스별 댓글 개수 조회 (활성 상태만)
     */
    Long countByNewsIdAndStatus(Integer newsId, CommentStatus status);
    
    /**
     * 부모 댓글의 대댓글 개수 조회
     */
    Long countByParentCommentIdAndStatus(Long parentCommentId, CommentStatus status);
    
    /**
     * 댓글 좋아요 수 증가
     */
    @Modifying
    @Query("UPDATE NewsComment c SET c.likeCount = c.likeCount + 1 WHERE c.id = :commentId")
    void incrementLikeCount(@Param("commentId") Long commentId);
    
    /**
     * 댓글 좋아요 수 감소
     */
    @Modifying
    @Query("UPDATE NewsComment c SET c.likeCount = c.likeCount - 1 WHERE c.id = :commentId AND c.likeCount > 0")
    void decrementLikeCount(@Param("commentId") Long commentId);
    
    /**
     * 부모 댓글의 답글 수 업데이트
     */
    @Modifying
    @Query("UPDATE NewsComment c SET c.replyCount = " +
           "(SELECT COUNT(reply) FROM NewsComment reply WHERE reply.parentComment.id = c.id AND reply.status = 'ACTIVE') " +
           "WHERE c.id = :commentId")
    void updateReplyCount(@Param("commentId") Long commentId);
    
    /**
     * 뉴스의 모든 댓글 삭제 (소프트 삭제)
     */
    @Modifying
    @Query("UPDATE NewsComment c SET c.status = 'DELETED' WHERE c.news.id = :newsId")
    void deleteAllByNewsId(@Param("newsId") Integer newsId);
    
    /**
     * 특정 댓글과 모든 하위 댓글 삭제 (소프트 삭제)
     */
    @Modifying
    @Query("UPDATE NewsComment c SET c.status = 'DELETED' " +
           "WHERE c.id = :commentId OR c.parentComment.id = :commentId")
    void deleteCommentAndReplies(@Param("commentId") Long commentId);
    
    /**
     * 최근 댓글 조회
     */
    List<NewsComment> findTop10ByStatusOrderByCreatedAtDesc(CommentStatus status);
}