package com.factlab.admin.service;

import com.factlab.admin.controller.AdminNewsController.AIAnalysisRequest;
import com.factlab.ai.service.AIAnalysisService;
import com.factlab.news.entity.News;
import com.factlab.news.entity.News.NewsStatus;
import com.factlab.news.entity.News.NewsVisibility;
import com.factlab.news.repository.NewsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AdminNewsService {

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private AIAnalysisService aiAnalysisService;

    public Page<News> getPendingNews(Pageable pageable) {
        // PENDING과 REVIEW_PENDING 상태 모두 조회
        List<News> pendingNews = newsRepository.findByStatusOrderByCreatedAtDesc(NewsStatus.PENDING);
        List<News> reviewPendingNews = newsRepository.findByStatusOrderByCreatedAtDesc(NewsStatus.REVIEW_PENDING);
        
        List<News> allPendingNews = new ArrayList<>();
        allPendingNews.addAll(reviewPendingNews); // REVIEW_PENDING을 먼저 (우선순위)
        allPendingNews.addAll(pendingNews);
        
        // 페이징 처리
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allPendingNews.size());
        
        if (start > allPendingNews.size()) {
            return new PageImpl<>(new ArrayList<>(), pageable, allPendingNews.size());
        }
        
        List<News> pageContent = allPendingNews.subList(start, end);
        return new PageImpl<>(pageContent, pageable, allPendingNews.size());
    }

    public Page<News> getReviewPendingNews(Pageable pageable) {
        // AI 분석 완료 후 관리자 검토 대기 중인 뉴스만 조회
        List<News> reviewPendingNews = newsRepository.findByStatusOrderByCreatedAtDesc(NewsStatus.REVIEW_PENDING);
        
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), reviewPendingNews.size());
        
        if (start > reviewPendingNews.size()) {
            return new PageImpl<>(new ArrayList<>(), pageable, reviewPendingNews.size());
        }
        
        List<News> pageContent = reviewPendingNews.subList(start, end);
        return new PageImpl<>(pageContent, pageable, reviewPendingNews.size());
    }

    public void approveNews(Integer newsId) {
        Optional<News> newsOptional = newsRepository.findById(newsId);
        if (newsOptional.isPresent()) {
            News news = newsOptional.get();
            news.setStatus(NewsStatus.APPROVED);
            newsRepository.save(news);
        } else {
            throw new RuntimeException("뉴스를 찾을 수 없습니다: " + newsId);
        }
    }

    public void rejectNews(Integer newsId, String reason) {
        Optional<News> newsOptional = newsRepository.findById(newsId);
        if (newsOptional.isPresent()) {
            News news = newsOptional.get();
            news.setStatus(NewsStatus.REJECTED);
            // 실제로는 rejection_reason 필드에 저장
            newsRepository.save(news);
        } else {
            throw new RuntimeException("뉴스를 찾을 수 없습니다: " + newsId);
        }
    }

    public Object getNewsStatistics() {
        long totalNews = newsRepository.count();
        long pendingNews = newsRepository.countByStatus(NewsStatus.PENDING);
        long processingNews = newsRepository.countByStatus(NewsStatus.PROCESSING);
        long reviewPendingNews = newsRepository.countByStatus(NewsStatus.REVIEW_PENDING);
        long approvedNews = newsRepository.countByStatus(NewsStatus.APPROVED);
        long rejectedNews = newsRepository.countByStatus(NewsStatus.REJECTED);

        return new Object() {
            public final long total = totalNews;
            public final long pending = pendingNews;
            public final long processing = processingNews;
            public final long reviewPending = reviewPendingNews;
            public final long approved = approvedNews;
            public final long rejected = rejectedNews;
            public final double approvalRate = totalNews > 0 ? (double) approvedNews / totalNews * 100 : 0;
            public final long awaitingReview = pendingNews + reviewPendingNews; // 검토 대기 총합
        };
    }

    public void saveAIAnalysis(Integer newsId, AIAnalysisRequest request) {
        Optional<News> newsOptional = newsRepository.findById(newsId);
        if (newsOptional.isPresent()) {
            News news = newsOptional.get();
            
            // AI 분석이 완료되었으므로 상태를 REVIEW_PENDING으로 변경
            news.setStatus(NewsStatus.REVIEW_PENDING);
            
            newsRepository.save(news);
        } else {
            throw new RuntimeException("뉴스를 찾을 수 없습니다: " + newsId);
        }
    }

    public String toggleNewsVisibility(Integer newsId) {
        Optional<News> newsOptional = newsRepository.findById(newsId);
        if (newsOptional.isPresent()) {
            News news = newsOptional.get();
            
            // 승인된 뉴스만 공개/비공개 토글 가능
            if (news.getStatus() != NewsStatus.APPROVED) {
                throw new RuntimeException("승인된 뉴스만 공개 상태를 변경할 수 있습니다");
            }
            
            // 현재 상태를 토글
            NewsVisibility currentVisibility = news.getVisibility();
            NewsVisibility newVisibility = currentVisibility == NewsVisibility.PUBLIC 
                ? NewsVisibility.PRIVATE 
                : NewsVisibility.PUBLIC;
                
            news.setVisibility(newVisibility);
            newsRepository.save(news);
            
            return newVisibility.toString();
        } else {
            throw new RuntimeException("뉴스를 찾을 수 없습니다: " + newsId);
        }
    }

    public void requestAIAnalysis(Integer newsId, String analysisType) {
        Optional<News> newsOptional = newsRepository.findById(newsId);
        if (newsOptional.isPresent()) {
            News news = newsOptional.get();

            // 뉴스 상태를 PROCESSING으로 변경
            news.setStatus(NewsStatus.PROCESSING);
            newsRepository.save(news);

            // 실제 AI 분석 서비스 호출
            aiAnalysisService.analyzeNews(newsId, analysisType);

        } else {
            throw new RuntimeException("뉴스를 찾을 수 없습니다: " + newsId);
        }
    }
}