package com.factlab.community.service;

import com.factlab.board.entity.Board;
import com.factlab.board.repository.BoardRepository;
import com.factlab.board.dto.BoardResponseDto;
import com.factlab.community.dto.*;
import com.factlab.community.entity.Post;
import com.factlab.community.entity.Post.PostStatus;
import com.factlab.community.repository.PostRepository;
import com.factlab.admin.entity.AdminUser;
import com.factlab.admin.repository.AdminUserRepository;
import com.factlab.user.entity.User;
import com.factlab.user.repository.UserRepository;
import com.factlab.system.repository.SystemSettingRepository;
import com.factlab.board.service.NoticeBoardMappingService;
import com.factlab.community.entity.Post.NoticeCategory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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
    private AdminUserRepository adminUserRepository;
    
    @Autowired
    private SystemSettingRepository systemSettingRepository;
    
    @Autowired
    private NoticeBoardMappingService noticeBoardMappingService;
    
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
        System.out.println("=== createPost 메소드 호출됨 === userId: " + userId);
        System.out.println("isNotice: " + createDto.getIsNotice());
        
        // 공지사항인 경우 공지사항 게시판을 사용하고 관리자 권한으로 처리
        if (createDto.getIsNotice() != null && createDto.getIsNotice()) {
            System.out.println("공지사항 처리 모드 - 공지사항 게시판으로 변경");
            Board noticeBoard = boardRepository.findByName("공지사항")
                    .orElseThrow(() -> new RuntimeException("공지사항 게시판을 찾을 수 없습니다."));
            
            if (!noticeBoard.getIsActive()) {
                throw new RuntimeException("공지사항 게시판이 비활성화되었습니다.");
            }
            
            Post post = new Post();
            post.setBoard(noticeBoard);
            post.setUser(null); // 관리자 공지사항은 User와 연결하지 않음
            post.setTitle(createDto.getTitle());
            post.setContent(createDto.getContent());
            post.setAuthor("관리자");
            post.setIsNotice(true);
            post.setIsAnonymous(false);
            
            Post savedPost = postRepository.save(post);
            
            // 중요 공지사항인 경우 게시판 매핑 생성
            if (createDto.getSelectedBoardIds() != null && !createDto.getSelectedBoardIds().isEmpty()) {
                System.out.println("매핑 생성: " + createDto.getSelectedBoardIds());
                noticeBoardMappingService.createMappings(savedPost.getId(), createDto.getSelectedBoardIds());
            }
            
            return new PostResponseDto(savedPost, true);
        }
        
        // 일반 게시글 처리
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
    
    // ===== 공지사항 관련 메서드들 =====
    
    /**
     * 공지사항 목록 조회
     */
    @Transactional(readOnly = true)
    public Page<PostResponseDto> getNotices(Pageable pageable) {
        Page<Post> notices = postRepository.findByIsNoticeAndStatus(true, PostStatus.ACTIVE, pageable);
        return notices.map(post -> new PostResponseDto(post, false, true));
    }
    
    /**
     * 활성화된 공지사항 목록 조회 (사용자용)
     */
    @Transactional(readOnly = true)
    public Page<PostResponseDto> getActiveNotices(Pageable pageable) {
        Page<Post> notices = postRepository.findByIsNoticeAndStatus(true, PostStatus.ACTIVE, pageable);
        return notices.map(post -> new PostResponseDto(post, false, true));
    }
    
    /**
     * 특정 게시판의 공지사항 조회 (게시판 상단 표시용)
     */
    @Transactional(readOnly = true)
    public Page<PostResponseDto> getBoardNotices(Long boardId, Pageable pageable) {
        Page<Post> notices = postRepository.findByBoard_IdAndIsNoticeAndStatusOrderByCreatedAtDesc(
                boardId, true, PostStatus.ACTIVE, pageable);
        return notices.map(post -> new PostResponseDto(post, false, true));
    }
    
    /**
     * 공지사항 작성 (관리자용) - 카테고리별 분류 및 게시판 매핑
     */
    public PostResponseDto createNotice(PostCreateDto createDto, Long adminId) {
        System.out.println("=== createNotice 메소드 호출됨 === adminId: " + adminId);
        AdminUser admin = adminUserRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("관리자를 찾을 수 없습니다."));
        
        // 공지사항 게시판 조회 (공지사항은 항상 공지사항 전용 게시판에 저장)
        Board noticeBoard = boardRepository.findByName("공지사항")
                .orElseThrow(() -> new RuntimeException("공지사항 게시판을 찾을 수 없습니다."));
        
        if (!noticeBoard.getIsActive()) {
            throw new RuntimeException("공지사항 게시판이 비활성화되었습니다.");
        }
        
        // NoticeCategory 파싱 및 기본값 설정
        NoticeCategory category;
        try {
            if (createDto.getNoticeCategory() != null && !createDto.getNoticeCategory().trim().isEmpty()) {
                category = NoticeCategory.valueOf(createDto.getNoticeCategory().toUpperCase());
            } else {
                category = NoticeCategory.ALL; // 기본값
            }
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("올바르지 않은 공지사항 카테고리입니다: " + createDto.getNoticeCategory());
        }
        
        System.out.println("공지사항 카테고리: " + category);
        
        // 관리자가 작성한 공지사항은 User 객체를 null로 설정하고 author를 '관리자'로 표시
        Post notice = new Post();
        notice.setBoard(noticeBoard);
        notice.setUser(null); // 관리자 공지사항은 User와 연결하지 않음
        notice.setTitle(createDto.getTitle());
        notice.setContent(createDto.getContent());
        notice.setAuthor("관리자"); // 작성자를 '관리자'로 설정
        notice.setIsNotice(true); // 공지사항으로 설정
        notice.setIsAnonymous(false); // 공지사항은 익명 불가
        notice.setNoticeCategory(category); // 카테고리 설정
        
        // 디버깅: 저장하기 전 Board 정보 확인
        System.out.println("=== 공지사항 생성 디버깅 ===");
        System.out.println("noticeBoard.getId(): " + noticeBoard.getId());
        System.out.println("noticeBoard.getName(): " + noticeBoard.getName());
        System.out.println("notice.getBoard().getId(): " + (notice.getBoard() != null ? notice.getBoard().getId() : "null"));
        System.out.println("notice.getNoticeCategory(): " + notice.getNoticeCategory());
        
        Post savedNotice = postRepository.save(notice);
        
        // 디버깅: 저장 후 확인
        System.out.println("savedNotice.getBoard().getId(): " + (savedNotice.getBoard() != null ? savedNotice.getBoard().getId() : "null"));
        System.out.println("savedNotice.getNoticeCategory(): " + savedNotice.getNoticeCategory());
        System.out.println("=== 디버깅 끝 ===");
        
        // 카테고리별 게시판 매핑 처리
        handleNoticeCategoryMapping(savedNotice, createDto, category);
        
        return new PostResponseDto(savedNotice, true);
    }
    
    /**
     * 공지사항 카테고리별 게시판 매핑 처리
     */
    private void handleNoticeCategoryMapping(Post savedNotice, PostCreateDto createDto, NoticeCategory category) {
        switch (category) {
            case ALL:
            case EVENT:
                // 전체, 이벤트: 모든 활성화된 사용자 게시판에 매핑
                List<Board> activeBoards = boardRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
                List<Long> activeBoardIds = activeBoards.stream()
                        .filter(board -> !"공지사항".equals(board.getName())) // 공지사항 게시판 제외
                        .map(Board::getId)
                        .collect(Collectors.toList());
                
                if (!activeBoardIds.isEmpty()) {
                    System.out.println("전체/이벤트 매핑 생성: " + activeBoardIds);
                    noticeBoardMappingService.createMappings(savedNotice.getId(), activeBoardIds);
                }
                break;
                
            case IMPORTANT:
                // 중요: 관리자가 지정한 특정 게시판에만 매핑
                if (createDto.getSelectedBoardIds() != null && !createDto.getSelectedBoardIds().isEmpty()) {
                    System.out.println("중요 공지사항 매핑 생성: " + createDto.getSelectedBoardIds());
                    noticeBoardMappingService.createMappings(savedNotice.getId(), createDto.getSelectedBoardIds());
                } else {
                    System.out.println("중요 공지사항이지만 선택된 게시판이 없습니다.");
                }
                break;
                
            case UPDATE:
                // 업데이트: 공지사항 페이지에만 노출, 사용자 게시판에는 매핑하지 않음
                System.out.println("업데이트 공지사항: 게시판 매핑 생성하지 않음");
                break;
                
            default:
                System.out.println("알 수 없는 카테고리: " + category);
                break;
        }
    }
    
    
    /**
     * 공지사항 수정 (관리자용)
     */
    public PostResponseDto updateNotice(Long noticeId, PostUpdateDto updateDto, Long adminId) {
        Post notice = postRepository.findById(noticeId)
                .orElseThrow(() -> new RuntimeException("공지사항을 찾을 수 없습니다."));
        
        if (!notice.getIsNotice()) {
            throw new RuntimeException("해당 게시글은 공지사항이 아닙니다.");
        }
        
        // 관리자 권한 확인 - 공지사항은 User가 null이므로 adminId만 확인
        AdminUser admin = adminUserRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("관리자를 찾을 수 없습니다."));
        
        notice.setTitle(updateDto.getTitle());
        notice.setContent(updateDto.getContent());
        
        // 카테고리 업데이트
        if (updateDto.getNoticeCategory() != null && !updateDto.getNoticeCategory().trim().isEmpty()) {
            try {
                NoticeCategory category = NoticeCategory.valueOf(updateDto.getNoticeCategory().toUpperCase());
                notice.setNoticeCategory(category);
                System.out.println("공지사항 카테고리 업데이트: " + category);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("올바르지 않은 공지사항 카테고리입니다: " + updateDto.getNoticeCategory());
            }
        }
        
        Post savedNotice = postRepository.save(notice);
        
        // 기존 매핑 삭제 후 카테고리에 따른 새로운 매핑 생성
        noticeBoardMappingService.deleteMappings(savedNotice.getId());
        
        // 카테고리별 매핑 처리
        if (savedNotice.getNoticeCategory() != null) {
            PostCreateDto tempDto = new PostCreateDto();
            tempDto.setSelectedBoardIds(updateDto.getSelectedBoardIds());
            handleNoticeCategoryMapping(savedNotice, tempDto, savedNotice.getNoticeCategory());
        }
        
        return new PostResponseDto(savedNotice, true);
    }
    
    /**
     * 공지사항 삭제 (관리자용)
     */
    public void deleteNotice(Long noticeId, Long adminId) {
        Post notice = postRepository.findById(noticeId)
                .orElseThrow(() -> new RuntimeException("공지사항을 찾을 수 없습니다."));
        
        if (!notice.getIsNotice()) {
            throw new RuntimeException("해당 게시글은 공지사항이 아닙니다.");
        }
        
        // 관리자 권한 확인 (실제로는 더 정교한 권한 체크 필요)
        // 임시로 모든 관리자가 삭제 가능하도록 처리
        
        // 공지사항 매핑 삭제
        noticeBoardMappingService.removeNoticeMapping(noticeId);
        
        notice.setStatus(PostStatus.DELETED);
        postRepository.save(notice);
    }
    
    /**
     * 공지사항 상태 토글 (관리자용)
     */
    public PostResponseDto toggleNoticeStatus(Long noticeId, Long adminId) {
        Post notice = postRepository.findById(noticeId)
                .orElseThrow(() -> new RuntimeException("공지사항을 찾을 수 없습니다."));
        
        if (!notice.getIsNotice()) {
            throw new RuntimeException("해당 게시글은 공지사항이 아닙니다.");
        }
        
        // 상태 토글 (ACTIVE <-> HIDDEN)
        PostStatus newStatus = notice.getStatus() == PostStatus.ACTIVE ? PostStatus.HIDDEN : PostStatus.ACTIVE;
        notice.setStatus(newStatus);
        
        Post savedNotice = postRepository.save(notice);
        return new PostResponseDto(savedNotice, true);
    }
    
    /**
     * 공지사항 핀(상단 고정) 토글 (관리자용)
     * 이미 isNotice가 상단 고정 역할을 하므로, 필요시 추가 필드 구현
     */
    public PostResponseDto toggleNoticePin(Long noticeId, Long adminId) {
        Post notice = postRepository.findById(noticeId)
                .orElseThrow(() -> new RuntimeException("공지사항을 찾을 수 없습니다."));
        
        if (!notice.getIsNotice()) {
            throw new RuntimeException("해당 게시글은 공지사항이 아닙니다.");
        }
        
        // 현재는 isNotice 필드로 상단 고정을 처리
        // 향후 별도의 isPinned 필드 추가 시 해당 필드 토글
        // notice.setIsPinned(!notice.getIsPinned());
        
        Post savedNotice = postRepository.save(notice);
        return new PostResponseDto(savedNotice, true);
    }
    
    /**
     * 활성화된 게시판 목록 조회 (공지사항 등록용)
     */
    @Transactional(readOnly = true)
    public List<BoardResponseDto> getAllActiveBoards() {
        List<Board> boards = boardRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        
        return boards.stream()
                .map(board -> new BoardResponseDto(
                        board.getId(),
                        board.getName(),
                        board.getDescription(),
                        board.getCategory(),
                        board.getIsActive(),
                        board.getDisplayOrder(),
                        0 // postCount는 필요 시 추가 구현
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PostResponseDto> getPostsWithNotices(Long boardId, Pageable pageable) {
        // 카테고리 기반 공지사항 시스템 사용
        List<Post> notices = noticeBoardMappingService.getAllNoticesForBoard(boardId);
        Page<Post> regularPosts = postRepository.findByBoard_IdAndIsNoticeFalseAndStatusOrderByCreatedAtDesc(boardId, PostStatus.ACTIVE, pageable);
        
        System.out.println("=== 게시판 " + boardId + " 공지사항 조회 ===");
        System.out.println("공지사항 개수: " + notices.size());
        for (Post notice : notices) {
            System.out.println("- " + notice.getTitle() + " (카테고리: " + notice.getNoticeCategory() + ")");
        }
        
        // 공지사항을 PostResponseDto로 변환
        List<PostResponseDto> noticeDtos = notices.stream()
                .map(this::convertToPostResponseDto)
                .collect(Collectors.toList());
        
        // 일반 게시글을 PostResponseDto로 변환
        List<PostResponseDto> regularPostDtos = regularPosts.getContent().stream()
                .map(this::convertToPostResponseDto)
                .collect(Collectors.toList());
        
        // 공지사항을 맨 앞에 추가
        List<PostResponseDto> allPosts = new ArrayList<>();
        allPosts.addAll(noticeDtos);
        allPosts.addAll(regularPostDtos);
        
        return new PageImpl<>(allPosts, pageable, regularPosts.getTotalElements() + notices.size());
    }

    private PostResponseDto convertToPostResponseDto(Post post) {
        return new PostResponseDto(post);
    }
}