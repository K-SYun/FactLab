package com.factlab.ai.repository;

import com.factlab.ai.entity.AIAnalysisTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AIAnalysisTaskRepository extends JpaRepository<AIAnalysisTask, Integer> {

    // 상태별 조회
    List<AIAnalysisTask> findByStatusOrderByCreatedAtDesc(AIAnalysisTask.TaskStatus status);
    List<AIAnalysisTask> findByStatusOrderByPriorityDescCreatedAtAsc(AIAnalysisTask.TaskStatus status);

    // 우선순위별 조회
    List<AIAnalysisTask> findByPriorityOrderByCreatedAtDesc(AIAnalysisTask.TaskPriority priority);

    // 컨텐츠 ID와 타입으로 조회
    List<AIAnalysisTask> findByContentIdAndContentTypeOrderByCreatedAtDesc(
        Integer contentId, AIAnalysisTask.ContentType contentType);

    // 분석 타입별 조회
    List<AIAnalysisTask> findByAnalysisTypeOrderByCreatedAtDesc(AIAnalysisTask.AnalysisType analysisType);

    // 특정 컨텐츠의 특정 분석 타입 조회
    Optional<AIAnalysisTask> findByContentIdAndContentTypeAndAnalysisType(
        Integer contentId, AIAnalysisTask.ContentType contentType, AIAnalysisTask.AnalysisType analysisType);

    // 실행 가능한 작업 조회 (우선순위 순)
    @Query("SELECT t FROM AIAnalysisTask t WHERE t.status IN ('PENDING', 'SCHEDULED') " +
           "AND (t.scheduledAt IS NULL OR t.scheduledAt <= :now) " +
           "AND (t.dependsOnTaskId IS NULL OR EXISTS " +
           "(SELECT 1 FROM AIAnalysisTask d WHERE d.id = t.dependsOnTaskId AND d.status = 'COMPLETED')) " +
           "ORDER BY t.priority DESC, t.createdAt ASC")
    List<AIAnalysisTask> findExecutableTasks(@Param("now") LocalDateTime now);

    // 스케줄된 작업 조회
    @Query("SELECT t FROM AIAnalysisTask t WHERE t.status = 'SCHEDULED' " +
           "AND t.scheduledAt <= :now ORDER BY t.priority DESC, t.scheduledAt ASC")
    List<AIAnalysisTask> findScheduledTasksReadyToRun(@Param("now") LocalDateTime now);

    // 처리 중인 작업 조회
    List<AIAnalysisTask> findByStatusInOrderByStartedAtAsc(List<AIAnalysisTask.TaskStatus> statuses);

    // 오래된 처리 중 작업 조회 (타임아웃 체크용)
    @Query("SELECT t FROM AIAnalysisTask t WHERE t.status IN ('PROCESSING', 'RETRYING') " +
           "AND t.startedAt < :timeoutThreshold")
    List<AIAnalysisTask> findStuckTasks(@Param("timeoutThreshold") LocalDateTime timeoutThreshold);

    // 재시도 가능한 실패 작업 조회
    @Query("SELECT t FROM AIAnalysisTask t WHERE t.status = 'FAILED' " +
           "AND t.retryCount < t.maxRetries ORDER BY t.priority DESC, t.updatedAt ASC")
    List<AIAnalysisTask> findRetryableTasks();

    // 의존성이 있는 작업 조회
    List<AIAnalysisTask> findByDependsOnTaskIdOrderByCreatedAtAsc(Integer dependsOnTaskId);

    // 통계 조회
    @Query("SELECT COUNT(t) FROM AIAnalysisTask t WHERE t.status = :status")
    long countByStatus(@Param("status") AIAnalysisTask.TaskStatus status);

    @Query("SELECT t.status, COUNT(t) FROM AIAnalysisTask t GROUP BY t.status")
    List<Object[]> getStatusCounts();

    @Query("SELECT t.analysisType, COUNT(t) FROM AIAnalysisTask t GROUP BY t.analysisType")
    List<Object[]> getAnalysisTypeCounts();

    @Query("SELECT t.priority, COUNT(t) FROM AIAnalysisTask t WHERE t.status IN ('PENDING', 'SCHEDULED') GROUP BY t.priority")
    List<Object[]> getPendingTaskPriorityCounts();

    // 성능 통계
    @Query("SELECT AVG(t.processingTimeSeconds) FROM AIAnalysisTask t WHERE t.status = 'COMPLETED' AND t.processingTimeSeconds IS NOT NULL")
    Double getAverageProcessingTime();

    @Query("SELECT AVG(t.processingTimeSeconds) FROM AIAnalysisTask t WHERE t.status = 'COMPLETED' " +
           "AND t.analysisType = :analysisType AND t.processingTimeSeconds IS NOT NULL")
    Double getAverageProcessingTimeByType(@Param("analysisType") AIAnalysisTask.AnalysisType analysisType);

    @Query("SELECT AVG(t.confidenceScore) FROM AIAnalysisTask t WHERE t.status = 'COMPLETED' AND t.confidenceScore IS NOT NULL")
    Double getAverageConfidenceScore();

    // 특정 기간 내 작업 조회
    @Query("SELECT t FROM AIAnalysisTask t WHERE t.createdAt BETWEEN :startDate AND :endDate ORDER BY t.createdAt DESC")
    List<AIAnalysisTask> findTasksInDateRange(@Param("startDate") LocalDateTime startDate, 
                                              @Param("endDate") LocalDateTime endDate);

    // 최근 완료된 작업
    @Query("SELECT t FROM AIAnalysisTask t WHERE t.status = 'COMPLETED' ORDER BY t.completedAt DESC LIMIT :limit")
    List<AIAnalysisTask> findRecentCompletedTasks(@Param("limit") int limit);

    // 최근 실패한 작업
    @Query("SELECT t FROM AIAnalysisTask t WHERE t.status = 'FAILED' ORDER BY t.updatedAt DESC LIMIT :limit")
    List<AIAnalysisTask> findRecentFailedTasks(@Param("limit") int limit);

    // AI 모델별 성능 통계
    @Query("SELECT t.aiModel, COUNT(t), AVG(t.processingTimeSeconds), AVG(t.confidenceScore) " +
           "FROM AIAnalysisTask t WHERE t.status = 'COMPLETED' AND t.aiModel IS NOT NULL " +
           "GROUP BY t.aiModel")
    List<Object[]> getModelPerformanceStats();

    // 큐 깊이 조회 (대기 중인 작업 수)
    @Query("SELECT COUNT(t) FROM AIAnalysisTask t WHERE t.status IN ('PENDING', 'SCHEDULED')")
    long getQueueDepth();

    // 처리량 조회 (특정 기간 동안 완료된 작업 수)
    @Query("SELECT COUNT(t) FROM AIAnalysisTask t WHERE t.status = 'COMPLETED' " +
           "AND t.completedAt BETWEEN :startDate AND :endDate")
    long getThroughput(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}