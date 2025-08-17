package com.factlab.common.controller;

import com.factlab.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Health Check", description = "시스템 상태 확인 API")
public class HealthController {

    @GetMapping("/health")
    @Operation(summary = "시스템 상태 확인", description = "서버 상태와 기본 정보를 반환합니다")
    public ApiResponse<Map<String, Object>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("timestamp", LocalDateTime.now());
        status.put("service", "FactLab Backend API");
        status.put("version", "1.0.0");
        
        return ApiResponse.success(status, "서버가 정상적으로 동작 중입니다");
    }
}