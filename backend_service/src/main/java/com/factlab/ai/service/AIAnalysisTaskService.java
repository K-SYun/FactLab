package com.factlab.ai.service;

import com.factlab.ai.dto.AIAnalysisTaskDto;
import com.factlab.ai.entity.AIAnalysisTask;
import com.factlab.ai.repository.AIAnalysisTaskRepository;
import com.factlab.news.repository.NewsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

@Service
@Transactional
public class AIAnalysisTaskService {

    @Autowired
    private AIAnalysisTaskRepository taskRepository;

    @Autowired
    private NewsRepository newsRepository;
    
    @Autowired
    private com.factlab.news.service.NewsService newsService;

    // 작업 생성
    public AIAnalysisTaskDto createTask(Integer contentId, AIAnalysisTask.ContentType contentType, 
                                       AIAnalysisTask.AnalysisType analysisType, 
                                       AIAnalysisTask.TaskPriority priority) {
        // 중복 작업 체크
        Optional<AIAnalysisTask> existingTask = taskRepository.findByContentIdAndContentTypeAndAnalysisType(
            contentId, contentType, analysisType);
        
        if (existingTask.isPresent() && !existingTask.get().isTerminalState()) {
            throw new RuntimeException("해당 컨텐츠에 대한 동일한 분석 작업이 이미 존재합니다.");
        }

        AIAnalysisTask task = new AIAnalysisTask(contentId, contentType, analysisType, priority);
        task = taskRepository.save(task);
        
        return convertToDtoWithContentInfo(task);
    }

    // 스케줄된 작업 생성
    public AIAnalysisTaskDto createScheduledTask(Integer contentId, AIAnalysisTask.ContentType contentType, 
                                                AIAnalysisTask.AnalysisType analysisType, 
                                                AIAnalysisTask.TaskPriority priority, 
                                                LocalDateTime scheduledAt) {
        AIAnalysisTaskDto taskDto = createTask(contentId, contentType, analysisType, priority);
        return scheduleTask(taskDto.getId(), scheduledAt);
    }

    // 의존성 있는 작업 생성
    public AIAnalysisTaskDto createDependentTask(Integer contentId, AIAnalysisTask.ContentType contentType, 
                                                AIAnalysisTask.AnalysisType analysisType, 
                                                AIAnalysisTask.TaskPriority priority, 
                                                Integer dependsOnTaskId) {
        AIAnalysisTask task = new AIAnalysisTask(contentId, contentType, analysisType, priority);
        task.setDependsOnTaskId(dependsOnTaskId);
        task = taskRepository.save(task);
        
        return convertToDtoWithContentInfo(task);
    }

    // 모든 작업 조회 (페이징)
    public List<AIAnalysisTaskDto> getAllTasks(int page, int size) {
        return taskRepository.findAll().stream()
                .skip(page * size)
                .limit(size)
                .map(this::convertToDtoWithContentInfo)
                .collect(Collectors.toList());
    }

    // 상태별 작업 조회
    public List<AIAnalysisTaskDto> getTasksByStatus(AIAnalysisTask.TaskStatus status) {
        return taskRepository.findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .map(this::convertToDtoWithContentInfo)
                .collect(Collectors.toList());
    }

    // 우선순위별 작업 조회
    public List<AIAnalysisTaskDto> getTasksByPriority(AIAnalysisTask.TaskPriority priority) {
        return taskRepository.findByPriorityOrderByCreatedAtDesc(priority)
                .stream()
                .map(this::convertToDtoWithContentInfo)
                .collect(Collectors.toList());
    }

    // 분석 타입별 작업 조회
    public List<AIAnalysisTaskDto> getTasksByAnalysisType(AIAnalysisTask.AnalysisType analysisType) {
        return taskRepository.findByAnalysisTypeOrderByCreatedAtDesc(analysisType)
                .stream()
                .map(this::convertToDtoWithContentInfo)
                .collect(Collectors.toList());
    }

