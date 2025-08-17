package com.factlab.news.repository;

import com.factlab.news.entity.NewsVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NewsVoteRepository extends JpaRepository<NewsVote, Long> {
    
    /**
     * 특정 뉴스에 대한 특정 사용자의 투표 조회
     */
    Optional<NewsVote> findByNewsIdAndUserId(Integer newsId, Long userId);
    
    /**
     * 특정 뉴스의 투표 결과 집계
     */
    @Query("SELECT nv.voteType, COUNT(nv) FROM NewsVote nv WHERE nv.news.id = :newsId GROUP BY nv.voteType")
    List<Object[]> countVotesByNewsId(@Param("newsId") Integer newsId);
    
    /**
     * 특정 뉴스의 전체 투표 수
     */
    Long countByNewsId(Integer newsId);
    
    /**
     * 특정 사용자의 모든 투표 조회
     */
    List<NewsVote> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    /**
     * 특정 뉴스의 모든 투표 조회 (관리자용)
     */
    List<NewsVote> findByNewsIdOrderByCreatedAtDesc(Integer newsId);
}