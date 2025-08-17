package com.factlab.ai.controller;

import com.factlab.ai.dto.AIAnalysisTaskDto;
import com.factlab.ai.entity.AIAnalysisTask;
import com.factlab.ai.service.AIAnalysisTaskService;
import com.factlab.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/ai")
public class AIAnalysisTaskController {

    @Autowired
    private AIAnalysisTaskService taskService;

    // 작업 생성 요청 DTO
    public static class CreateTaskRequest {
        private Integer contentId;
        private String contentType;
        private String analysisType;
        private String priority = "normal";
        private String scheduledAt;
        private Integer dependsOnTaskId;

        // Getters and Setters
        public Integer getContentId() { return contentId; }
        public void setContentId(Integer contentId) { this.contentId = contentId; }

        public String getContentType() { return contentType; }
        public void setContentType(String contentType) { this.contentType = contentType; }

        public String getAnalysisType() { return analysisType; }
        public void setAnalysisType(String analysisType) { this.analysisType = analysisType; }

        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }

        public String getScheduledAt() { return scheduledAt; }
        public void setScheduledAt(String scheduledAt) { this.scheduledAt = scheduledAt; }

        public Integer getDependsOnTaskId() { return dependsOnTaskId; }
        public void setDependsOnTaskId(Integer dependsOnTaskId) { this.dependsOnTaskId = dependsOnTaskId; }
    }

    // 작업 상태 업데이트 요청 DTO
    public static class UpdateStatusRequest {
        private String status;
        private String errorMessage;

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    }

    // 작업 완료 요청 DTO
    public static class CompleteTaskRequest {
        private String result;
        private Integer confidenceScore;
        private String aiModel;

        public String getResult() { return result; }
        public void setResult(String result) { this.result = result; }

        public Integer getConfidenceScore() { return confidenceScore; }
        public void setConfidenceScore(Integer confidenceScore) { this.confidenceScore = confidenceScore; }

        public String getAiModel() { return aiModel; }
        public void setAiModel(String aiModel) { this.aiModel = aiModel; }
    }

    // 일괄 작업 생성 요청 DTO
    public static class BatchTaskRequest {
        private String analysisType;

        public String getAnalysisType() { return analysisType; }
        public void setAnalysisType(String analysisType) { this.analysisType = analysisType; }
    }

    // 모든 작업 조회 (페이징)
    @GetMapping("/tasks")
    public ApiResponse<List<AIAnalysisTaskDto>> getAllTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            List<AIAnalysisTaskDto> tasks = taskService.getAllTasks(page, size);
            return ApiResponse.success(tasks);
        } catch (Exception e) {
            return ApiResponse.error("작업 목록 조회에 실패했습니다: " + e.getMessage());
        }
    }

    // 상태별 작업 조회
    @GetMapping("/tasks/status/{status}")
    public ApiResponse<List<AIAnalysisTaskDto>> getTasksByStatus(@PathVariable String status) {
        try {
            AIAnalysisTask.TaskStatus taskStatus = AIAnalysisTask.TaskStatus.valueOf(status.toUpperCase());
            List<AIAnalysisTaskDto> tasks = taskService.getTasksByStatus(taskStatus);
            return ApiResponse.success(tasks);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("올바르지 않은 상태 값입니다: " + status);
        } catch (Exception e) {
            return ApiResponse.error("상태별 작업 조회에 실패했습니다: " + e.getMessage());
        }
    }

    // 우선순위별 작업 조회
    @GetMapping("/tasks/priority/{priority}")
    public ApiResponse<List<AIAnalysisTaskDto>> getTasksByPriority(@PathVariable String priority) {
        try {
            AIAnalysisTask.TaskPriority taskPriority = AIAnalysisTask.TaskPriority.valueOf(priority.toUpperCase());
            List<AIAnalysisTaskDto> tasks = taskService.getTasksByPriority(taskPriority);
            return ApiResponse.success(tasks);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("올바르지 않은 우선순위 값입니다: " + priority);
        } catch (Exception e) {
            return ApiResponse.error("우선순위별 작업 조회에 실패했습니다: " + e.getMessage());
        }
    }

    // 분석 타입별 작업 조회
    @GetMapping("/tasks/analysis-type/{analysisType}")
    public ApiResponse<List<AIAnalysisTaskDto>> getTasksByAnalysisType(@PathVariable String analysisType) {
        try {
            AIAnalysisTask.AnalysisType type = AIAnalysisTask.AnalysisType.valueOf(analysisType.toUpperCase());
            List<AIAnalysisTaskDto> tasks = taskService.getTasksByAnalysisType(type);
            return ApiResponse.success(tasks);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("올바르지 않은 분석 타입입니다: " + analysisType);
        } catch (Exception e) {
            return ApiResponse.error("분석 타입별 작업 조회에 실패했습니다: " + e.getMessage());
        }
    }

    // 실행 가능한 작업 조회
    @GetMapping("/tasks/executable")
    public ApiResponse<List<AIAnalysisTaskDto>> getExecutableTasks(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<AIAnalysisTaskDto> tasks = taskService.getExecutableTasks(limit);
            return ApiResponse.success(tasks);
        } catch (Exception e) {
            return ApiResponse.error("실행 가능한 작업 조회에 실패했습니다: " + e.getMessage());
        }
    }

    // 처리 중인 작업 조회
    @GetMapping("/tasks/active")
    public ApiResponse<List<AIAnalysisTaskDto>> getActiveTasks() {
        try {
            List<AIAnalysisTaskDto> tasks = taskService.getActiveTasks();
            return ApiResponse.success(tasks);
        } catch (Exception e) {
            return ApiResponse.error("처리 중인 작업 조회에 실패했습니다: " + e.getMessage());
        }
    }

    // 작업 생성
    @PostMapping("/tasks")
    public ApiResponse<AIAnalysisTaskDto> createTask(@Valid @RequestBody CreateTaskRequest request) {
        try {
            // 문자열을 enum으로 변환
            AIAnalysisTask.ContentType contentType = AIAnalysisTask.ContentType.valueOf(request.getContentType().toUpperCase());
            AIAnalysisTask.AnalysisType analysisType = AIAnalysisTask.AnalysisType.valueOf(request.getAnalysisType().toUpperCase());
            AIAnalysisTask.TaskPriority priority = AIAnalysisTask.TaskPriority.valueOf(request.getPriority().toUpperCase());

            AIAnalysisTaskDto task;

            // 스케줄된 작업인지 확인
            if (request.getScheduledAt() != null && !request.getScheduledAt().trim().isEmpty()) {
                LocalDateTime scheduledAt = LocalDateTime.parse(request.getScheduledAt());
                task = taskService.createScheduledTask(request.getContentId(), contentType, analysisType, priority, scheduledAt);
            }
            // 의존성 있는 작업인지 확인
            else if (request.getDependsOnTaskId() != null) {
                task = taskService.createDependentTask(request.getContentId(), contentType, analysisType, priority, request.getDependsOnTaskId());
            }
            // 일반 작업 생성
            else {
                task = taskService.createTask(request.getContentId(), contentType, analysisType, priority);
            }

            return ApiResponse.success(task);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("올바르지 않은 요청 값입니다: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("작업 생성에 실패했습니다: " + e.getMessage());
        }
    }

    // 작업 상태 업데이트
    @PutMapping("/tasks/{taskId}/status")
    public ApiResponse<AIAnalysisTaskDto> updateTaskStatus(
            @PathVariable Integer taskId,
            @Valid @RequestBody UpdateStatusRequest request) {
        try {
            AIAnalysisTask.TaskStatus status = AIAnalysisTask.TaskStatus.valueOf(request.getStatus().toUpperCase());
            AIAnalysisTaskDto task = taskService.updateTaskStatus(taskId, status, request.getErrorMessage());
            return ApiResponse.success(task);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("올바르지 않은 상태 값입니다: " + request.getStatus());
        } catch (Exception e) {
            return ApiResponse.error("작업 상태 업데이트에 실패했습니다: " + e.getMessage());
        }
    }

    // 작업 진행률 업데이트
    @PutMapping("/tasks/{taskId}/progress")
    public ApiResponse<AIAnalysisTaskDto> updateTaskProgress(
            @PathVariable Integer taskId,
            @RequestParam Integer progressPercentage) {
        try {
            AIAnalysisTaskDto task = taskService.updateTaskProgress(taskId, progressPercentage);
            return ApiResponse.success(task);
        } catch (Exception e) {
            return ApiResponse.error("작업 진행률 업데이트에 실패했습니다: " + e.getMessage());
        }
    }

    // 작업 완료 처리
    @PutMapping("/tasks/{taskId}/complete")
    public ApiResponse<AIAnalysisTaskDto> completeTask(
            @PathVariable Integer taskId,
            @Valid @RequestBody CompleteTaskRequest request) {
        try {
            AIAnalysisTaskDto task = taskService.completeTask(
                taskId, 
                request.getResult(), 
                request.getConfidenceScore(), 
                request.getAiModel()
            );
            return ApiResponse.success(task);
        } catch (Exception e) {
            return ApiResponse.error("작업 완료 처리에 실패했습니다: " + e.getMessage());
        }
    }

    // 작업 실패 처리
    @PutMapping("/tasks/{taskId}/fail")
    public ApiResponse<AIAnalysisTaskDto> failTask(
            @PathVariable Integer taskId,
            @RequestParam String errorMessage) {
        try {
            AIAnalysisTaskDto task = taskService.failTask(taskId, errorMessage);
            return ApiResponse.success(task);
        } catch (Exception e) {
            return ApiResponse.error("작업 실패 처리에 실패했습니다: " + e.getMessage());
        }
    }

    // 작업 재시도
    @PutMapping("/tasks/{taskId}/retry")
    public ApiResponse<AIAnalysisTaskDto> retryTask(@PathVariable Integer taskId) {
        try {
            AIAnalysisTaskDto task = taskService.retryTask(taskId);
            return ApiResponse.success(task);
        } catch (Exception e) {
            return ApiResponse.error("작업 재시도에 실패했습니다: " + e.getMessage());
        }
    }

    // 작업 취소
    @PutMapping("/tasks/{taskId}/cancel")
    public ApiResponse<AIAnalysisTaskDto> cancelTask(@PathVariable Integer taskId) {
        try {
            AIAnalysisTaskDto task = taskService.cancelTask(taskId);
            return ApiResponse.success(task);
        } catch (Exception e) {
            return ApiResponse.error("작업 취소에 실패했습니다: " + e.getMessage());
        }
    }

    // 작업 스케줄링
    @PutMapping("/tasks/{taskId}/schedule")
    public ApiResponse<AIAnalysisTaskDto> scheduleTask(
            @PathVariable Integer taskId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime scheduledAt) {
        try {
            AIAnalysisTaskDto task = taskService.scheduleTask(taskId, scheduledAt);
            return ApiResponse.success(task);
        } catch (Exception e) {
            return ApiResponse.error("작업 스케줄링에 실패했습니다: " + e.getMessage());
        }
    }

    // 우선순위 변경
    @PutMapping("/tasks/{taskId}/priority")
    public ApiResponse<AIAnalysisTaskDto> updateTaskPriority(
            @PathVariable Integer taskId,
            @RequestParam String priority) {
        try {
            AIAnalysisTask.TaskPriority taskPriority = AIAnalysisTask.TaskPriority.valueOf(priority.toUpperCase());
            AIAnalysisTaskDto task = taskService.updateTaskPriority(taskId, taskPriority);
            return ApiResponse.success(task);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("올바르지 않은 우선순위 값입니다: " + priority);
        } catch (Exception e) {
            return ApiResponse.error("우선순위 변경에 실패했습니다: " + e.getMessage());
        }
    }

    // 타임아웃된 작업 처리
    @PostMapping("/tasks/handle-timeout")
    public ApiResponse<List<AIAnalysisTaskDto>> handleTimeoutTasks(
            @RequestParam(defaultValue = "30") int timeoutMinutes) {
        try {
            List<AIAnalysisTaskDto> timeoutTasks = taskService.handleTimeoutTasks(timeoutMinutes);
            return ApiResponse.success(timeoutTasks);
        } catch (Exception e) {
            return ApiResponse.error("타임아웃 작업 처리에 실패했습니다: " + e.getMessage());
        }
    }

    // 일괄 작업 생성 (승인된 뉴스용)
    @PostMapping("/tasks/batch/approved-news")
    public ApiResponse<List<AIAnalysisTaskDto>> createBatchTasksForApprovedNews(
            @Valid @RequestBody BatchTaskRequest request) {
        try {
            AIAnalysisTask.AnalysisType analysisType = AIAnalysisTask.AnalysisType.valueOf(request.getAnalysisType().toUpperCase());
            List<AIAnalysisTaskDto> tasks = taskService.createBatchTasksForApprovedNews(analysisType);
            return ApiResponse.success(tasks);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("올바르지 않은 분석 타입입니다: " + request.getAnalysisType());
        } catch (Exception e) {
            return ApiResponse.error("일괄 작업 생성에 실패했습니다: " + e.getMessage());
        }
    }

    // 통계 조회
    @GetMapping("/tasks/statistics")
    public ApiResponse<Map<String, Object>> getAnalysisStatistics() {
        try {
            Map<String, Object> statistics = taskService.getAnalysisStatistics();
            return ApiResponse.success(statistics);
        } catch (Exception e) {
            return ApiResponse.error("통계 조회에 실패했습니다: " + e.getMessage());
        }
    }

    // 특정 작업 상세 조회
    @GetMapping("/tasks/{taskId}")
    public ApiResponse<AIAnalysisTaskDto> getTaskById(@PathVariable Integer taskId) {
        try {
            // Service에 단일 작업 조회 메서드가 없으므로 getAllTasks로 대체하고 필터링
            List<AIAnalysisTaskDto> allTasks = taskService.getAllTasks(0, 1000); // 충분히 큰 수
            AIAnalysisTaskDto task = allTasks.stream()
                    .filter(t -> t.getId().equals(taskId))
                    .findFirst()
                    .orElse(null);
            
            if (task == null) {
                return ApiResponse.error("작업을 찾을 수 없습니다: " + taskId);
            }
            
            return ApiResponse.success(task);
        } catch (Exception e) {
            return ApiResponse.error("작업 조회에 실패했습니다: " + e.getMessage());
        }
    }

    // 작업 삭제 (완료된 작업만)
    @DeleteMapping("/tasks/{taskId}")
    public ApiResponse<String> deleteTask(@PathVariable Integer taskId) {
        try {
            // 실제 삭제 로직은 서비스에서 구현 필요
            // 여기서는 취소로 대체
            taskService.cancelTask(taskId);
            return ApiResponse.success("작업이 취소되었습니다.");
        } catch (Exception e) {
            return ApiResponse.error("작업 삭제에 실패했습니다: " + e.getMessage());
        }
    }

    // 간단한 뉴스 분석 API (관리자용)
    @PostMapping("/analyze/news/{newsId}")
    public ApiResponse<String> analyzeNews(@PathVariable Integer newsId) {
        try {
            // AI 분석 작업 생성
            AIAnalysisTaskDto task = taskService.createTask(
                newsId, 
                AIAnalysisTask.ContentType.NEWS, 
                AIAnalysisTask.AnalysisType.SUMMARY, 
                AIAnalysisTask.TaskPriority.HIGH
            );
            
            // 임시로 간단한 분석 결과 반환
            String analysisResult = "📋 뉴스 ID " + newsId + "에 대한 AI 분석이 시작되었습니다.\n\n" +
                                   "🔍 분석 작업 ID: " + task.getId() + "\n" +
                                   "⏰ 생성 시간: " + task.getCreatedAt() + "\n" +
                                   "📊 상태: " + task.getStatus() + "\n\n" +
                                   "💡 이 기능은 현재 테스트 모드입니다.";
            
            return ApiResponse.success(analysisResult);
        } catch (Exception e) {
            return ApiResponse.error("뉴스 분석 요청에 실패했습니다: " + e.getMessage());
        }
    }
}