package com.factlab.community.service;

import com.factlab.board.entity.Board;
import com.factlab.board.repository.BoardRepository;
import com.factlab.community.dto.*;
import com.factlab.community.entity.Post;
import com.factlab.community.entity.Post.PostStatus;
import com.factlab.community.repository.PostRepository;
import com.factlab.user.entity.User;
import com.factlab.user.repository.UserRepository;
import com.factlab.system.repository.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PostService {
    
    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private BoardRepository boardRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SystemSettingRepository systemSettingRepository;
    
    /**
     * 게시글 목록 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public Page<PostResponseDto> getPosts(Long boardId, Pageable pageable) {
        Page<Post> posts = postRepository.findByBoard_IdAndStatusOrderByIsNoticeDescCreatedAtDesc(
                boardId, PostStatus.ACTIVE, pageable);
        
        return posts.map(post -> new PostResponseDto(post, false, true)); // 목록용
    }
    
    /**
     * 게시글 상세 조회
     */
    @Transactional(readOnly = true)
    public PostResponseDto getPost(Long postId) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        // 조회수 증가는 임시로 비활성화 (트랜잭션 이슈로 인해)
        // TODO: 조회수 증가 기능 수정 필요
        // incrementViewCount(postId);
        
        return new PostResponseDto(post, true); // 댓글 포함
    }
    
    /**
     * 게시글 검색
     */
    @Transactional(readOnly = true)
    public Page<PostResponseDto> searchPosts(Long boardId, String keyword, Pageable pageable) {
        Page<Post> posts = postRepository.findByBoardIdAndStatusAndTitleOrContentContaining(
                boardId, PostStatus.ACTIVE, keyword, pageable);
        
        return posts.map(post -> new PostResponseDto(post, false, true));
    }
    
    /**
     * 인기 게시글 조회
     */
    @Transactional(readOnly = true)
    public Page<PostResponseDto> getPopularPosts(Long boardId, Pageable pageable) {
        Page<Post> posts = postRepository.findPopularPostsByBoardId(
                boardId, PostStatus.ACTIVE, pageable);
        
        return posts.map(post -> new PostResponseDto(post, false, true));
    }
    
    /**
     * 게시글 작성
     */
    public PostResponseDto createPost(PostCreateDto createDto, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        Board board = boardRepository.findById(createDto.getBoardId())
                .orElseThrow(() -> new RuntimeException("게시판을 찾을 수 없습니다."));
        
        if (!board.getIsActive()) {
            throw new RuntimeException("비활성화된 게시판입니다.");
        }
        
        Post post = new Post(board, user, createDto.getTitle(), createDto.getContent());
        post.setIsAnonymous(createDto.getIsAnonymous());
        post.setIsNotice(createDto.getIsNotice());
        post.setIpAddress(null); // IP 주소는 현재 설정하지 않음
        
        Post savedPost = postRepository.save(post);
        return new PostResponseDto(savedPost);
    }
    
    /**
     * 게시글 수정
     */
    public PostResponseDto updatePost(Long postId, PostUpdateDto updateDto, Long userId) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        // 작성자 확인
        if (!post.getUser().getId().equals(userId)) {
            throw new RuntimeException("게시글 수정 권한이 없습니다.");
        }
        
        post.setTitle(updateDto.getTitle());
        post.setContent(updateDto.getContent());
        post.setIsAnonymous(updateDto.getIsAnonymous());
        
        Post updatedPost = postRepository.save(post);
        return new PostResponseDto(updatedPost);
    }
    
    /**
     * 게시글 삭제
     */
    public void deletePost(Long postId, Long userId) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        // 작성자 확인
        if (!post.getUser().getId().equals(userId)) {
            throw new RuntimeException("게시글 삭제 권한이 없습니다.");
        }
        
        post.setStatus(PostStatus.DELETED);
        postRepository.save(post);
    }
    
    /**
     * 게시글 좋아요
     */
    public void likePost(Long postId) {
        postRepository.incrementLikeCount(postId);
    }
    
    /**
     * 게시글 좋아요 취소
     */
    public void unlikePost(Long postId) {
        postRepository.decrementLikeCount(postId);
    }
    
    /**
     * 조회수 증가
     */
    @Transactional
    public void incrementViewCount(Long postId) {
        postRepository.incrementViewCount(postId);
    }

    /**
     * 조회수 증가 (Controller에서 호출용)
     */
    @Transactional
    public void increaseViewCount(Long postId) {
        postRepository.incrementViewCount(postId);
    }
    
    /**
     * 댓글 수 업데이트
     */
    public void updateCommentCount(Long postId) {
        postRepository.updateCommentCount(postId);
    }
    
    /**
     * 사용자가 작성한 게시글 목록
     */
    @Transactional(readOnly = true)
    public Page<PostResponseDto> getUserPosts(Long userId, Pageable pageable) {
        Page<Post> posts = postRepository.findByUserIdAndStatusOrderByCreatedAtDesc(
                userId, PostStatus.ACTIVE, pageable);
        
        return posts.map(post -> new PostResponseDto(post, false, true));
    }
    
    /**
     * 최근 게시글 조회
     */
    @Transactional(readOnly = true)
    public List<PostResponseDto> getRecentPosts() {
        List<Post> posts = postRepository.findTop10ByStatusOrderByCreatedAtDesc(PostStatus.ACTIVE);
        
        return posts.stream()
                .map(post -> new PostResponseDto(post, false, true))
                .collect(Collectors.toList());
    }
    
    /**
     * BEST 게시글 조회 (관리자가 설정한 기준으로)
     */
    @Transactional(readOnly = true)
    public Page<PostResponseDto> getBestPosts(Pageable pageable) {
        // 시스템 설정에서 BEST 기준값 조회 (기본값: 조회수 100, 추천수 10)
        Integer minViewCount = 100;
        Integer minLikeCount = 10;
        
        try {
            minViewCount = systemSettingRepository.findSettingValueAsIntegerByKey("best.min_view_count").orElse(100);
            minLikeCount = systemSettingRepository.findSettingValueAsIntegerByKey("best.min_like_count").orElse(10);
        } catch (Exception e) {
            // 시스템 설정 테이블이 없거나 에러가 발생하면 기본값 사용
            System.out.println("시스템 설정 조회 실패, 기본값 사용: " + e.getMessage());
        }
        
        // 공지사항 게시판은 제외하고 조회
        Page<Post> posts = postRepository.findBestPostsExcludingNoticeBoard(
                PostStatus.ACTIVE, minViewCount, minLikeCount, pageable);
        
        return posts.map(post -> new PostResponseDto(post, false, true));
    }
    
    /**
     * BEST 게시판에서 제외/포함 토글 (관리자용)
     */
    public void toggleBestExclusion(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));
        
        Boolean currentStatus = post.getExcludedFromBest();
        postRepository.updateExcludedFromBest(postId, !currentStatus);
    }
}