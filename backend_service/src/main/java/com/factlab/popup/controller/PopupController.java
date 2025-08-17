package com.factlab.popup.controller;

import com.factlab.common.dto.ApiResponse;
import com.factlab.popup.dto.PopupCreateDto;
import com.factlab.popup.dto.PopupDto;
import com.factlab.popup.service.PopupService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/popups")
public class PopupController {

    @Autowired
    private PopupService popupService;

    @GetMapping
    @Operation(summary = "전체 팝업 목록 조회", description = "모든 팝업을 최신순으로 조회합니다.")
    public ApiResponse<List<PopupDto>> getAllPopups(@RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "20") int size) {
        List<PopupDto> popups;
        if (page == 0 && size == 20) {
            popups = popupService.getAllPopups();
        } else {
            popups = popupService.getAllPopups(page, size);
        }
        return ApiResponse.success(popups);
    }

    @GetMapping("/active")
    @Operation(summary = "활성화된 팝업 목록 조회", description = "활성화된 팝업을 최신순으로 조회합니다.")
    public ApiResponse<List<PopupDto>> getActivePopups() {
        List<PopupDto> popups = popupService.getActivePopups();
        return ApiResponse.success(popups);
    }

    @GetMapping("/display")
    @Operation(summary = "현재 표시할 팝업 목록 조회", description = "현재 시간 기준으로 표시되어야 하는 팝업을 조회합니다.")
    public ApiResponse<List<PopupDto>> getDisplayPopups() {
        List<PopupDto> popups = popupService.getDisplayPopups();
        return ApiResponse.success(popups);
    }

    @GetMapping("/{id}")
    @Operation(summary = "팝업 상세 조회", description = "특정 팝업의 상세 정보를 조회합니다.")
    public ApiResponse<PopupDto> getPopupById(@PathVariable Integer id) {
        Optional<PopupDto> popup = popupService.getPopupById(id);
        if (popup.isPresent()) {
            return ApiResponse.success(popup.get());
        } else {
            return ApiResponse.error("팝업을 찾을 수 없습니다.");
        }
    }

    @PostMapping
    @Operation(summary = "팝업 생성", description = "새로운 팝업을 생성합니다.")
    public ApiResponse<PopupDto> createPopup(@Valid @RequestBody PopupCreateDto createDto,
                                           @RequestHeader(value = "X-Admin-User", defaultValue = "admin") String adminUser) {
        try {
            PopupDto createdPopup = popupService.createPopup(createDto, adminUser);
            return ApiResponse.success(createdPopup);
        } catch (Exception e) {
            return ApiResponse.error("팝업 생성에 실패했습니다: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "팝업 수정", description = "기존 팝업을 수정합니다.")
    public ApiResponse<PopupDto> updatePopup(@PathVariable Integer id,
                                           @Valid @RequestBody PopupCreateDto updateDto,
                                           @RequestHeader(value = "X-Admin-User", defaultValue = "admin") String adminUser) {
        try {
            PopupDto updatedPopup = popupService.updatePopup(id, updateDto, adminUser);
            return ApiResponse.success(updatedPopup);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("팝업 수정에 실패했습니다: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/toggle")
    @Operation(summary = "팝업 활성화/비활성화", description = "팝업의 활성화 상태를 토글합니다.")
    public ApiResponse<PopupDto> togglePopupActive(@PathVariable Integer id) {
        try {
            PopupDto updatedPopup = popupService.togglePopupActive(id);
            return ApiResponse.success(updatedPopup);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "팝업 삭제", description = "팝업을 완전히 삭제합니다.")
    public ApiResponse<String> deletePopup(@PathVariable Integer id) {
        try {
            popupService.deletePopup(id);
            return ApiResponse.success("팝업이 삭제되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping("/stats")
    @Operation(summary = "팝업 통계 조회", description = "팝업 관련 통계를 조회합니다.")
    public ApiResponse<PopupService.PopupStatsDto> getPopupStats() {
        try {
            PopupService.PopupStatsDto stats = popupService.getPopupStats();
            return ApiResponse.success(stats);
        } catch (Exception e) {
            return ApiResponse.error("통계 조회에 실패했습니다: " + e.getMessage());
        }
    }
}