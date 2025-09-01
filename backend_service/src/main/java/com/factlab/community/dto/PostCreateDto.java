package com.factlab.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public class PostCreateDto {
    
    @NotNull(message = "게시판 ID는 필수입니다.")
    private Long boardId;
    
    @NotBlank(message = "제목은 필수입니다.")
    @Size(min = 1, max = 200, message = "제목은 1자 이상 200자 이하여야 합니다.")
    private String title;
    
    @NotBlank(message = "내용은 필수입니다.")
    @Size(min = 1, max = 10000, message = "내용은 1자 이상 10000자 이하여야 합니다.")
    private String content;
    
    private Boolean isAnonymous = false; // 익명 게시글 여부
    
    private Boolean isNotice = false; // 공지사항 여부 (관리자만)
    
    private String noticeCategory; // 공지사항 카테고리 (ALL, IMPORTANT, EVENT, UPDATE)
    
    private List<Long> selectedBoardIds; // 중요 공지사항에서 선택된 게시판 ID 목록
    
    // Constructors
    public PostCreateDto() {}
    
    public PostCreateDto(Long boardId, String title, String content) {
        this.boardId = boardId;
        this.title = title;
        this.content = content;
    }
    
    // Getters and Setters
    public Long getBoardId() {
        return boardId;
    }
    
    public void setBoardId(Long boardId) {
        this.boardId = boardId;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public Boolean getIsAnonymous() {
        return isAnonymous;
    }
    
    public void setIsAnonymous(Boolean isAnonymous) {
        this.isAnonymous = isAnonymous;
    }
    
    public Boolean getIsNotice() {
        return isNotice;
    }
    
    public void setIsNotice(Boolean isNotice) {
        this.isNotice = isNotice;
    }
    
    public List<Long> getSelectedBoardIds() {
        return selectedBoardIds;
    }
    
    public void setSelectedBoardIds(List<Long> selectedBoardIds) {
        this.selectedBoardIds = selectedBoardIds;
    }
    
    public String getNoticeCategory() {
        return noticeCategory;
    }
    
    public void setNoticeCategory(String noticeCategory) {
        this.noticeCategory = noticeCategory;
    }
}