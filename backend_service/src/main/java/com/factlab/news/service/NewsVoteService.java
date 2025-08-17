package com.factlab.news.service;

import com.factlab.news.dto.UserVoteDto;
import com.factlab.news.dto.VoteRequestDto;
import com.factlab.news.dto.VoteResultDto;
import com.factlab.news.entity.News;
import com.factlab.news.entity.NewsVote;
import com.factlab.news.repository.NewsRepository;
import com.factlab.news.repository.NewsVoteRepository;
import com.factlab.user.entity.User;
import com.factlab.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class NewsVoteService {
    
    @Autowired
    private NewsVoteRepository newsVoteRepository;
    
    @Autowired
    private NewsRepository newsRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * 뉴스에 투표하기
     */
    public UserVoteDto voteNews(Integer newsId, VoteRequestDto voteRequest) {
        // 뉴스 존재 확인
        News news = newsRepository.findById(newsId)
                .orElseThrow(() -> new RuntimeException("뉴스를 찾을 수 없습니다."));
        
        // 사용자 존재 확인
        User user = userRepository.findById(voteRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        // 투표 유형 변환
        NewsVote.VoteType voteType;
        try {
            voteType = NewsVote.VoteType.fromValue(voteRequest.getVoteType());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("유효하지 않은 투표 유형입니다: " + voteRequest.getVoteType());
        }
        
        // 기존 투표 확인
        Optional<NewsVote> existingVote = newsVoteRepository.findByNewsIdAndUserId(newsId, voteRequest.getUserId());
        
        NewsVote vote;
        if (existingVote.isPresent()) {
            // 기존 투표 업데이트
            vote = existingVote.get();
            vote.setVoteType(voteType);
        } else {
            // 새 투표 생성
            vote = new NewsVote(news, user, voteType);
        }
        
        NewsVote savedVote = newsVoteRepository.save(vote);
        return new UserVoteDto(savedVote);
    }
    
    /**
     * 뉴스의 투표 결과 조회
     */
    @Transactional(readOnly = true)
    public VoteResultDto getVoteResults(Integer newsId) {
        // 뉴스 존재 확인
        newsRepository.findById(newsId)
                .orElseThrow(() -> new RuntimeException("뉴스를 찾을 수 없습니다."));
        
        List<Object[]> voteResults = newsVoteRepository.countVotesByNewsId(newsId);
        
        VoteResultDto result = new VoteResultDto();
        
        for (Object[] row : voteResults) {
            NewsVote.VoteType voteType = (NewsVote.VoteType) row[0];
            Long count = (Long) row[1];
            
            switch (voteType) {
                case FACT:
                    result.setFact(count);
                    break;
                case PARTIAL_FACT:
                    result.setPartial_fact(count);
                    break;
                case SLIGHT_DOUBT:
                    result.setSlight_doubt(count);
                    break;
                case DOUBT:
                    result.setDoubt(count);
                    break;
                case UNKNOWN:
                    result.setUnknown(count);
                    break;
            }
        }
        
        return result;
    }
    
    /**
     * 사용자의 특정 뉴스에 대한 투표 조회
     */
    @Transactional(readOnly = true)
    public Optional<UserVoteDto> getUserVote(Integer newsId, Long userId) {
        Optional<NewsVote> vote = newsVoteRepository.findByNewsIdAndUserId(newsId, userId);
        return vote.map(UserVoteDto::new);
    }
    
    /**
     * 사용자의 모든 투표 목록 조회
     */
    @Transactional(readOnly = true)
    public List<UserVoteDto> getUserVotes(Long userId) {
        List<NewsVote> votes = newsVoteRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return votes.stream()
                .map(UserVoteDto::new)
                .toList();
    }
}