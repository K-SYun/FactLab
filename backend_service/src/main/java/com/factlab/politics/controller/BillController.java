package com.factlab.politics.controller;

import com.factlab.common.dto.ApiResponse;
import com.factlab.politics.dto.BillCreateDto;
import com.factlab.politics.dto.BillResponseDto;
import com.factlab.politics.service.BillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/bills")
@Tag(name = "Bill", description = "법안 관리 API")
public class BillController {

    @Autowired
    private BillService billService;

    /**
     * 법안 목록 조회 (승인된 법안만)
     * GET /api/bills
     */
    @GetMapping
    @Operation(summary = "법안 목록 조회", description = "승인된 법안 목록을 최신순으로 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getBills(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getApprovedBills(pageable);
            return ApiResponse.success(bills, "법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("법안 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 카테고리별 법안 조회
     * GET /api/bills/category/{category}
     */
    @GetMapping("/category/{category}")
    @Operation(summary = "카테고리별 법안 조회", description = "특정 카테고리의 법안 목록을 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getBillsByCategory(
            @PathVariable String category,
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getBillsByCategory(category, pageable);
            return ApiResponse.success(bills, "카테고리별 법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("카테고리별 법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 주요 법안 조회
     * GET /api/bills/featured
     */
    @GetMapping("/featured")
    @Operation(summary = "주요 법안 조회", description = "관리자가 선정한 주요 법안 목록을 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getFeaturedBills(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getFeaturedBills(pageable);
            return ApiResponse.success(bills, "주요 법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("주요 법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 인기 법안 조회 (투표수 기준)
     * GET /api/bills/popular
     */
    @GetMapping("/popular")
    @Operation(summary = "인기 법안 조회", description = "투표 참여가 많은 인기 법안 목록을 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getPopularBills(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getPopularBills(pageable);
            return ApiResponse.success(bills, "인기 법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("인기 법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 논란 법안 조회
     * GET /api/bills/controversial
     */
    @GetMapping("/controversial")
    @Operation(summary = "논란 법안 조회", description = "찬반 논란이 큰 법안 목록을 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getControversialBills(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getControversialBills(pageable);
            return ApiResponse.success(bills, "논란 법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("논란 법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 통과 가능성 높은 법안 조회
     * GET /api/bills/high-probability
     */
    @GetMapping("/high-probability")
    @Operation(summary = "통과 가능성 높은 법안 조회", description = "통과 가능성이 높은 법안 목록을 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getHighProbabilityBills(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getHighProbabilityBills(pageable);
            return ApiResponse.success(bills, "통과 가능성 높은 법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("통과 가능성 높은 법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 최근 처리된 법안 조회 (통과/폐기)
     * GET /api/bills/recently-processed
     */
    @GetMapping("/recently-processed")
    @Operation(summary = "최근 처리된 법안 조회", description = "최근에 통과 또는 폐기된 법안 목록을 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getRecentlyProcessedBills(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getRecentlyProcessedBills(pageable);
            return ApiResponse.success(bills, "최근 처리된 법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("최근 처리된 법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 법안 상세 조회
     * GET /api/bills/{billId}
     */
    @GetMapping("/{billId}")
    @Operation(summary = "법안 상세 조회", description = "특정 법안의 상세 정보를 조회합니다")
    public ApiResponse<BillResponseDto> getBill(@PathVariable Long billId) {
        try {
            BillResponseDto bill = billService.getBillById(billId);
            return ApiResponse.success(bill, "법안을 성공적으로 조회했습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 법안 검색
     * GET /api/bills/search
     */
    @GetMapping("/search")
    @Operation(summary = "법안 검색", description = "키워드로 법안을 검색합니다")
    public ApiResponse<Page<BillResponseDto>> searchBills(
            @Parameter(description = "검색 키워드") @RequestParam String keyword,
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.searchBills(keyword, pageable);
            return ApiResponse.success(bills, "법안 검색을 성공적으로 완료했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("법안 검색 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 발의자별 법안 조회
     * GET /api/bills/proposer/{proposerId}
     */
    @GetMapping("/proposer/{proposerId}")
    @Operation(summary = "발의자별 법안 조회", description = "특정 발의자의 법안 목록을 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getBillsByProposer(
            @PathVariable Long proposerId,
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getBillsByProposer(proposerId, pageable);
            return ApiResponse.success(bills, "발의자별 법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("발의자별 법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 정당별 법안 조회
     * GET /api/bills/party/{partyName}
     */
    @GetMapping("/party/{partyName}")
    @Operation(summary = "정당별 법안 조회", description = "특정 정당의 법안 목록을 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getBillsByParty(
            @PathVariable String partyName,
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getBillsByParty(partyName, pageable);
            return ApiResponse.success(bills, "정당별 법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("정당별 법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 기간별 법안 조회
     * GET /api/bills/date-range
     */
    @GetMapping("/date-range")
    @Operation(summary = "기간별 법안 조회", description = "특정 기간에 발의된 법안 목록을 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getBillsByDateRange(
            @Parameter(description = "시작일 (yyyy-MM-dd)") 
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "종료일 (yyyy-MM-dd)") 
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getBillsByDateRange(startDate, endDate, pageable);
            return ApiResponse.success(bills, "기간별 법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("기간별 법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}