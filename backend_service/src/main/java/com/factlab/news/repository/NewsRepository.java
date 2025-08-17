package com.factlab.news.repository;

import com.factlab.news.entity.News;
import com.factlab.news.entity.News.NewsStatus;
import com.factlab.news.entity.News.NewsVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NewsRepository extends JpaRepository<News, Integer> {
    
    List<News> findByCategory(String category);
    
    @Query("SELECT n FROM News n ORDER BY n.publishDate DESC")
    List<News> findAllOrderByPublishDateDesc();
    
    @Query("SELECT n FROM News n ORDER BY n.publishDate DESC LIMIT :size OFFSET :offset")
    List<News> findAllOrderByPublishDateDesc(@Param("offset") int offset, @Param("size") int size);
    
    @Query("SELECT n FROM News n WHERE n.category = :category ORDER BY n.publishDate DESC")
    List<News> findByCategoryOrderByPublishDateDesc(@Param("category") String category);
    
    @Query("SELECT n FROM News n WHERE n.category = :category ORDER BY n.publishDate DESC LIMIT :size OFFSET :offset")
    List<News> findByCategoryOrderByPublishDateDesc(@Param("category") String category, @Param("offset") int offset, @Param("size") int size);
    
    @Query("SELECT n FROM News n ORDER BY n.publishDate DESC LIMIT :limit")
    List<News> findLatestNews(@Param("limit") int limit);
    
    // 관리자 대시보드용 메서드들
    long countByCreatedAtAfter(LocalDateTime dateTime);
    
    long countByStatus(NewsStatus status);
    
    @Query("SELECT n FROM News n WHERE n.status = :status ORDER BY n.createdAt DESC")
    List<News> findByStatusOrderByCreatedAtDesc(@Param("status") NewsStatus status);
    
    @Query("SELECT n FROM News n WHERE n.status = :status ORDER BY n.publishDate DESC")
    List<News> findByStatusOrderByPublishDateDesc(@Param("status") NewsStatus status);
    
    @Query("SELECT n FROM News n WHERE n.category = :category AND n.status = :status ORDER BY n.publishDate DESC")
    List<News> findByCategoryAndStatusOrderByPublishDateDesc(@Param("category") String category, @Param("status") NewsStatus status);
    
    // 사용자용 공개 뉴스 조회 메서드들 (APPROVED + PUBLIC만)
    @Query("SELECT n FROM News n WHERE n.status = :status AND n.visibility = :visibility ORDER BY n.publishDate DESC")
    List<News> findByStatusAndVisibilityOrderByPublishDateDesc(@Param("status") NewsStatus status, @Param("visibility") NewsVisibility visibility);
    
    @Query("SELECT n FROM News n WHERE n.category = :category AND n.status = :status AND n.visibility = :visibility ORDER BY n.publishDate DESC")
    List<News> findByCategoryAndStatusAndVisibilityOrderByPublishDateDesc(@Param("category") String category, @Param("status") NewsStatus status, @Param("visibility") NewsVisibility visibility);
    
    @Query("SELECT n FROM News n WHERE n.status = :status AND n.visibility = :visibility ORDER BY n.publishDate DESC LIMIT :limit")
    List<News> findLatestByStatusAndVisibility(@Param("status") NewsStatus status, @Param("visibility") NewsVisibility visibility, @Param("limit") int limit);
    
    // NewsSummary와 함께 조회하는 메서드
    @Query("SELECT n FROM News n LEFT JOIN FETCH n.newsSummary WHERE n.id = :id")
    Optional<News> findByIdWithSummary(@Param("id") Integer id);
    
    // 베스트 뉴스 조회 (기간별)
    @Query("SELECT n FROM News n WHERE n.status = :status AND n.visibility = :visibility AND n.approvedAt >= :fromDate ORDER BY n.approvedAt DESC")
    List<News> findByStatusAndVisibilityAndApprovedAtAfterOrderByApprovedAtDesc(@Param("status") NewsStatus status, @Param("visibility") NewsVisibility visibility, @Param("fromDate") LocalDateTime fromDate);
    
    // 다중 상태값으로 뉴스 조회 (AI 분석 페이지용)
    @Query("SELECT n FROM News n WHERE n.status IN :statusList ORDER BY n.publishDate DESC LIMIT :size OFFSET :offset")
    List<News> findByStatusInOrderByPublishDateDesc(@Param("statusList") List<NewsStatus> statusList, @Param("offset") int offset, @Param("size") int size);
}