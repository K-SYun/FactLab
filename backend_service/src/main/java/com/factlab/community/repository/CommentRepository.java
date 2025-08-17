package com.factlab.community.repository;

import com.factlab.community.entity.Comment;
import com.factlab.community.entity.Comment.CommentStatus;
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
public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    /**
     * 게시글의 최상위 댓글 조회 (depth = 0)
     */
    List<Comment> findByPostIdAndParentCommentIdIsNullAndStatusOrderByCreatedAtAsc(
            Long postId, CommentStatus status);
    
    /**
     * 특정 댓글의 대댓글 조회
     */
    List<Comment> findByParentCommentIdAndStatusOrderByCreatedAtAsc(
            Long parentCommentId, CommentStatus status);
    
    /**
     * 게시글의 전체 댓글 조회 (계층 구조 포함)
     */
    @Query("SELECT c FROM Comment c " +
           "WHERE c.post.id = :postId AND c.status = :status " +
           "ORDER BY " +
           "CASE WHEN c.parentComment IS NULL THEN c.id ELSE c.parentComment.id END ASC, " +
           "c.depth ASC, c.createdAt ASC")
    List<Comment> findCommentsHierarchyByPostId(
            @Param("postId") Long postId, 
            @Param("status") CommentStatus status);
    
    /**
     * 뉴스의 전체 댓글 조회 (계층 구조 포함)
     */
    @Query("SELECT c FROM Comment c " +
           "LEFT JOIN FETCH c.user " +
           "WHERE c.news.id = :newsId AND c.status = :status " +
           "ORDER BY " +
           "CASE WHEN c.parentComment IS NULL THEN c.id ELSE c.parentComment.id END ASC, " +
           "c.depth ASC, c.createdAt ASC")
    List<Comment> findCommentsHierarchyByNewsId(
            @Param("newsId") Long newsId, 
            @Param("status") CommentStatus status);
    
    /**
     * 특정 댓글 조회 (활성 상태만)
     */
    Optional<Comment> findByIdAndStatus(Long id, CommentStatus status);
    
    /**
     * 사용자가 작성한 댓글 목록 조회
     */
    Page<Comment> findByUserIdAndStatusOrderByCreatedAtDesc(
            Long userId, CommentStatus status, Pageable pageable);
    
    /**
     * 게시글별 댓글 개수 조회 (활성 상태만)
     */
    Long countByPostIdAndStatus(Long postId, CommentStatus status);
    
    /**
     * 부모 댓글의 대댓글 개수 조회
     */
    Long countByParentCommentIdAndStatus(Long parentCommentId, CommentStatus status);
    
    /**
     * 댓글 좋아요 수 증가
     */
    @Modifying
    @Query("UPDATE Comment c SET c.likeCount = c.likeCount + 1 WHERE c.id = :commentId")
    void incrementLikeCount(@Param("commentId") Long commentId);
    
    /**
     * 댓글 좋아요 수 감소
     */
    @Modifying
    @Query("UPDATE Comment c SET c.likeCount = c.likeCount - 1 WHERE c.id = :commentId AND c.likeCount > 0")
    void decrementLikeCount(@Param("commentId") Long commentId);
    
    /**
     * 부모 댓글의 답글 수 업데이트
     */
    @Modifying
    @Query("UPDATE Comment c SET c.replyCount = " +
           "(SELECT COUNT(reply) FROM Comment reply WHERE reply.parentComment.id = c.id AND reply.status = 'ACTIVE') " +
           "WHERE c.id = :commentId")
    void updateReplyCount(@Param("commentId") Long commentId);
    
    /**
     * 게시글의 모든 댓글 삭제 (소프트 삭제)
     */
    @Modifying
    @Query("UPDATE Comment c SET c.status = 'DELETED' WHERE c.post.id = :postId")
    void deleteAllByPostId(@Param("postId") Long postId);
    
    /**
     * 특정 댓글과 모든 하위 댓글 삭제 (소프트 삭제)
     */
    @Modifying
    @Query("UPDATE Comment c SET c.status = 'DELETED' " +
           "WHERE c.id = :commentId OR c.parentComment.id = :commentId")
    void deleteCommentAndReplies(@Param("commentId") Long commentId);
    
    /**
     * 최근 댓글 조회
     */
    List<Comment> findTop10ByStatusOrderByCreatedAtDesc(CommentStatus status);
}