package com.factlab.news.controller;

import com.factlab.common.dto.ApiResponse;
import com.factlab.common.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private MessageService messageService;

    @GetMapping
    public ApiResponse<Map<String, String>> getCategories() {
        Map<String, String> categories = messageService.getCategories();
        return ApiResponse.success(categories);
    }

    @GetMapping("/search-terms")
    public ApiResponse<Map<String, String>> getSearchTerms() {
        Map<String, String> searchTerms = messageService.getSearchTerms();
        return ApiResponse.success(searchTerms);
    }
}