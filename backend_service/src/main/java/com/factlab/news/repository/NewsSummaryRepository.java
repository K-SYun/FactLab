package com.factlab.news.repository;

import com.factlab.news.entity.NewsSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NewsSummaryRepository extends JpaRepository<NewsSummary, Integer> {

    // 뉴스 ID로 요약 조회 (기본: 첫 번째 찾은 것)
    @Query("SELECT ns FROM NewsSummary ns WHERE ns.newsId = ?1")
    Optional<NewsSummary> findSummaryByNewsId(Integer newsId);

    // 뉴스 ID와 분석 타입으로 요약 조회
    Optional<NewsSummary> findByNewsIdAndAnalysisType(Integer newsId, NewsSummary.AnalysisType analysisType);

    // 뉴스 ID로 모든 분석 타입 조회
    List<NewsSummary> findByNewsIdOrderByCreatedAtDesc(Integer newsId);

    // 상태별 요약 조회
    List<NewsSummary> findByStatusOrderByCreatedAtDesc(NewsSummary.SummaryStatus status);

    // 모든 요약을 최신순으로 조회 (페이징)
    @Query("SELECT ns FROM NewsSummary ns ORDER BY ns.createdAt DESC LIMIT :limit OFFSET :offset")
    List<NewsSummary> findAllOrderByCreatedAtDesc(@Param("offset") int offset, @Param("limit") int limit);

    // 상태별 요약 조회 (페이징)
    @Query("SELECT ns FROM NewsSummary ns WHERE ns.status = :status ORDER BY ns.createdAt DESC LIMIT :limit OFFSET :offset")
    List<NewsSummary> findByStatusOrderByCreatedAtDesc(@Param("status") NewsSummary.SummaryStatus status, 
                                                       @Param("offset") int offset, 
                                                       @Param("limit") int limit);

    // 분석 타입별 요약 조회 (페이징)
    @Query("SELECT ns FROM NewsSummary ns WHERE ns.analysisType = :analysisType ORDER BY ns.createdAt DESC LIMIT :limit OFFSET :offset")
    List<NewsSummary> findByAnalysisTypeOrderByCreatedAtDesc(@Param("analysisType") NewsSummary.AnalysisType analysisType, 
                                                            @Param("offset") int offset, 
                                                            @Param("limit") int limit);

    // 상태와 분석 타입으로 요약 조회 (페이징)
    @Query("SELECT ns FROM NewsSummary ns WHERE ns.status = :status AND ns.analysisType = :analysisType ORDER BY ns.createdAt DESC LIMIT :limit OFFSET :offset")
    List<NewsSummary> findByStatusAndAnalysisTypeOrderByCreatedAtDesc(@Param("status") NewsSummary.SummaryStatus status,
                                                                     @Param("analysisType") NewsSummary.AnalysisType analysisType,
                                                                     @Param("offset") int offset, 
                                                                     @Param("limit") int limit);

    // 특정 기간 내 요약 조회
    List<NewsSummary> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime startDate, LocalDateTime endDate);

    // 신뢰도 점수 범위로 조회
    @Query("SELECT ns FROM NewsSummary ns WHERE ns.reliabilityScore >= :minScore AND ns.reliabilityScore <= :maxScore ORDER BY ns.reliabilityScore DESC")
    List<NewsSummary> findByReliabilityScoreBetween(@Param("minScore") Integer minScore, @Param("maxScore") Integer maxScore);

    // AI 신뢰도 점수 범위로 조회
    @Query("SELECT ns FROM NewsSummary ns WHERE ns.aiConfidence >= :minConfidence ORDER BY ns.aiConfidence DESC")
    List<NewsSummary> findByAiConfidenceGreaterThanEqual(@Param("minConfidence") Integer minConfidence);

    // 처리 실패한 요약 조회
    List<NewsSummary> findByStatusAndErrorMessageIsNotNullOrderByCreatedAtDesc(NewsSummary.SummaryStatus status);

    // 특정 AI 모델로 생성된 요약 조회
    List<NewsSummary> findByAiModelOrderByCreatedAtDesc(String aiModel);

    // 상태별 개수 조회
    @Query("SELECT COUNT(ns) FROM NewsSummary ns WHERE ns.status = :status")
    long countByStatus(@Param("status") NewsSummary.SummaryStatus status);

    // 평균 처리 시간 조회 (완료된 작업만)
    @Query("SELECT AVG(ns.processingTime) FROM NewsSummary ns WHERE ns.status = 'COMPLETED' AND ns.processingTime IS NOT NULL")
    Double getAverageProcessingTime();

    // 신뢰도 통계 조회
    @Query("SELECT COUNT(ns) FROM NewsSummary ns WHERE ns.aiConfidence >= :threshold")
    long countByAiConfidenceGreaterThanEqual(@Param("threshold") Integer threshold);

    // 최근 완료된 요약 조회
    @Query("SELECT ns FROM NewsSummary ns WHERE ns.status = 'COMPLETED' ORDER BY ns.updatedAt DESC LIMIT :limit")
    List<NewsSummary> findRecentCompletedSummaries(@Param("limit") int limit);

    // 처리 중인 오래된 작업 조회 (타임아웃 체크용)
    @Query("SELECT ns FROM NewsSummary ns WHERE ns.status = 'PROCESSING' AND ns.createdAt < :timeoutThreshold")
    List<NewsSummary> findStuckProcessingTasks(@Param("timeoutThreshold") LocalDateTime timeoutThreshold);

    // 승인된 뉴스의 키워드 조회 (트렌딩 키워드용)
    @Query("SELECT ns.keywords FROM NewsSummary ns " +
           "JOIN News n ON ns.newsId = n.id " +
           "WHERE n.status = 'APPROVED' AND ns.keywords IS NOT NULL AND ns.keywords <> ''")
    List<String> findApprovedKeywords();
}