package com.factlab.community.service;

import com.factlab.community.dto.CommentCreateDto;
import com.factlab.community.dto.CommentResponseDto;
import com.factlab.community.dto.CommentUpdateDto;
import com.factlab.community.entity.Post;
import com.factlab.community.entity.PostComment;
import com.factlab.community.entity.PostComment.CommentStatus;
import com.factlab.community.repository.PostCommentRepository;
import com.factlab.community.repository.PostRepository;
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
public class PostCommentService {
    
    @Autowired
    private PostCommentRepository postCommentRepository;
    
    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PostService postService;
    
    /**
     * 게시글의 댓글 목록 조회 (계층 구조)
     */
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getComments(Long postId) {
        List<PostComment> comments = postCommentRepository.findCommentsHierarchyByPostId(
                postId, CommentStatus.ACTIVE);
        
        return buildCommentTree(comments);
    }
    
    /**
     * 최상위 댓글만 조회
     */
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getTopLevelComments(Long postId) {
        List<PostComment> comments = postCommentRepository.findByPostIdAndParentCommentIdIsNullAndStatusOrderByCreatedAtAsc(
                postId, CommentStatus.ACTIVE);
        
        return comments.stream()
                .map(comment -> new CommentResponseDto(comment, true))
                .collect(Collectors.toList());
    }
    
    /**
     * 특정 댓글의 대댓글 조회
     */
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getReplies(Long parentCommentId) {
        List<PostComment> replies = postCommentRepository.findByParentCommentIdAndStatusOrderByCreatedAtAsc(
                parentCommentId, CommentStatus.ACTIVE);
        
        return replies.stream()
                .map(CommentResponseDto::new)
                .collect(Collectors.toList());
    }
    
    /**
     * 댓글 작성
     */
    public CommentResponseDto createComment(CommentCreateDto createDto, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        Post post = postRepository.findById(createDto.getPostId())
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
                
        PostComment comment;
        int depth = 0;
        
        // 대댓글인 경우
        if (createDto.isReply()) {
            PostComment parentComment = postCommentRepository.findByIdAndStatus(
                    createDto.getParentCommentId(), CommentStatus.ACTIVE)
                    .orElseThrow(() -> new RuntimeException("부모 댓글을 찾을 수 없습니다."));
            
            // 댓글 깊이 확인 (최대 3단계까지만 허용)
            if (!parentComment.canReply()) {
                throw new RuntimeException("더 이상 댓글을 달 수 없습니다. (최대 3단계)");
            }
            
            depth = parentComment.getDepth() + 1;
            comment = new PostComment(post, parentComment, user, createDto.getContent(), depth);
        } else {
            // 일반 댓글
            comment = new PostComment(post, user, createDto.getContent(), depth);
        }
        
        comment.setIsAnonymous(createDto.getIsAnonymous());
        PostComment savedComment = postCommentRepository.save(comment);
        
        // 부모 댓글의 답글 수 업데이트
        if (savedComment.getParentComment() != null) {
            postCommentRepository.updateReplyCount(savedComment.getParentComment().getId());
        }
        
        // 게시글의 댓글 수 업데이트
        postService.updateCommentCount(post.getId());
        
        return new CommentResponseDto(savedComment);
    }
    
    /**
     * 댓글 수정
     */
    public CommentResponseDto updateComment(Long commentId, CommentUpdateDto updateDto, Long userId) {
        PostComment comment = postCommentRepository.findByIdAndStatus(commentId, CommentStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        
        // 작성자 확인
        if (!comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("댓글 수정 권한이 없습니다.");
        }
        
        comment.setContent(updateDto.getContent());
        PostComment updatedComment = postCommentRepository.save(comment);
        
        return new CommentResponseDto(updatedComment);
    }
    
    /**
     * 댓글 삭제
     */
    public void deleteComment(Long commentId, Long userId) {
        PostComment comment = postCommentRepository.findByIdAndStatus(commentId, CommentStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        
        // 작성자 확인
        if (!comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("댓글 삭제 권한이 없습니다.");
        }
        
        // 대댓글이 있는 경우 대댓글도 함께 삭제
        postCommentRepository.deleteCommentAndReplies(commentId);
        
        // 부모 댓글의 답글 수 업데이트
        if (comment.getParentComment() != null) {
            postCommentRepository.updateReplyCount(comment.getParentComment().getId());
        }
        
        // 게시글의 댓글 수 업데이트
        postService.updateCommentCount(comment.getPost().getId());
    }
    
    /**
     * 댓글 좋아요
     */
    public void likeComment(Long commentId, Long userId) {
        PostComment comment = postCommentRepository.findByIdAndStatus(commentId, CommentStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다."));
        
        // 본인 댓글 추천 방지
        if (comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("본인 댓글에는 추천할 수 없습니다.");
        }
        
        postCommentRepository.incrementLikeCount(commentId);
    }
    
    /**
     * 댓글 좋아요 취소
     */
    public void unlikeComment(Long commentId) {
        postCommentRepository.decrementLikeCount(commentId);
    }
    
    /**
     * 사용자가 작성한 댓글 목록
     */
    @Transactional(readOnly = true)
    public Page<CommentResponseDto> getUserComments(Long userId, Pageable pageable) {
        Page<PostComment> comments = postCommentRepository.findByUserIdAndStatusOrderByCreatedAtDesc(
                userId, CommentStatus.ACTIVE, pageable);
        
        return comments.map(CommentResponseDto::new);
    }
    
    /**
     * 최근 댓글 조회
     */
    @Transactional(readOnly = true)
    public List<CommentResponseDto> getRecentComments() {
        List<PostComment> comments = postCommentRepository.findTop10ByStatusOrderByCreatedAtDesc(CommentStatus.ACTIVE);
        
        return comments.stream()
                .map(CommentResponseDto::new)
                .collect(Collectors.toList());
    }
    
    /**
     * 댓글 트리 구조 생성
     */
    private List<CommentResponseDto> buildCommentTree(List<PostComment> comments) {
        List<CommentResponseDto> result = comments.stream()
                .filter(comment -> comment.getParentComment() == null)
                .map(comment -> new CommentResponseDto(comment, true))
                .collect(Collectors.toList());
        
        return result;
    }
}