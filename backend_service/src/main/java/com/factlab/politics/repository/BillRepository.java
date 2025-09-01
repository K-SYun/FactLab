package com.factlab.politics.repository;

import com.factlab.politics.entity.ApprovalStatus;
import com.factlab.politics.entity.Bill;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    // 승인 상태별 법안 조회
    Page<Bill> findByApprovalStatusOrderByProposalDateDesc(ApprovalStatus approvalStatus, Pageable pageable);

    // 카테고리별 및 승인 상태별 법안 조회
    Page<Bill> findByApprovalStatusAndCategoryOrderByProposalDateDesc(ApprovalStatus approvalStatus, String category, Pageable pageable);

    // 상태별 법안 조회
    Page<Bill> findByStatusOrderByProposalDateDesc(String status, Pageable pageable);

    // 주요 법안 조회
    Page<Bill> findByApprovalStatusAndIsFeaturedTrueOrderByProposalDateDesc(ApprovalStatus approvalStatus, Pageable pageable);

    // 법안 번호로 조회
    Optional<Bill> findByBillNumber(String billNumber);

    // 발의자별 법안 조회
    Page<Bill> findByProposerIdAndApprovalStatusOrderByProposalDateDesc(Long proposerId, ApprovalStatus approvalStatus, Pageable pageable);

    // 정당별 법안 조회 (캐싱된 정당명으로)
    Page<Bill> findByPartyNameAndApprovalStatusOrderByProposalDateDesc(String partyName, ApprovalStatus approvalStatus, Pageable pageable);

    // 기간별 법안 조회
    Page<Bill> findByApprovalStatusAndProposalDateBetweenOrderByProposalDateDesc(
            ApprovalStatus approvalStatus, LocalDate startDate, LocalDate endDate, Pageable pageable);

    // 인기순 법안 조회 (찬성+반대 투표수 기준)
    @Query("SELECT b FROM Bill b WHERE b.approvalStatus = 'APPROVED' ORDER BY (b.votingFor + b.votingAgainst) DESC")
    Page<Bill> findPopularBills(Pageable pageable);

    // 논란순 법안 조회 (찬반 비율이 비슷한 순)
    @Query("SELECT b FROM Bill b WHERE b.approvalStatus = 'APPROVED' AND (b.votingFor + b.votingAgainst) > 10 " +
           "ORDER BY ABS(b.votingFor - b.votingAgainst) ASC")
    Page<Bill> findControversialBills(Pageable pageable);

    // 통과 가능성 높은 법안
    Page<Bill> findByApprovalStatusAndPassageProbabilityOrderByProposalDateDesc(
            ApprovalStatus approvalStatus, String passageProbability, Pageable pageable);

    // 키워드 검색 (제목, 요약, AI 키워드)
    @Query("SELECT b FROM Bill b WHERE b.approvalStatus = 'APPROVED' AND " +
           "(LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.summary) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.aiKeywords) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Bill> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    // 최근 통과/폐기된 법안
    @Query("SELECT b FROM Bill b WHERE b.approvalStatus = 'APPROVED' AND " +
           "b.status IN ('통과', '폐기', '가결', '부결') ORDER BY b.updatedAt DESC")
    Page<Bill> findRecentlyProcessedBills(Pageable pageable);

    // 언론 관심도 높은 법안
    Page<Bill> findByApprovalStatusOrderByMediaAttentionScoreDesc(ApprovalStatus approvalStatus, Pageable pageable);

    // 공공 관심도 높은 법안
    Page<Bill> findByApprovalStatusOrderByPublicInterestScoreDesc(ApprovalStatus approvalStatus, Pageable pageable);

    // 카테고리별 통계
    @Query("SELECT b.category, COUNT(b) FROM Bill b WHERE b.approvalStatus = 'APPROVED' GROUP BY b.category")
    List<Object[]> getBillCountByCategory();

    // 상태별 통계
    @Query("SELECT b.status, COUNT(b) FROM Bill b WHERE b.approvalStatus = 'APPROVED' GROUP BY b.status")
    List<Object[]> getBillCountByStatus();
}