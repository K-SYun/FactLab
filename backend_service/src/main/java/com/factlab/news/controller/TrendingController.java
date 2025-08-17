package com.factlab.news.controller;

import com.factlab.common.dto.ApiResponse;
import com.factlab.news.dto.TrendingKeywordDto;
import com.factlab.news.service.NewsService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trending")
public class TrendingController {

    private final NewsService newsService;

    @Autowired
    public TrendingController(NewsService newsService) {
        this.newsService = newsService;
    }

    @GetMapping("/keywords")
    @Operation(summary = "트렌딩 키워드 조회", description = "승인된 뉴스에서 가장 많이 언급된 키워드 상위 10개를 조회합니다.")
    public ApiResponse<List<TrendingKeywordDto>> getTrendingKeywords() {
        try {
            List<TrendingKeywordDto> keywords = newsService.getTrendingKeywords();
            return ApiResponse.success(keywords);
        } catch (Exception e) {
            return ApiResponse.error("트렌딩 키워드를 가져오는데 실패했습니다: " + e.getMessage());
        }
    }
}