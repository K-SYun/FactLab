package com.factlab.news.service;

import com.factlab.news.dto.NewsDto;
import com.factlab.news.dto.TrendingKeywordDto;
import com.factlab.news.entity.News;
import com.factlab.news.entity.News.NewsVisibility;
import com.factlab.news.entity.NewsSummary;
import com.factlab.news.entity.NewsVote;
import com.factlab.news.repository.NewsRepository;
import com.factlab.news.repository.NewsSummaryRepository;
import com.factlab.news.repository.NewsVoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NewsService {

    @Autowired
    private NewsRepository newsRepository;
    
    @Autowired
    private NewsSummaryRepository newsSummaryRepository;
    
    @Autowired
    private NewsVoteRepository newsVoteRepository;

    public List<NewsDto> getAllNews() {
        return newsRepository.findAllOrderByPublishDateDesc()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<NewsDto> getAllNews(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<News> newsPage = newsRepository.findAllOrderByPublishDateDesc(pageable);
        return newsPage.getContent()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<NewsDto> getNewsByStatus(String statusString, int page, int size) {
        try {
            // 쉼표로 구분된 여러 상태값 처리 (예: "pending,processing")
            String[] statusArray = statusString.split(",");
            List<News.NewsStatus> statusList = new ArrayList<>();
            
            for (String s : statusArray) {
                String cleanStatus = s.trim().toUpperCase();
                try {
                    News.NewsStatus status = News.NewsStatus.valueOf(cleanStatus);
                    statusList.add(status);
                } catch (IllegalArgumentException e) {
                    System.err.println("Invalid status value: " + cleanStatus);
                }
            }
            
            if (statusList.isEmpty()) {
                return new ArrayList<>();
            }
            
            Pageable pageable = PageRequest.of(page, size);
            Page<News> newsPage = newsRepository.findByStatusInOrderByPublishDateDesc(statusList, pageable);
            return newsPage.getContent()
                    .stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            System.err.println("Error in getNewsByStatus: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<NewsDto> getNewsByCategory(String category) {
        return newsRepository.findByCategoryOrderByPublishDateDesc(category)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<NewsDto> getNewsByCategory(String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<News> newsPage = newsRepository.findByCategoryOrderByPublishDateDesc(category, pageable);
        return newsPage.getContent()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public Optional<NewsDto> getNewsById(Integer id) {
        return newsRepository.findById(id)
                .map(this::convertToDto);
    }

    public List<NewsDto> getLatestNews(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<News> newsList = newsRepository.findLatestNews(pageable);
        return newsList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<NewsDto> getLatestApprovedNews(int limit) {
        // 승인되고 공개된 뉴스만 조회
        List<News> allApprovedNews = newsRepository.findByStatusAndVisibilityOrderByPublishDateDesc(
            News.NewsStatus.APPROVED, NewsVisibility.PUBLIC);
        
        // 승인 시간 기준으로 내림차순 정렬 (승인시간이 null인 경우는 updated_at 사용)
        allApprovedNews.sort((a, b) -> {
            LocalDateTime aTime = a.getApprovedAt() != null ? a.getApprovedAt() : a.getUpdatedAt();
            LocalDateTime bTime = b.getApprovedAt() != null ? b.getApprovedAt() : b.getUpdatedAt();
            return bTime.compareTo(aTime);
        });
        
        int toIndex = Math.min(limit, allApprovedNews.size());
        
        return allApprovedNews.subList(0, toIndex)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<NewsDto> getApprovedNews(int page, int size) {
        // 승인되고 공개된 뉴스만 조회
        List<News> allApprovedNews = newsRepository.findByStatusAndVisibilityOrderByPublishDateDesc(
            News.NewsStatus.APPROVED, NewsVisibility.PUBLIC);
        
        // 승인 시간 기준으로 내림차순 정렬
        allApprovedNews.sort((a, b) -> {
            LocalDateTime aTime = a.getApprovedAt() != null ? a.getApprovedAt() : a.getUpdatedAt();
            LocalDateTime bTime = b.getApprovedAt() != null ? b.getApprovedAt() : b.getUpdatedAt();
            return bTime.compareTo(aTime);
        });
        
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, allApprovedNews.size());
        
        if (fromIndex >= allApprovedNews.size()) {
            return new ArrayList<>();
        }
        
        return allApprovedNews.subList(fromIndex, toIndex)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<NewsDto> getApprovedNewsByCategory(String category, int page, int size) {
        List<News> allApprovedNewsInCategory = newsRepository.findByCategoryAndStatusAndVisibilityOrderByPublishDateDesc(category, News.NewsStatus.APPROVED, NewsVisibility.PUBLIC);
        
        // 승인 시간 기준으로 내림차순 정렬
        allApprovedNewsInCategory.sort((a, b) -> {
            LocalDateTime aTime = a.getApprovedAt() != null ? a.getApprovedAt() : a.getUpdatedAt();
            LocalDateTime bTime = b.getApprovedAt() != null ? b.getApprovedAt() : b.getUpdatedAt();
            return bTime.compareTo(aTime);
        });
        
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, allApprovedNewsInCategory.size());
        
        if (fromIndex >= allApprovedNewsInCategory.size()) {
            return new ArrayList<>();
        }
        
        return allApprovedNewsInCategory.subList(fromIndex, toIndex)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }


    // 뉴스 상태 업데이트
    public NewsDto updateNewsStatus(Integer newsId, News.NewsStatus status) {
        News news = newsRepository.findById(newsId)
                .orElseThrow(() -> new RuntimeException("뉴스를 찾을 수 없습니다: " + newsId));
        
        news.setStatus(status);
        
        // 승인 상태로 변경될 때 승인 시간 설정
        if (status == News.NewsStatus.APPROVED) {
            news.setApprovedAt(LocalDateTime.now());
        }
        
        news = newsRepository.save(news);
        
        return convertToDto(news);
    }

    // 여러 뉴스 상태 일괄 업데이트
    public int bulkUpdateStatus(java.util.List<Integer> newsIds, News.NewsStatus status) {
        int updatedCount = 0;
        for (Integer newsId : newsIds) {
            try {
                updateNewsStatus(newsId, status);
                updatedCount++;
            } catch (RuntimeException e) {
                // 개별 실패는 로그만 남기고 계속 진행
                System.err.println("Failed to update news " + newsId + ": " + e.getMessage());
            }
        }
        return updatedCount;
    }

    // 대기 중인 모든 뉴스 승인
    public int approveAllPendingNews() {
        java.util.List<News> pendingNews = newsRepository.findByStatusOrderByPublishDateDesc(News.NewsStatus.PENDING);
        int updatedCount = 0;
        
        for (News news : pendingNews) {
            try {
                news.setStatus(News.NewsStatus.APPROVED);
                news.setApprovedAt(LocalDateTime.now()); // 승인 시간 설정
                newsRepository.save(news);
                updatedCount++;
            } catch (Exception e) {
                System.err.println("Failed to approve news " + news.getId() + ": " + e.getMessage());
            }
        }
        
        return updatedCount;
    }

    // 뉴스 노출/미노출 토글
    public NewsDto updateNewsVisibility(Integer newsId, boolean visible) {
        News news = newsRepository.findById(newsId)
                .orElseThrow(() -> new RuntimeException("뉴스를 찾을 수 없습니다: " + newsId));
        
        // 승인된 뉴스만 노출 설정 변경 가능
        if (news.getStatus() != News.NewsStatus.APPROVED) {
            throw new RuntimeException("승인된 뉴스만 노출 설정을 변경할 수 있습니다.");
        }
        
        NewsVisibility newVisibility = visible ? NewsVisibility.PUBLIC : NewsVisibility.PRIVATE;
        news.setVisibility(newVisibility);
        
        news = newsRepository.save(news);
        
        return convertToDto(news);
    }

    // 뉴스 삭제
    public void deleteNews(Integer newsId) {
        News news = newsRepository.findById(newsId)
                .orElseThrow(() -> new RuntimeException("뉴스를 찾을 수 없습니다: " + newsId));
        
        newsRepository.delete(news);
    }

    // 모든 뉴스 삭제 (테스트용)
    public int deleteAllNews() {
        java.util.List<News> allNews = newsRepository.findAll();
        int deleteCount = allNews.size();
        
        newsRepository.deleteAll();
        
        return deleteCount;
    }

    // 디버그용: NewsSummary 직접 조회
    public Optional<NewsSummary> getNewsSummaryById(Integer newsId) {
        List<NewsSummary> summaries = newsSummaryRepository.findByNewsIdOrderByUpdatedAtDesc(newsId);
        return summaries.isEmpty() ? Optional.empty() : Optional.of(summaries.get(0));
    }

    // 트렌딩 키워드 조회 (승인된 뉴스의 키워드 중 가장 많이 사용된 상위 10개)
    public List<TrendingKeywordDto> getTrendingKeywords() {
        try {
            // 승인된 뉴스만 조회
            List<News> approvedNews = newsRepository.findByStatusAndVisibilityOrderByPublishDateDesc(
                News.NewsStatus.APPROVED, NewsVisibility.PUBLIC);
            
            // 키워드 빈도수 계산을 위한 맵
            Map<String, Long> keywordCount = new HashMap<>();
            
            // 각 뉴스의 키워드를 추출하여 카운트
            for (News news : approvedNews) {
                List<NewsSummary> summaries = newsSummaryRepository.findByNewsIdOrderByUpdatedAtDesc(news.getId());
                Optional<NewsSummary> summaryOpt = summaries.isEmpty() ? Optional.empty() : Optional.of(summaries.get(0));
                if (summaryOpt.isPresent() && summaryOpt.get().getKeywords() != null) {
                    String keywords = summaryOpt.get().getKeywords();
                    // 키워드를 쉼표로 분리하여 각각 카운트
                    String[] keywordArray = keywords.split(",");
                    for (String keyword : keywordArray) {
                        String cleanKeyword = keyword.trim();
                        if (!cleanKeyword.isEmpty()) {
                            // #이 없으면 추가
                            if (!cleanKeyword.startsWith("#")) {
                                cleanKeyword = "#" + cleanKeyword;
                            }
                            keywordCount.put(cleanKeyword, keywordCount.getOrDefault(cleanKeyword, 0L) + 1);
                        }
                    }
                }
            }
            
            // 빈도수 순으로 정렬하여 상위 10개 추출
            List<TrendingKeywordDto> trendingKeywords = keywordCount.entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue())) // 내림차순 정렬
                .limit(10) // 상위 10개만
                .map(entry -> new TrendingKeywordDto(
                    entry.getKey().replace("#", ""), // # 제거해서 저장
                    entry.getValue()
                ))
                .collect(Collectors.toList());
            
            // 데이터가 없는 경우 기본 키워드 반환
            if (trendingKeywords.isEmpty()) {
                List<TrendingKeywordDto> defaultTrending = new ArrayList<>();
                List<String> defaultKeywords = Arrays.asList(
                    "AI일자리", "백신효과", "탄소중립", "팩트체크", "기후변화",
                    "집중호우", "태풍", "갑질폭로", "부동산", "주식시장"
                );
                for (int i = 0; i < defaultKeywords.size(); i++) {
                    defaultTrending.add(new TrendingKeywordDto(defaultKeywords.get(i), (long)(50 - i * 3)));
                }
                return defaultTrending;
            }
            
            return trendingKeywords;
            
        } catch (Exception e) {
            System.err.println("Error fetching trending keywords: " + e.getMessage());
            e.printStackTrace();
            
            // 에러 시 기본 키워드 반환
            List<TrendingKeywordDto> errorDefaultTrending = new ArrayList<>();
            List<String> defaultKeywords = Arrays.asList(
                "AI일자리", "백신효과", "탄소중립", "팩트체크", "기후변화",
                "집중호우", "태풍", "갑질폭로", "부동산", "주식시장"
            );
            for (int i = 0; i < defaultKeywords.size(); i++) {
                errorDefaultTrending.add(new TrendingKeywordDto(defaultKeywords.get(i), (long)(50 - i * 3)));
            }
            return errorDefaultTrending;
        }
    }

    private NewsDto convertToDto(News news) {
        NewsDto dto = new NewsDto(
                news.getId(),
                news.getTitle(),
                news.getContent(),
                news.getUrl(),
                news.getSource(),
                news.getPublishDate(),
                news.getCategory(),
                news.getStatus().toString().toLowerCase(),
                news.getApprovedAt()
        );
        
        // AI 분석 관련 필드들은 NewsSummary에서 직접 조회
        try {
            System.out.println("DEBUG: Loading AI summary for news ID: " + news.getId());
            List<NewsSummary> summaries = newsSummaryRepository.findByNewsIdOrderByUpdatedAtDesc(news.getId());
            Optional<NewsSummary> summaryOpt = summaries.isEmpty() ? Optional.empty() : Optional.of(summaries.get(0));
            System.out.println("DEBUG: Repository query result present: " + summaryOpt.isPresent());
            
            if (summaryOpt.isPresent()) {
                NewsSummary summary = summaryOpt.get();
                System.out.println("DEBUG: Found summary - Summary: " + (summary.getSummary() != null ? summary.getSummary().substring(0, Math.min(50, summary.getSummary().length())) + "..." : "null"));
                System.out.println("DEBUG: Found summary - Keywords: " + summary.getKeywords());
                System.out.println("DEBUG: Found summary - Reliability Score: " + summary.getReliabilityScore());
                
                dto.setAiSummary(summary.getSummary());
                dto.setAiAnalysisResult(summary.getClaim());
                dto.setReliabilityScore(summary.getReliabilityScore());
                dto.setConfidenceScore(summary.getAiConfidence());
                dto.setAiKeywords(summary.getKeywords());
                dto.setSuspiciousPoints(summary.getSuspiciousPoints());
                dto.setAnalysisType(summary.getAnalysisType() != null ? summary.getAnalysisType().toString() : null);
                dto.setDetailedAnalysis(summary.getFullAnalysisResult());

                System.out.println("DEBUG: DTO after setting AI data - aiSummary: " + dto.getAiSummary());
                System.out.println("DEBUG: DTO after setting AI data - analysisType: " + dto.getAnalysisType());
            } else {
                System.out.println("DEBUG: No completed summary found for news ID: " + news.getId() + ". Trying latest summary...");
                // 완료된 것이 없으면 최신 것을 찾아보자
                // 이미 위에서 조회했으므로 같은 결과 사용
                Optional<NewsSummary> latestSummaryOpt = summaries.isEmpty() ? Optional.empty() : Optional.of(summaries.get(0));
                if (latestSummaryOpt.isPresent()) {
                    NewsSummary summary = latestSummaryOpt.get();
                    System.out.println("DEBUG: Found latest summary - Status: " + summary.getStatus());

                    dto.setAiSummary(summary.getSummary());
                    dto.setAiAnalysisResult(summary.getClaim());
                    dto.setReliabilityScore(summary.getReliabilityScore());
                    dto.setConfidenceScore(summary.getAiConfidence());
                    dto.setAiKeywords(summary.getKeywords());
                    dto.setSuspiciousPoints(summary.getSuspiciousPoints());
                    dto.setAnalysisType(summary.getAnalysisType() != null ? summary.getAnalysisType().toString() : null);
                    dto.setDetailedAnalysis(summary.getFullAnalysisResult());
                } else {
                    System.out.println("DEBUG: No summary found at all for news ID: " + news.getId());
                }
            }
        } catch (Exception e) {
            // AI 분석 결과 조회 실패시 로그만 남기고 계속 진행
            System.err.println("Failed to load AI summary for news " + news.getId() + ": " + e.getMessage());
            e.printStackTrace();
        }
        
        dto.setThumbnail(news.getThumbnail());
        
        // Original publish date 설정
        dto.setOriginalPublishDate(news.getOriginalPublishDate());
        
        // Visibility 필드 설정
        dto.setVisibility(news.getVisibility() != null ? news.getVisibility().toString() : "PUBLIC");
        
        // 메인 노출 관련 필드 설정
        dto.setMainFeatured(news.getMainFeatured());
        dto.setMainDisplayOrder(news.getMainDisplayOrder());
        dto.setFeaturedAt(news.getFeaturedAt());
        
        // 조회수 설정
        dto.setViewCount(news.getViewCount());
        
        // 투표 통계 계산
        try {
            List<Object[]> voteResults = newsVoteRepository.countVotesByNewsId(news.getId());
            
            int factCount = 0;      // fact + partial_fact
            int doubtCount = 0;     // slight_doubt + doubt  
            int unknownCount = 0;   // unknown
            int totalVotes = 0;
            
            for (Object[] result : voteResults) {
                NewsVote.VoteType voteType = (NewsVote.VoteType) result[0];
                Long count = (Long) result[1];
                int countInt = count.intValue();
                totalVotes += countInt;
                
                switch (voteType) {
                    case FACT:
                    case PARTIAL_FACT:
                        factCount += countInt;
                        break;
                    case SLIGHT_DOUBT:
                    case DOUBT:
                        doubtCount += countInt;
                        break;
                    case UNKNOWN:
                        unknownCount += countInt;
                        break;
                }
            }
            
            dto.setFactCount(factCount);
            dto.setDoubtCount(doubtCount);
            dto.setUnknownCount(unknownCount);
            dto.setTotalVotes(totalVotes);
            
        } catch (Exception e) {
            // 투표 통계 조회 실패시 기본값 설정
            System.err.println("Failed to load vote statistics for news " + news.getId() + ": " + e.getMessage());
            dto.setFactCount(0);
            dto.setDoubtCount(0);
            dto.setUnknownCount(0);
            dto.setTotalVotes(0);
        }
        
        // 최종 DTO 반환 직전 디버그 로그
        System.out.println("DEBUG: FINAL DTO for news ID " + news.getId() + " - aiSummary: " + (dto.getAiSummary() != null ? dto.getAiSummary().substring(0, Math.min(50, dto.getAiSummary().length())) + "..." : "null"));
        System.out.println("DEBUG: FINAL DTO for news ID " + news.getId() + " - aiAnalysisResult: " + (dto.getAiAnalysisResult() != null ? dto.getAiAnalysisResult().substring(0, Math.min(50, dto.getAiAnalysisResult().length())) + "..." : "null"));
        System.out.println("DEBUG: FINAL DTO for news ID " + news.getId() + " - reliabilityScore: " + dto.getReliabilityScore());
        
        return dto;
    }

    /**
     * 조회수 기준 베스트 뉴스 조회 (일일/주간/월간)
     */
    public List<NewsDto> getBestNewsByPeriod(String period, int limit) {
        LocalDateTime fromDate;
        LocalDateTime now = LocalDateTime.now();
        
        switch (period.toLowerCase()) {
            case "daily":
            case "일일":
                fromDate = now.minusDays(1);
                break;
            case "weekly":
            case "주간":
                fromDate = now.minusDays(7);
                break;
            case "monthly":
            case "월간":
                fromDate = now.minusDays(30);
                break;
            default:
                fromDate = now.minusDays(1); // 기본값은 일일
        }
        
        // 승인되고 공개된 뉴스 중에서 기간별로 조회수 기준 정렬
        // 현재는 조회수 필드가 없으므로 승인 시간 기준으로 정렬하되, 향후 조회수 필드 추가시 수정 예정
        List<News> bestNews = newsRepository.findByStatusAndVisibilityAndApprovedAtAfterOrderByApprovedAtDesc(
            News.NewsStatus.APPROVED, NewsVisibility.PUBLIC, fromDate);
        
        return bestNews.stream()
                .limit(limit)
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 메인 페이지 실시간 이슈 뉴스 조회 (관리자가 지정한 뉴스)
    public List<NewsDto> getFeaturedNews() {
        List<News> featuredNews = newsRepository.findByMainFeaturedTrueAndStatusAndVisibilityOrderByMainDisplayOrder(
            News.NewsStatus.APPROVED, NewsVisibility.PUBLIC);
        
        return featuredNews.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 카테고리별 분석 완료된 뉴스 조회 (AI 분석이 완료된 승인된 뉴스)
    public List<NewsDto> getAnalyzedNewsByCategory(String category, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        List<News> analyzedNews = newsRepository.findAnalyzedNewsByCategory(category, pageable);

        return analyzedNews.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // 뉴스를 메인에 노출하도록 설정
    public void setMainFeatured(Integer newsId, Integer displayOrder) {
        Optional<News> newsOpt = newsRepository.findById(newsId);
        if (newsOpt.isPresent()) {
            News news = newsOpt.get();
            news.setMainFeatured(true);
            news.setMainDisplayOrder(displayOrder);
            news.setFeaturedAt(LocalDateTime.now());
            newsRepository.save(news);
        }
    }

    // 뉴스를 메인에서 제거
    public void removeMainFeatured(Integer newsId) {
        Optional<News> newsOpt = newsRepository.findById(newsId);
        if (newsOpt.isPresent()) {
            News news = newsOpt.get();
            news.setMainFeatured(false);
            news.setMainDisplayOrder(null);
            news.setFeaturedAt(null);
            newsRepository.save(news);
        }
    }

    // 메인 노출 순서 업데이트
    public void updateMainDisplayOrder(Integer newsId, Integer newOrder) {
        Optional<News> newsOpt = newsRepository.findById(newsId);
        if (newsOpt.isPresent()) {
            News news = newsOpt.get();
            if (news.getMainFeatured()) {
                news.setMainDisplayOrder(newOrder);
                newsRepository.save(news);
            }
        }
    }

    // 뉴스 조회수 증가
    public void increaseViewCount(Integer newsId) {
        Optional<News> newsOpt = newsRepository.findById(newsId);
        if (newsOpt.isPresent()) {
            News news = newsOpt.get();
            news.incrementViewCount();
            newsRepository.save(news);
        } else {
            throw new RuntimeException("뉴스를 찾을 수 없습니다: " + newsId);
        }
    }
}