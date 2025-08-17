package com.factlab.system.controller;

import com.factlab.common.dto.ApiResponse;
import com.factlab.system.dto.BestSettingUpdateDto;
import com.factlab.system.service.SystemSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/system-settings")
@Tag(name = "시스템 설정 관리", description = "시스템 설정 관련 API")
public class SystemSettingController {

    @Autowired
    private SystemSettingService systemSettingService;

    /**
     * BEST 게시판 기준 조회
     */
    @GetMapping("/best")
    @Operation(summary = "BEST 게시판 기준 조회", description = "BEST 게시판의 조회수/추천수 기준을 조회합니다")
    public ApiResponse<Map<String, Integer>> getBestSettings() {
        try {
            Map<String, Integer> settings = systemSettingService.getBestSettings();
            return ApiResponse.success(settings, "BEST 설정을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("BEST 설정 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * BEST 게시판 기준 업데이트
     */
    @PutMapping("/best")
    @Operation(summary = "BEST 게시판 기준 업데이트", description = "BEST 게시판의 조회수/추천수 기준을 업데이트합니다")
    public ApiResponse<Void> updateBestSettings(@RequestBody BestSettingUpdateDto updateDto) {
        try {
            systemSettingService.updateBestSettings(updateDto);
            return ApiResponse.success(null, "BEST 설정이 성공적으로 업데이트되었습니다.");
        } catch (Exception e) {
            return ApiResponse.error("BEST 설정 업데이트 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}