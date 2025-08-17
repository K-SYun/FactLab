package com.factlab.ai.scheduler;

import com.factlab.ai.entity.AIAnalysisTask;
import com.factlab.ai.service.AIAnalysisTaskService;
import com.factlab.ai.repository.AIAnalysisTaskRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

@Component
public class AITaskScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AITaskScheduler.class);

    @Autowired
    private AIAnalysisTaskService taskService;

    @Autowired
    private AIAnalysisTaskRepository taskRepository;

    @Autowired
    private AITaskExecutor taskExecutor;

    // 동시 실행 가능한 최대 작업 수
    @Value("${ai.scheduler.max-concurrent-tasks:3}")
    private int maxConcurrentTasks;

    // 스케줄된 작업 확인 간격 (초)
    @Value("${ai.scheduler.check-interval:30}")
    private int checkIntervalSeconds;

    // 타임아웃 체크 간격 (분)
    @Value("${ai.scheduler.timeout-check-minutes:30}")
    private int timeoutCheckMinutes;

    // 실행을 위한 스레드 풀
    private final ExecutorService executorService = Executors.newCachedThreadPool();
    
    // 동시 실행 제한을 위한 세마포어
    private Semaphore concurrencyLimiter;

    public void initializeScheduler() {
        this.concurrencyLimiter = new Semaphore(maxConcurrentTasks);
        logger.info("AI Task Scheduler initialized with max concurrent tasks: {}", maxConcurrentTasks);
    }

    /**
     * 메인 스케줄러 - 실행 가능한 작업들을 찾아서 실행
     * 30초마다 실행
     */
    @Scheduled(fixedDelayString = "#{${ai.scheduler.check-interval:30} * 1000}")
    public void scheduleExecutableTasks() {
        try {
            logger.debug("스케줄러 실행: 실행 가능한 작업 확인 중...");
            
            // 현재 사용 가능한 슬롯 수 확인
            int availableSlots = concurrencyLimiter.availablePermits();
            if (availableSlots == 0) {
                logger.debug("모든 실행 슬롯이 사용 중입니다.");
                return;
            }

            // 실행 가능한 작업들 조회 (우선순위 순)
            List<AIAnalysisTask> executableTasks = taskRepository.findExecutableTasks(LocalDateTime.now());
            
            if (executableTasks.isEmpty()) {
                logger.debug("실행 가능한 작업이 없습니다.");
                return;
            }

            logger.info("실행 가능한 작업 {}개 발견, 사용 가능한 슬롯: {}", executableTasks.size(), availableSlots);

            // 사용 가능한 슬롯 수만큼 작업 실행
            int tasksToExecute = Math.min(executableTasks.size(), availableSlots);
            for (int i = 0; i < tasksToExecute; i++) {
                AIAnalysisTask task = executableTasks.get(i);
                executeTaskAsync(task);
            }

        } catch (Exception e) {
            logger.error("스케줄러 실행 중 오류 발생", e);
        }
    }

    /**
     * 스케줄된 작업 처리 - 예약된 시간이 된 작업들을 실행 대기 상태로 변경
     * 1분마다 실행
     */
    @Scheduled(fixedDelay = 60000) // 1분
    public void processScheduledTasks() {
        try {
            logger.debug("스케줄된 작업 확인 중...");
            
            List<AIAnalysisTask> scheduledTasks = taskRepository.findScheduledTasksReadyToRun(LocalDateTime.now());
            
            if (!scheduledTasks.isEmpty()) {
                logger.info("실행 준비된 스케줄 작업 {}개 발견", scheduledTasks.size());
                
                for (AIAnalysisTask task : scheduledTasks) {
                    try {
                        // 스케줄된 작업을 대기 상태로 변경
                        taskService.updateTaskStatus(task.getId(), AIAnalysisTask.TaskStatus.PENDING, null);
                        logger.info("스케줄된 작업 ID {} 실행 대기 상태로 변경", task.getId());
                    } catch (Exception e) {
                        logger.error("스케줄된 작업 ID {} 상태 변경 실패", task.getId(), e);
                    }
                }
            }

        } catch (Exception e) {
            logger.error("스케줄된 작업 처리 중 오류 발생", e);
        }
    }

    /**
     * 타임아웃 작업 처리 - 너무 오래 실행 중인 작업들을 실패 처리
     * 5분마다 실행
     */
    @Scheduled(fixedDelay = 300000) // 5분
    public void handleTimeoutTasks() {
        try {
            logger.debug("타임아웃 작업 확인 중...");
            
            List<com.factlab.ai.dto.AIAnalysisTaskDto> timeoutTasks = taskService.handleTimeoutTasks(timeoutCheckMinutes);
            
            if (!timeoutTasks.isEmpty()) {
                logger.warn("타임아웃 처리된 작업 {}개", timeoutTasks.size());
                
                // 타임아웃 처리된 작업들의 세마포어 해제
                for (com.factlab.ai.dto.AIAnalysisTaskDto task : timeoutTasks) {
                    concurrencyLimiter.release();
                    logger.info("타임아웃 작업 ID {} 세마포어 해제", task.getId());
                }
            }

        } catch (Exception e) {
            logger.error("타임아웃 작업 처리 중 오류 발생", e);
        }
    }

    /**
     * 의존성 해결 - 완료된 작업의 의존성을 가진 작업들을 실행 가능 상태로 변경
     * 2분마다 실행
     */
    @Scheduled(fixedDelay = 120000) // 2분
    public void resolveDependencies() {
        try {
            logger.debug("의존성 해결 확인 중...");
            
            // 최근 완료된 작업들 조회
            List<AIAnalysisTask> recentCompletedTasks = taskRepository.findRecentCompletedTasks(50);
            
            for (AIAnalysisTask completedTask : recentCompletedTasks) {
                // 이 작업에 의존하는 작업들 조회
                List<AIAnalysisTask> dependentTasks = taskRepository.findByDependsOnTaskIdOrderByCreatedAtAsc(completedTask.getId());
                
                for (AIAnalysisTask dependentTask : dependentTasks) {
                    if (dependentTask.getStatus() == AIAnalysisTask.TaskStatus.PENDING) {
                        logger.info("의존성 해결: 작업 ID {} (의존 작업 ID {} 완료)", 
                                   dependentTask.getId(), completedTask.getId());
                        // 이미 PENDING 상태이므로 다음 스케줄링 사이클에서 실행됨
                    }
                }
            }

        } catch (Exception e) {
            logger.error("의존성 해결 중 오류 발생", e);
        }
    }

    /**
     * 실패한 작업 재시도 - 재시도 가능한 실패 작업들을 자동으로 재시도
     * 10분마다 실행
     */
    @Scheduled(fixedDelay = 600000) // 10분
    public void retryFailedTasks() {
        try {
            logger.debug("재시도 가능한 실패 작업 확인 중...");
            
            List<AIAnalysisTask> retryableTasks = taskRepository.findRetryableTasks();
            
            if (!retryableTasks.isEmpty()) {
                logger.info("재시도 가능한 실패 작업 {}개 발견", retryableTasks.size());
                
                for (AIAnalysisTask task : retryableTasks) {
                    try {
                        // 실패한 작업을 재시도 상태로 변경
                        taskService.retryTask(task.getId());
                        logger.info("실패 작업 ID {} 재시도 시작", task.getId());
                    } catch (Exception e) {
                        logger.error("실패 작업 ID {} 재시도 실패", task.getId(), e);
                    }
                }
            }

        } catch (Exception e) {
            logger.error("실패 작업 재시도 중 오류 발생", e);
        }
    }

    /**
     * 스케줄러 상태 로깅 - 시스템 상태를 주기적으로 로깅
     * 30분마다 실행
     */
    @Scheduled(fixedDelay = 1800000) // 30분
    public void logSchedulerStatus() {
        try {
            // 현재 상태 통계 조회
            long pendingCount = taskRepository.countByStatus(AIAnalysisTask.TaskStatus.PENDING);
            long processingCount = taskRepository.countByStatus(AIAnalysisTask.TaskStatus.PROCESSING);
            long queueDepth = taskRepository.getQueueDepth();
            int availableSlots = concurrencyLimiter.availablePermits();
            
            logger.info("=== AI Task Scheduler Status ===");
            logger.info("대기 중 작업: {}", pendingCount);
            logger.info("처리 중 작업: {}", processingCount);
            logger.info("큐 깊이: {}", queueDepth);
            logger.info("사용 가능한 슬롯: {}/{}", availableSlots, maxConcurrentTasks);
            logger.info("============================");

        } catch (Exception e) {
            logger.error("스케줄러 상태 로깅 중 오류 발생", e);
        }
    }

    /**
     * 작업을 비동기로 실행
     */
    private void executeTaskAsync(AIAnalysisTask task) {
        // 세마포어 획득 시도
        if (!concurrencyLimiter.tryAcquire()) {
            logger.warn("동시 실행 제한 초과로 작업 ID {} 실행 스킵", task.getId());
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                logger.info("작업 ID {} 실행 시작 (분석 타입: {}, 우선순위: {})", 
                           task.getId(), task.getAnalysisType(), task.getPriority());
                
                // 작업 상태를 처리 중으로 변경
                taskService.updateTaskStatus(task.getId(), AIAnalysisTask.TaskStatus.PROCESSING, null);
                
                // 실제 AI 분석 작업 실행
                taskExecutor.executeTask(task);
                
                logger.info("작업 ID {} 실행 완료", task.getId());

            } catch (Exception e) {
                logger.error("작업 ID {} 실행 중 오류 발생", task.getId(), e);
                
                try {
                    // 작업 실패 처리
                    taskService.failTask(task.getId(), "실행 중 오류: " + e.getMessage());
                } catch (Exception failException) {
                    logger.error("작업 ID {} 실패 처리 중 오류", task.getId(), failException);
                }
            } finally {
                // 세마포어 해제
                concurrencyLimiter.release();
                logger.debug("작업 ID {} 실행 슬롯 해제", task.getId());
            }
        }, executorService);
    }

    /**
     * 긴급 작업 우선 처리 - 긴급 우선순위 작업이 있으면 즉시 실행
     */
    public void handleUrgentTask(AIAnalysisTask urgentTask) {
        if (urgentTask.getPriority() == AIAnalysisTask.TaskPriority.URGENT) {
            logger.info("긴급 작업 ID {} 즉시 실행 시도", urgentTask.getId());
            executeTaskAsync(urgentTask);
        }
    }

    /**
     * 스케줄러 일시 정지
     */
    public void pauseScheduler() {
        logger.info("AI Task Scheduler 일시 정지");
        // 실제 구현에서는 스케줄링을 중단하는 로직 필요
    }

    /**
     * 스케줄러 재시작
     */
    public void resumeScheduler() {
        logger.info("AI Task Scheduler 재시작");
        // 실제 구현에서는 스케줄링을 재개하는 로직 필요
    }

    /**
     * 현재 스케줄러 상태 조회
     */
    public SchedulerStatus getSchedulerStatus() {
        return new SchedulerStatus(
            maxConcurrentTasks,
            concurrencyLimiter.availablePermits(),
            taskRepository.countByStatus(AIAnalysisTask.TaskStatus.PENDING),
            taskRepository.countByStatus(AIAnalysisTask.TaskStatus.PROCESSING),
            taskRepository.getQueueDepth()
        );
    }

    /**
     * 스케줄러 상태 정보 클래스
     */
    public static class SchedulerStatus {
        private final int maxConcurrentTasks;
        private final int availableSlots;
        private final long pendingTasks;
        private final long processingTasks;
        private final long queueDepth;

        public SchedulerStatus(int maxConcurrentTasks, int availableSlots, 
                              long pendingTasks, long processingTasks, long queueDepth) {
            this.maxConcurrentTasks = maxConcurrentTasks;
            this.availableSlots = availableSlots;
            this.pendingTasks = pendingTasks;
            this.processingTasks = processingTasks;
            this.queueDepth = queueDepth;
        }

        // Getters
        public int getMaxConcurrentTasks() { return maxConcurrentTasks; }
        public int getAvailableSlots() { return availableSlots; }
        public long getPendingTasks() { return pendingTasks; }
        public long getProcessingTasks() { return processingTasks; }
        public long getQueueDepth() { return queueDepth; }
    }
}