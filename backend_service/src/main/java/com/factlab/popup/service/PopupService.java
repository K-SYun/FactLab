package com.factlab.popup.service;

import com.factlab.popup.dto.PopupCreateDto;
import com.factlab.popup.dto.PopupDto;
import com.factlab.popup.entity.Popup;
import com.factlab.popup.repository.PopupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PopupService {

    @Autowired
    private PopupRepository popupRepository;

    // 전체 팝업 목록 조회
    public List<PopupDto> getAllPopups() {
        return popupRepository.findAllOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 페이징된 팝업 목록 조회
    public List<PopupDto> getAllPopups(int page, int size) {
        return popupRepository.findAllOrderByCreatedAtDesc(page * size, size)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 활성화된 팝업 목록 조회
    public List<PopupDto> getActivePopups() {
        return popupRepository.findActivePopups()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 현재 표시되어야 하는 팝업 목록 조회 (사용자 화면용)
    public List<PopupDto> getDisplayPopups() {
        LocalDateTime now = LocalDateTime.now();
        return popupRepository.findActivePopupsForDisplay(now)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 팝업 상세 조회
    public Optional<PopupDto> getPopupById(Integer id) {
        return popupRepository.findById(id)
                .map(this::convertToDto);
    }

    // 팝업 생성
    public PopupDto createPopup(PopupCreateDto createDto, String createdBy) {
        Popup popup = new Popup();
        popup.setTitle(createDto.getTitle());
        popup.setContent(createDto.getContent());
        popup.setLinkUrl(createDto.getLinkUrl());
        popup.setLinkText(createDto.getLinkText());
        popup.setStartDate(createDto.getStartDate());
        popup.setEndDate(createDto.getEndDate());
        
        // 위치 설정
        try {
            popup.setPosition(Popup.PopupPosition.valueOf(createDto.getPosition().toUpperCase()));
        } catch (IllegalArgumentException e) {
            popup.setPosition(Popup.PopupPosition.CENTER);
        }
        
        popup.setPositionX(createDto.getPositionX());
        popup.setPositionY(createDto.getPositionY());
        popup.setActive(createDto.getActive() != null ? createDto.getActive() : true);
        popup.setCreatedBy(createdBy);

        popup = popupRepository.save(popup);
        return convertToDto(popup);
    }

    // 팝업 수정
    public PopupDto updatePopup(Integer id, PopupCreateDto updateDto, String updatedBy) {
        Popup popup = popupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("팝업을 찾을 수 없습니다: " + id));

        popup.setTitle(updateDto.getTitle());
        popup.setContent(updateDto.getContent());
        popup.setLinkUrl(updateDto.getLinkUrl());
        popup.setLinkText(updateDto.getLinkText());
        popup.setStartDate(updateDto.getStartDate());
        popup.setEndDate(updateDto.getEndDate());
        
        // 위치 설정
        try {
            popup.setPosition(Popup.PopupPosition.valueOf(updateDto.getPosition().toUpperCase()));
        } catch (IllegalArgumentException e) {
            popup.setPosition(Popup.PopupPosition.CENTER);
        }
        
        popup.setPositionX(updateDto.getPositionX());
        popup.setPositionY(updateDto.getPositionY());
        popup.setActive(updateDto.getActive() != null ? updateDto.getActive() : true);

        popup = popupRepository.save(popup);
        return convertToDto(popup);
    }

    // 팝업 활성화/비활성화
    public PopupDto togglePopupActive(Integer id) {
        Popup popup = popupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("팝업을 찾을 수 없습니다: " + id));

        popup.setActive(!popup.getActive());
        popup = popupRepository.save(popup);
        return convertToDto(popup);
    }

    // 팝업 삭제
    public void deletePopup(Integer id) {
        Popup popup = popupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("팝업을 찾을 수 없습니다: " + id));

        popupRepository.delete(popup);
    }

    // 팝업 통계
    public PopupStatsDto getPopupStats() {
        long totalCount = popupRepository.count();
        long activeCount = popupRepository.countByActive(true);
        long inactiveCount = popupRepository.countByActive(false);
        
        LocalDateTime now = LocalDateTime.now();
        long displayingCount = popupRepository.findActivePopupsForDisplay(now).size();

        return new PopupStatsDto(totalCount, activeCount, inactiveCount, displayingCount);
    }

    // Entity를 DTO로 변환
    private PopupDto convertToDto(Popup popup) {
        return new PopupDto(
                popup.getId(),
                popup.getTitle(),
                popup.getContent(),
                popup.getLinkUrl(),
                popup.getLinkText(),
                popup.getStartDate(),
                popup.getEndDate(),
                popup.getPosition().toString().toLowerCase(),
                popup.getPositionX(),
                popup.getPositionY(),
                popup.getActive(),
                popup.getCreatedAt(),
                popup.getUpdatedAt(),
                popup.getCreatedBy()
        );
    }

    // 통계용 내부 클래스
    public static class PopupStatsDto {
        private long totalCount;
        private long activeCount;
        private long inactiveCount;
        private long displayingCount;

        public PopupStatsDto(long totalCount, long activeCount, long inactiveCount, long displayingCount) {
            this.totalCount = totalCount;
            this.activeCount = activeCount;
            this.inactiveCount = inactiveCount;
            this.displayingCount = displayingCount;
        }

        // Getters
        public long getTotalCount() { return totalCount; }
        public long getActiveCount() { return activeCount; }
        public long getInactiveCount() { return inactiveCount; }
        public long getDisplayingCount() { return displayingCount; }
    }
}