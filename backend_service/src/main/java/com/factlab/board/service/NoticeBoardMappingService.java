package com.factlab.board.service;

import com.factlab.board.entity.NoticeBoardMapping;
import com.factlab.board.entity.Board;
import com.factlab.board.repository.NoticeBoardMappingRepository;
import com.factlab.board.repository.BoardRepository;
import com.factlab.community.entity.Post;
import com.factlab.community.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NoticeBoardMappingService {

    @Autowired
    private NoticeBoardMappingRepository mappingRepository;
    
    @Autowired
    private BoardRepository boardRepository;
    
    @Autowired
    private PostRepository postRepository;

    /**
     * 공지사항을 특정 게시판들에 매핑
     */
    public void createMappings(Long postId, List<Long> boardIds) {
        // 기존 매핑 삭제
        mappingRepository.deleteByPostId(postId);
        
        // 새로운 매핑 생성
        for (int i = 0; i < boardIds.size(); i++) {
            Long boardId = boardIds.get(i);
            
            // 게시판 존재 여부 확인
            Board board = boardRepository.findById(boardId)
                    .orElseThrow(() -> new RuntimeException("게시판을 찾을 수 없습니다: " + boardId));
            
            if (board.getIsActive()) {
                NoticeBoardMapping mapping = new NoticeBoardMapping(postId, boardId, i + 1);
                mappingRepository.save(mapping);
            }
        }
    }

    /**
     * 공지사항에 매핑된 게시판 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Board> getMappedBoards(Long postId) {
        List<NoticeBoardMapping> mappings = mappingRepository.findByPostId(postId);
        
        return mappings.stream()
                .map(mapping -> boardRepository.findById(mapping.getBoardId()))
                .filter(boardOpt -> boardOpt.isPresent())
                .map(boardOpt -> boardOpt.get())
                .collect(Collectors.toList());
    }

    /**
     * 특정 게시판에 노출되는 공지사항 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Post> getNoticesForBoard(Long boardId) {
        List<NoticeBoardMapping> mappings = mappingRepository.findByBoardIdOrderByDisplayOrderAsc(boardId);
        
        return mappings.stream()
                .map(mapping -> postRepository.findById(mapping.getPostId()))
                .filter(postOpt -> postOpt.isPresent())
                .map(postOpt -> postOpt.get())
                .filter(post -> post.getIsNotice() && post.getStatus() == Post.PostStatus.ACTIVE)
                .collect(Collectors.toList());
    }

    /**
     * 모든 게시판에 노출되는 "전체" 및 "이벤트" 공지사항 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Post> getGlobalNotices() {
        // NoticeCategory가 ALL 또는 EVENT인 공지사항들 조회
        return postRepository.findByIsNoticeAndStatus(true, Post.PostStatus.ACTIVE, org.springframework.data.domain.Pageable.unpaged()).getContent()
                .stream()
                .filter(post -> post.getNoticeCategory() != null && 
                               (post.getNoticeCategory() == Post.NoticeCategory.ALL || 
                                post.getNoticeCategory() == Post.NoticeCategory.EVENT))
                .collect(Collectors.toList());
    }

    /**
     * 특정 게시판에 표시될 모든 공지사항 조회 (전체 + 중요)
     */
    @Transactional(readOnly = true)
    public List<Post> getAllNoticesForBoard(Long boardId) {
        List<Post> allNotices = new ArrayList<>();
        
        // 1. 전체 공지사항 추가
        allNotices.addAll(getGlobalNotices());
        
        // 2. 해당 게시판 전용 중요 공지사항 추가
        allNotices.addAll(getNoticesForBoard(boardId));
        
        // 중복 제거 및 정렬 (생성일 내림차순)
        return allNotices.stream()
                .distinct()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());
    }

    /**
     * 공지사항 매핑 삭제
     */
    public void deleteMappings(Long postId) {
        mappingRepository.deleteByPostId(postId);
    }
    
    /**
     * 공지사항 매핑 삭제 (기존 메소드명 호환성 유지)
     */
    public void removeNoticeMapping(Long postId) {
        mappingRepository.deleteByPostId(postId);
    }

    /**
     * 특정 게시판의 모든 공지사항 매핑 삭제
     */
    public void removeBoardMappings(Long boardId) {
        mappingRepository.deleteByBoardId(boardId);
    }
    
    /**
     * 공지사항 페이지 전용 공지사항 조회 (UPDATE 카테고리 포함)
     */
    @Transactional(readOnly = true)
    public List<Post> getNoticePageNotices() {
        // 모든 공지사항을 조회 (UPDATE 카테고리도 공지사항 페이지에는 노출)
        return postRepository.findByIsNoticeAndStatus(true, Post.PostStatus.ACTIVE, org.springframework.data.domain.Pageable.unpaged()).getContent()
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());
    }
}