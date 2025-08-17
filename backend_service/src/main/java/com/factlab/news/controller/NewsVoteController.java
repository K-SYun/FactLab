package com.factlab.news.controller;

import com.factlab.common.dto.ApiResponse;
import com.factlab.news.dto.UserVoteDto;
import com.factlab.news.dto.VoteRequestDto;
import com.factlab.news.dto.VoteResultDto;
import com.factlab.news.service.NewsVoteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/news")
@CrossOrigin(origins = "*")
public class NewsVoteController {
    
    @Autowired
    private NewsVoteService newsVoteService;
    
    /**
     * 뉴스에 투표하기
     */
    @PostMapping("/{newsId}/vote")
    public ResponseEntity<ApiResponse<UserVoteDto>> voteNews(
            @PathVariable Integer newsId,
            @Valid @RequestBody VoteRequestDto voteRequest) {
        
        try {
            UserVoteDto result = newsVoteService.voteNews(newsId, voteRequest);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 뉴스의 투표 결과 조회
     */
    @GetMapping("/{newsId}/votes")
    public ResponseEntity<ApiResponse<VoteResultDto>> getVoteResults(@PathVariable Integer newsId) {
        try {
            VoteResultDto result = newsVoteService.getVoteResults(newsId);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 사용자의 특정 뉴스에 대한 투표 조회
     */
    @GetMapping("/{newsId}/vote/user/{userId}")
    public ResponseEntity<ApiResponse<UserVoteDto>> getUserVote(
            @PathVariable Integer newsId,
            @PathVariable Long userId) {
        
        try {
            Optional<UserVoteDto> result = newsVoteService.getUserVote(newsId, userId);
            if (result.isPresent()) {
                return ResponseEntity.ok(ApiResponse.success(result.get()));
            } else {
                // 투표하지 않은 경우 null을 반환 (404가 아님)
                return ResponseEntity.ok(ApiResponse.success(null));
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * 사용자의 모든 투표 목록 조회 (마이페이지용)
     */
    @GetMapping("/votes/user/{userId}")
    public ResponseEntity<ApiResponse<List<UserVoteDto>>> getUserVotes(@PathVariable Long userId) {
        try {
            List<UserVoteDto> result = newsVoteService.getUserVotes(userId);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}