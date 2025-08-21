package com.factlab.news.service;

import com.factlab.community.dto.CommentCreateDto;
import com.factlab.community.dto.CommentResponseDto;
import com.factlab.community.dto.CommentUpdateDto;
import com.factlab.news.entity.News;
import com.factlab.news.entity.NewsComment;
import com.factlab.news.entity.NewsComment.CommentStatus;
import com.factlab.news.repository.NewsCommentRepository;
import com.factlab.news.repository.NewsRepository;
import com.factlab.user.entity.User;
import com.factlab.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NewsCommentService {
    
    @Autowired
    private NewsCommentRepository newsCommentRepository;
    
    @Autowired
    private NewsRepository newsRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * 뉴스의 댓글 목록 조회 (계층 구조)
     */
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getNewsComments(Integer newsId) {
        List<NewsComment> comments = newsCommentRepository.findCommentsHierarchyByNewsId(
                newsId, CommentStatus.ACTIVE);
        
        return buildCommentTree(comments);
    }
    
    /**
     * 뉴스의 최상위 댓글만 조회
     */
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getTopLevelComments(Integer newsId) {
        List<NewsComment> comments = newsCommentRepository.findByNewsIdAndParentCommentIdIsNullAndStatusOrderByCreatedAtAsc(
                newsId, CommentStatus.ACTIVE);
        
        return comments.stream()
                .map(comment -> new CommentResponseDto(comment, true))
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 댓글의 대댓글 조회
     */
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getReplies(Long parentCommentId) {
        List<NewsComment> replies = newsCommentRepository.findByParentCommentIdAndStatusOrderByCreatedAtAsc(
                parentCommentId, CommentStatus.ACTIVE);
        
        return replies.stream()
                .map(CommentResponseDto::new)
                .collect(Collectors.toList());
    }
    
    /**
     * 뉴스 댓글 작성
     */
    public CommentResponseDto createNewsComment(CommentCreateDto createDto, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        News news = newsRepository.findById(createDto.getNewsId().intValue())
                .orElseThrow(() -> new RuntimeException("뉴스를 찾을 수 없습니다."));
                
        NewsComment comment;
        int depth = 0;
        
        // 대댓글인 경우
        if (createDto.isReply()) {
            NewsComment parentComment = newsCommentRepository.findByIdAndStatus(
                    createDto.getParentCommentId(), CommentStatus.ACTIVE)
                    .orElseThrow(() -> new RuntimeException("부모 댓글을 찾을 수 없습니다."));
            
            // 댓글 깊이 확인 (최대 3단계까지만 허용)
            if (!parentComment.canReply()) {
                throw new RuntimeException("더 이상 댓글을 달 수 없습니다. (최대 3단계)");
            }
            
            depth = parentComment.getDepth() + 1;
            comment = new NewsComment(news, parentComment, user, createDto.getContent(), depth);
        } else {
            // 일반 댓글
            comment = new NewsComment(news, user, createDto.getContent(), depth);
        }
        
        comment.setIsAnonymous(createDto.getIsAnonymous());
        NewsComment savedComment = newsCommentRepository.save(comment);
        
        // 부모 댓글의 답글 수 업데이트
        if (savedComment.getParentComment() != null) {
            newsCommentRepository.updateReplyCount(savedComment.getParentComment().getId());
        }
        
        return new CommentResponseDto(savedComment);
    }
    
    /**
     * 댓글 수정
     */
    public CommentResponseDto updateComment(Long commentId, CommentUpdateDto updateDto, Long userId) {
        NewsComment comment = newsCommentRepository.findByIdAndStatus(commentId, CommentStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        
        // 작성자 확인
        if (!comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("댓글 수정 권한이 없습니다.");
        }
        
        comment.setContent(updateDto.getContent());
        NewsComment updatedComment = newsCommentRepository.save(comment);
        
        return new CommentResponseDto(updatedComment);
    }
    
    /**
     * 댓글 삭제
     */
    public void deleteComment(Long commentId, Long userId) {
        NewsComment comment = newsCommentRepository.findByIdAndStatus(commentId, CommentStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        
        // 작성자 확인
        if (!comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("댓글 삭제 권한이 없습니다.");
        }
        
        // 대댓글이 있는지 확인
        Long replyCount = newsCommentRepository.countByParentCommentIdAndStatus(commentId, CommentStatus.ACTIVE);
        
        if (replyCount > 0) {
            // 대댓글이 있는 경우: 내용만 삭제 표시 (DELETED 상태로 변경)
            comment.setStatus(CommentStatus.DELETED);
            comment.setContent("작성자에 의해 글이 삭제되었습니다.");
            newsCommentRepository.save(comment);
        } else {
            // 대댓글이 없는 경우: 완전 삭제
            newsCommentRepository.deleteCommentAndReplies(commentId);
            
            // 부모 댓글의 답글 수 업데이트
            if (comment.getParentComment() != null) {
                newsCommentRepository.updateReplyCount(comment.getParentComment().getId());
            }
        }
    }
    
    /**
     * 댓글 좋아요
     */
    public void likeComment(Long commentId) {
        newsCommentRepository.incrementLikeCount(commentId);
    }
    
    /**
     * 댓글 좋아요 취소
     */
    public void unlikeComment(Long commentId) {
        newsCommentRepository.decrementLikeCount(commentId);
    }
    
    /**
     * 사용자가 작성한 뉴스 댓글 목록
     */
    @Transactional(readOnly = true)
    public Page<CommentResponseDto> getUserComments(Long userId, Pageable pageable) {
        Page<NewsComment> comments = newsCommentRepository.findByUserIdAndStatusOrderByCreatedAtDesc(
                userId, CommentStatus.ACTIVE, pageable);
        
        return comments.map(CommentResponseDto::new);
    }
    
    /**
     * 최근 뉴스 댓글 조회
     */
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getRecentComments() {
        List<NewsComment> comments = newsCommentRepository.findTop10ByStatusOrderByCreatedAtDesc(CommentStatus.ACTIVE);
        
        return comments.stream()
                .map(CommentResponseDto::new)
                .collect(Collectors.toList());
    }
    
    /**
     * 댓글 트리 구조 생성
     */
    private List<CommentResponseDto> buildCommentTree(List<NewsComment> comments) {
        List<CommentResponseDto> result = comments.stream()
                .filter(comment -> comment.getParentComment() == null)
                .map(comment -> new CommentResponseDto(comment, true))
                .collect(Collectors.toList());
        
        return result;
    }
}