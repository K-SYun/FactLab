package com.factlab.politics.controller;

import com.factlab.common.dto.ApiResponse;
import com.factlab.politics.dto.BillResponseDto;
import com.factlab.politics.entity.ApprovalStatus;
import com.factlab.politics.entity.PriorityCategory;
import com.factlab.politics.service.BillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/bills")
@Tag(name = "Admin Bill", description = "관리자 법안 관리 API")
public class AdminBillController {

    @Autowired
    private BillService billService;


    /**
     * 모든 법안 조회 (관리자용)
     * GET /api/admin/bills
     */
    @GetMapping
    @Operation(summary = "모든 법안 조회", description = "관리자용 모든 법안 목록을 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getAllBills(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "100") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getAllBills(pageable);
            return ApiResponse.success(bills, "전체 법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("전체 법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 승인 대기 중인 법안 조회 (관리자용)
     * GET /api/admin/bills/pending
     */
    @GetMapping("/pending")
    @Operation(summary = "승인 대기 법안 조회", description = "승인 대기 중인 법안 목록을 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getPendingBills(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "100") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getPendingBills(pageable);
            return ApiResponse.success(bills, "승인 대기 법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("승인 대기 법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 승인된 법안 조회 (관리자용)
     * GET /api/admin/bills/approved
     */
    @GetMapping("/approved")
    @Operation(summary = "승인된 법안 조회", description = "승인된 법안 목록을 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getApprovedBills(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "100") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getApprovedBills(pageable);
            return ApiResponse.success(bills, "승인된 법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("승인된 법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 거부된 법안 조회 (관리자용)
     * GET /api/admin/bills/rejected
     */
    @GetMapping("/rejected")
    @Operation(summary = "거부된 법안 조회", description = "거부된 법안 목록을 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getRejectedBills(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "100") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getRejectedBills(pageable);
            return ApiResponse.success(bills, "거부된 법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("거부된 법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }


    /**
     * 법안 상세 조회 (관리자용)
     * GET /api/admin/bills/{billId}
     */
    @GetMapping("/{billId}")
    @Operation(summary = "법안 상세 조회", description = "관리자용 특정 법안의 상세 정보를 조회합니다")
    public ApiResponse<BillResponseDto> getBillDetail(@PathVariable Long billId) {
        try {
            BillResponseDto bill = billService.getBillByIdAdmin(billId);
            return ApiResponse.success(bill, "법안을 성공적으로 조회했습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 법안 승인 상태 변경 (관리자용)
     * POST /api/admin/bills/{billId}/status
     */
    @PostMapping("/{billId}/status")
    @Operation(summary = "법안 승인 상태 변경", description = "법안의 승인 상태를 변경합니다")
    public ApiResponse<BillResponseDto> setBillApprovalStatus(@PathVariable Long billId, @RequestBody Map<String, String> payload) {
        try {
            // TODO: 현재 로그인한 관리자 ID 가져오기 (JWT에서 추출)
            Long adminId = 1L; // 임시값
            ApprovalStatus status = ApprovalStatus.valueOf(payload.get("status"));
            PriorityCategory priorityCategory = payload.containsKey("priorityCategory") ? PriorityCategory.valueOf(payload.get("priorityCategory")) : null;

            BillResponseDto bill = billService.setBillApprovalStatus(billId, status, priorityCategory, adminId);
            return ApiResponse.success(bill, "법안 승인 상태가 성공적으로 변경되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("법안 승인 상태 변경 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 법안 주요 설정 토글 (관리자용)
     * POST /api/admin/bills/{billId}/toggle-featured
     */
    @PostMapping("/{billId}/toggle-featured")
    @Operation(summary = "법안 주요 설정 변경", description = "법안의 주요 법안 설정을 토글합니다")
    public ApiResponse<BillResponseDto> toggleBillFeatured(@PathVariable Long billId) {
        try {
            // TODO: 현재 로그인한 관리자 ID 가져오기 (JWT에서 추출)
            Long adminId = 1L; // 임시값

            BillResponseDto bill = billService.toggleBillFeatured(billId, adminId);
            return ApiResponse.success(bill, "법안 주요 설정이 성공적으로 변경되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("법안 주요 설정 변경 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 법안 삭제 (관리자용)
     * DELETE /api/admin/bills/{billId}
     */
    @DeleteMapping("/{billId}")
    @Operation(summary = "법안 삭제", description = "법안을 삭제합니다")
    public ApiResponse<Void> deleteBill(@PathVariable Long billId) {
        try {
            // TODO: 현재 로그인한 관리자 ID 가져오기 (JWT에서 추출)
            Long adminId = 1L; // 임시값

            billService.deleteBill(billId, adminId);
            return ApiResponse.success(null, "법안이 성공적으로 삭제되었습니다.");
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("법안 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 법안 통계 조회 (관리자용)
     * GET /api/admin/bills/statistics
     */
    @GetMapping("/statistics")
    @Operation(summary = "법안 통계 조회", description = "법안 관련 통계 정보를 조회합니다")
    public ApiResponse<Object> getBillStatistics() {
        try {
            Object statistics = billService.getBillStatistics();
            return ApiResponse.success(statistics, "법안 통계를 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("법안 통계 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 법안 검색 (관리자용)
     * GET /api/admin/bills/search
     */
    @GetMapping("/search")
    @Operation(summary = "법안 검색", description = "키워드로 법안을 검색합니다 (승인 여부 무관)")
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
     * 카테고리별 법안 조회 (관리자용)
     * GET /api/admin/bills/category/{category}
     */
    @GetMapping("/category/{category}")
    @Operation(summary = "카테고리별 법안 조회", description = "특정 카테고리의 법안을 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getBillsByCategory(
            @PathVariable String category,
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getBillsByCategory(category, pageable);
            return ApiResponse.success(bills, category + " 카테고리 법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("카테고리별 법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 주요 법안 조회 (관리자용)
     * GET /api/admin/bills/featured
     */
    @GetMapping("/featured")
    @Operation(summary = "주요 법안 조회", description = "주요 법안으로 설정된 법안들을 조회합니다")
    public ApiResponse<Page<BillResponseDto>> getFeaturedBills(
            @Parameter(description = "페이지 번호") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기") @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<BillResponseDto> bills = billService.getFeaturedBills(pageable);
            return ApiResponse.success(bills, "주요 법안 목록을 성공적으로 조회했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("주요 법안 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 인기 법안 조회 (관리자용)
     * GET /api/admin/bills/popular
     */
    @GetMapping("/popular")
    @Operation(summary = "인기 법안 조회", description = "투표수 기준 인기 법안을 조회합니다")
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
     * 논란 법안 조회 (관리자용)
     * GET /api/admin/bills/controversial
     */
    @GetMapping("/controversial")
    @Operation(summary = "논란 법안 조회", description = "논란이 되고 있는 법안을 조회합니다")
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
     * 법안 데이터 수집 트리거 (관리자용)
     * POST /api/admin/bills/collect
     */
    @PostMapping("/collect")
    @Operation(summary = "법안 데이터 수집 실행", description = "공공데이터포털 국회 의안정보시스템 API를 통해 법안 정보를 수집합니다.")
    public ApiResponse<String> collectBills() {
        try {
            // 공공데이터포털 Open API를 통한 법안 데이터 수집
            billService.fetchRealBillData();
            return ApiResponse.success("법안 데이터 수집이 완료되었습니다.", "공공데이터포털 국회 의안정보시스템 API에서 최신 법안 데이터를 수집했습니다.");
        } catch (Exception e) {
            return ApiResponse.error("법안 데이터 수집 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 법안 크롤링 트리거 (관리자용) - 하위 호환성을 위해 유지
     * POST /api/admin/bills/crawl
     * @deprecated /api/admin/bills/collect 사용을 권장합니다
     */
    @PostMapping("/crawl")
    @Operation(summary = "[Deprecated] 법안 크롤링 실행", description = "[Deprecated] 하위 호환성을 위해 유지됩니다. /api/admin/bills/collect 사용을 권장합니다.")
    @Deprecated
    public ApiResponse<String> crawlBills() {
        return collectBills(); // 새로운 메서드로 리다이렉트
    }
}