    // 실행 가능한 작업 조회
    public List<AIAnalysisTaskDto> getExecutableTasks(int limit) {
        return taskRepository.findExecutableTasks(LocalDateTime.now())
                .stream()
                .limit(limit)
                .map(this::convertToDtoWithContentInfo)
                .collect(Collectors.toList());
    }

    // 처리 중인 작업 조회
    public List<AIAnalysisTaskDto> getActiveTasks() {
        List<AIAnalysisTask.TaskStatus> activeStatuses = List.of(
            AIAnalysisTask.TaskStatus.PROCESSING, AIAnalysisTask.TaskStatus.RETRYING
        );
        return taskRepository.findByStatusInOrderByStartedAtAsc(activeStatuses)
                .stream()
                .map(this::convertToDtoWithContentInfo)
                .collect(Collectors.toList());
    }

    // 작업 상태 업데이트
    public AIAnalysisTaskDto updateTaskStatus(Integer taskId, AIAnalysisTask.TaskStatus newStatus, String errorMessage) {
        AIAnalysisTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("작업을 찾을 수 없습니다: " + taskId));

        task.updateStatus(newStatus);
        if (errorMessage != null) {
            task.setErrorMessage(errorMessage);
        }

        task = taskRepository.save(task);
        return convertToDtoWithContentInfo(task);
    }

    // 작업 진행률 업데이트
    public AIAnalysisTaskDto updateTaskProgress(Integer taskId, Integer progressPercentage) {
        AIAnalysisTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("작업을 찾을 수 없습니다: " + taskId));

        task.setProgressPercentage(Math.max(0, Math.min(100, progressPercentage)));
        task = taskRepository.save(task);
        
        return convertToDtoWithContentInfo(task);
    }

    // 작업 시작 시간 업데이트
    public void updateTaskStartTime(Integer taskId, LocalDateTime startTime) {
        AIAnalysisTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("작업을 찾을 수 없습니다: " + taskId));
        
        task.setStartedAt(startTime);
        taskRepository.save(task);
    }
    
    // 재시도를 위한 작업 마킹
    public void markForRetry(Integer taskId, String errorMessage) {
        AIAnalysisTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("작업을 찾을 수 없습니다: " + taskId));
        
        task.updateStatus(AIAnalysisTask.TaskStatus.RETRYING);
        task.setErrorMessage(errorMessage);
        
        taskRepository.save(task);
    }
    
    // 작업 완료 처리 (오버로드 메서드 추가)
    public AIAnalysisTaskDto completeTask(Integer taskId, String result, Integer confidenceScore) {
        return completeTask(taskId, result, confidenceScore, "default-ai-model");
    }
    
    // 작업 완료 처리
    public AIAnalysisTaskDto completeTask(Integer taskId, String result, Integer confidenceScore, String aiModel) {
        AIAnalysisTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("작업을 찾을 수 없습니다: " + taskId));

        task.updateStatus(AIAnalysisTask.TaskStatus.COMPLETED);
        task.setResult(result);
        task.setConfidenceScore(confidenceScore);
        task.setAiModel(aiModel);
        task.setProgressPercentage(100);

        task = taskRepository.save(task);

        // AI 분석 작업이 완료되면 해당 뉴스를 승인 대기 상태로 변경
        if (task.getContentType() == AIAnalysisTask.ContentType.NEWS && 
            task.getAnalysisType() == AIAnalysisTask.AnalysisType.SUMMARY) {
            try {
                // 뉴스 상태를 PENDING으로 변경하여 승인 대기 목록에 표시
                newsService.updateNewsStatus(task.getContentId(), 
                    com.factlab.news.entity.News.NewsStatus.PENDING);
                System.out.println("AI 분석 완료: 뉴스 ID " + task.getContentId() + "를 승인 대기 상태로 변경했습니다.");
            } catch (Exception e) {
                System.err.println("뉴스 상태 업데이트 실패: " + e.getMessage());
            }
        }

        // 의존성 작업 활성화
        activateDependentTasks(taskId);

        return convertToDtoWithContentInfo(task);
    }

    // 작업 실패 처리
    public AIAnalysisTaskDto failTask(Integer taskId, String errorMessage) {
        AIAnalysisTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("작업을 찾을 수 없습니다: " + taskId));

        task.updateStatus(AIAnalysisTask.TaskStatus.FAILED);
        task.setErrorMessage(errorMessage);

        task = taskRepository.save(task);
        return convertToDtoWithContentInfo(task);
    }

    // 작업 재시도
    public AIAnalysisTaskDto retryTask(Integer taskId) {
        AIAnalysisTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("작업을 찾을 수 없습니다: " + taskId));

        if (!task.canRetry()) {
            throw new RuntimeException("재시도할 수 없는 작업입니다. 최대 재시도 횟수를 초과했습니다.");
        }

        task.updateStatus(AIAnalysisTask.TaskStatus.RETRYING);
        task.setErrorMessage(null);
        task.setProgressPercentage(0);

        task = taskRepository.save(task);
        return convertToDtoWithContentInfo(task);
    }

    // 작업 취소
    public AIAnalysisTaskDto cancelTask(Integer taskId) {
        AIAnalysisTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("작업을 찾을 수 없습니다: " + taskId));

        if (task.isTerminalState()) {
            throw new RuntimeException("이미 완료되거나 취소된 작업은 취소할 수 없습니다.");
        }

        task.updateStatus(AIAnalysisTask.TaskStatus.CANCELLED);
        task = taskRepository.save(task);

        return convertToDtoWithContentInfo(task);
    }

    // 작업 스케줄링
    public AIAnalysisTaskDto scheduleTask(Integer taskId, LocalDateTime scheduledAt) {
        AIAnalysisTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("작업을 찾을 수 없습니다: " + taskId));

        if (task.getStatus() != AIAnalysisTask.TaskStatus.PENDING) {
            throw new RuntimeException("대기 중인 작업만 스케줄할 수 있습니다.");
        }

        task.updateStatus(AIAnalysisTask.TaskStatus.SCHEDULED);
        task.setScheduledAt(scheduledAt);

        task = taskRepository.save(task);
        return convertToDtoWithContentInfo(task);
    }

    // 우선순위 변경
    public AIAnalysisTaskDto updateTaskPriority(Integer taskId, AIAnalysisTask.TaskPriority priority) {
        AIAnalysisTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("작업을 찾을 수 없습니다: " + taskId));

        task.setPriority(priority);
        task = taskRepository.save(task);

        return convertToDtoWithContentInfo(task);
    }

    // 타임아웃된 작업 처리
    public List<AIAnalysisTaskDto> handleTimeoutTasks(int timeoutMinutes) {
        LocalDateTime timeoutThreshold = LocalDateTime.now().minusMinutes(timeoutMinutes);
        List<AIAnalysisTask> stuckTasks = taskRepository.findStuckTasks(timeoutThreshold);

        return stuckTasks.stream().map(task -> {
            try {
                task.updateStatus(AIAnalysisTask.TaskStatus.FAILED);
                task.setErrorMessage("작업 처리 시간 초과 (타임아웃)");
                task = taskRepository.save(task);
                return convertToDtoWithContentInfo(task);
            } catch (Exception e) {
                System.err.println("Failed to handle timeout for task " + task.getId() + ": " + e.getMessage());
                return null;
            }
        }).filter(dto -> dto != null).collect(Collectors.toList());
    }

    // 일괄 작업 생성 (뉴스용)
    public List<AIAnalysisTaskDto> createBatchTasksForApprovedNews(AIAnalysisTask.AnalysisType analysisType) {
        // 승인된 뉴스 중 해당 분석이 없는 것들 조회
        return newsRepository.findByStatusOrderByPublishDateDesc(
            com.factlab.news.entity.News.NewsStatus.APPROVED)
            .stream()
            .filter(news -> {
                Optional<AIAnalysisTask> existingTask = taskRepository
                    .findByContentIdAndContentTypeAndAnalysisType(
                        news.getId(), AIAnalysisTask.ContentType.NEWS, analysisType);
                return !existingTask.isPresent() || existingTask.get().isTerminalState();
            })
            .map(news -> {
                AIAnalysisTask task = new AIAnalysisTask(
                    news.getId(), AIAnalysisTask.ContentType.NEWS, analysisType);
                return taskRepository.save(task);
            })
            .map(this::convertToDtoWithContentInfo)
            .collect(Collectors.toList());
    }

    // 통계 조회
    public Map<String, Object> getAnalysisStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // 상태별 통계
        List<Object[]> statusCounts = taskRepository.getStatusCounts();
        Map<String, Long> statusStats = new HashMap<>();
        for (Object[] row : statusCounts) {
            statusStats.put(row[0].toString().toLowerCase(), (Long) row[1]);
        }
        stats.put("statusStats", statusStats);

        // 분석 타입별 통계
        List<Object[]> typeCounts = taskRepository.getAnalysisTypeCounts();
        Map<String, Long> typeStats = new HashMap<>();
        for (Object[] row : typeCounts) {
            typeStats.put(row[0].toString().toLowerCase(), (Long) row[1]);
        }
        stats.put("typeStats", typeStats);

        // 성능 통계
        stats.put("averageProcessingTime", taskRepository.getAverageProcessingTime());
        stats.put("averageConfidenceScore", taskRepository.getAverageConfidenceScore());
        stats.put("queueDepth", taskRepository.getQueueDepth());

        return stats;
    }

    // 의존성 작업 활성화
    private void activateDependentTasks(Integer completedTaskId) {
        List<AIAnalysisTask> dependentTasks = taskRepository.findByDependsOnTaskIdOrderByCreatedAtAsc(completedTaskId);
        for (AIAnalysisTask task : dependentTasks) {
            if (task.getStatus() == AIAnalysisTask.TaskStatus.PENDING) {
                // 의존성이 해결되었으므로 실행 가능 상태로 변경할 수 있음
                // 실제로는 스케줄러가 이를 감지하여 처리함
            }
        }
    }

    // Entity to DTO 변환 (컨텐츠 정보 포함)
    private AIAnalysisTaskDto convertToDtoWithContentInfo(AIAnalysisTask task) {
        AIAnalysisTaskDto dto = convertToDto(task);
        
        // 컨텐츠 제목 추가
        if (task.getContentType() == AIAnalysisTask.ContentType.NEWS) {
            newsRepository.findById(task.getContentId()).ifPresent(news -> {
                dto.setContentTitle(news.getTitle());
            });
        }
        
        return dto;
    }

    // Entity to DTO 변환
    private AIAnalysisTaskDto convertToDto(AIAnalysisTask task) {
        return new AIAnalysisTaskDto(
            task.getId(),
            task.getContentId(),
            task.getContentType().toString().toLowerCase(),
            task.getAnalysisType().toString().toLowerCase(),
            task.getStatus().toString().toLowerCase(),
            task.getPriority().toString().toLowerCase(),
            task.getAiModel(),
            task.getProcessingTimeSeconds(),
            task.getRetryCount(),
            task.getMaxRetries(),
            task.getErrorMessage(),
            task.getResult(),
            task.getConfidenceScore(),
            task.getScheduledAt(),
            task.getStartedAt(),
            task.getCompletedAt(),
            task.getCreatedAt(),
            task.getUpdatedAt(),
            task.getProgressPercentage(),
            task.getMetadata(),
            task.getDependsOnTaskId()
        );
    }
}