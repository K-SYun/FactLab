package com.factlab.politics.service;

import com.factlab.common.dto.ApiResponse;
import com.factlab.politics.dto.BillCreateDto;
import com.factlab.politics.dto.BillResponseDto;
import com.factlab.politics.entity.ApprovalStatus;
import com.factlab.politics.entity.Bill;
import com.factlab.politics.entity.Politician;
import com.factlab.politics.entity.PriorityCategory;
import com.factlab.politics.repository.BillRepository;
import com.factlab.politics.repository.PoliticianRepository;
import com.factlab.user.entity.User;
import com.factlab.user.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import com.factlab.politics.dto.AssemblyBillDto;

@Service
@Transactional
@Slf4j
public class BillService {

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private PoliticianRepository politicianRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * 승인된 법안 목록 조회 (사용자용)
     */
    @Transactional(readOnly = true)
    public Page<BillResponseDto> getApprovedBills(Pageable pageable) {
        Page<Bill> bills = billRepository.findByApprovalStatusOrderByProposalDateDesc(ApprovalStatus.APPROVED, pageable);
        return bills.map(BillResponseDto::new);
    }

    /**
     * 카테고리별 법안 조회
     */
    @Transactional(readOnly = true)
    public Page<BillResponseDto> getBillsByCategory(String category, Pageable pageable) {
        Page<Bill> bills = billRepository.findByApprovalStatusAndCategoryOrderByProposalDateDesc(ApprovalStatus.APPROVED, category, pageable);
        return bills.map(BillResponseDto::new);
    }

    /**
     * 주요 법안 조회
     */
    @Transactional(readOnly = true)
    public Page<BillResponseDto> getFeaturedBills(Pageable pageable) {
        Page<Bill> bills = billRepository.findByApprovalStatusAndIsFeaturedTrueOrderByProposalDateDesc(ApprovalStatus.APPROVED, pageable);
        return bills.map(BillResponseDto::new);
    }

    /**
     * 인기 법안 조회 (투표수 기준)
     */
    @Transactional(readOnly = true)
    public Page<BillResponseDto> getPopularBills(Pageable pageable) {
        Page<Bill> bills = billRepository.findPopularBills(pageable);
        return bills.map(BillResponseDto::new);
    }

    /**
     * 논란 법안 조회
     */
    @Transactional(readOnly = true)
    public Page<BillResponseDto> getControversialBills(Pageable pageable) {
        Page<Bill> bills = billRepository.findControversialBills(pageable);
        return bills.map(BillResponseDto::new);
    }

    /**
     * 통과 가능성 높은 법안 조회
     */
    @Transactional(readOnly = true)
    public Page<BillResponseDto> getHighProbabilityBills(Pageable pageable) {
        Page<Bill> bills = billRepository.findByApprovalStatusAndPassageProbabilityOrderByProposalDateDesc(ApprovalStatus.APPROVED, "HIGH", pageable);
        return bills.map(BillResponseDto::new);
    }

    /**
     * 법안 상세 조회
     */
    @Transactional(readOnly = true)
    public BillResponseDto getBillById(Long billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("법안을 찾을 수 없습니다."));

        if (bill.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new RuntimeException("승인되지 않은 법안입니다.");
        }

        // 조회수 증가
        bill.setViewCount(bill.getViewCount() + 1);
        billRepository.save(bill);

        return new BillResponseDto(bill);
    }

    /**
     * 법안 상세 조회 (관리자용 - 승인 상태 무관)
     */
    @Transactional(readOnly = true)
    public BillResponseDto getBillByIdAdmin(Long billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("법안을 찾을 수 없습니다."));

        return new BillResponseDto(bill);
    }

    /**
     * 법안 검색
     */
    @Transactional(readOnly = true)
    public Page<BillResponseDto> searchBills(String keyword, Pageable pageable) {
        Page<Bill> bills = billRepository.searchByKeyword(keyword, pageable);
        return bills.map(BillResponseDto::new);
    }

    /**
     * 발의자별 법안 조회
     */
    @Transactional(readOnly = true)
    public Page<BillResponseDto> getBillsByProposer(Long proposerId, Pageable pageable) {
        Page<Bill> bills = billRepository.findByProposerIdAndApprovalStatusOrderByProposalDateDesc(proposerId, ApprovalStatus.APPROVED, pageable);
        return bills.map(BillResponseDto::new);
    }

    /**
     * 정당별 법안 조회
     */
    @Transactional(readOnly = true)
    public Page<BillResponseDto> getBillsByParty(String partyName, Pageable pageable) {
        Page<Bill> bills = billRepository.findByPartyNameAndApprovalStatusOrderByProposalDateDesc(partyName, ApprovalStatus.APPROVED, pageable);
        return bills.map(BillResponseDto::new);
    }

    /**
     * 기간별 법안 조회
     */
    @Transactional(readOnly = true)
    public Page<BillResponseDto> getBillsByDateRange(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        Page<Bill> bills = billRepository.findByApprovalStatusAndProposalDateBetweenOrderByProposalDateDesc(
                ApprovalStatus.APPROVED, startDate, endDate, pageable);
        return bills.map(BillResponseDto::new);
    }

    /**
     * 최근 처리된 법안 조회 (통과/폐기)
     */
    @Transactional(readOnly = true)
    public Page<BillResponseDto> getRecentlyProcessedBills(Pageable pageable) {
        Page<Bill> bills = billRepository.findRecentlyProcessedBills(pageable);
        return bills.map(BillResponseDto::new);
    }

    // === 관리자용 메서드 ===

    /**
     * 법안 생성 (관리자용)
     */
    public BillResponseDto createBill(BillCreateDto createDto, Long adminId) {
        // 중복 법안번호 체크
        if (billRepository.findByBillNumber(createDto.getBillNumber()).isPresent()) {
            throw new RuntimeException("이미 존재하는 법안번호입니다.");
        }

        // 발의자 정보 확인
        Politician proposer = null;
        if (createDto.getProposerId() != null) {
            proposer = politicianRepository.findById(createDto.getProposerId())
                    .orElseThrow(() -> new RuntimeException("발의자를 찾을 수 없습니다."));
        }

        Bill bill = new Bill();
        bill.setBillNumber(createDto.getBillNumber());
        bill.setTitle(createDto.getTitle());
        bill.setSummary(createDto.getSummary());
        bill.setFullText(createDto.getFullText());
        bill.setProposer(proposer);
        bill.setProposerName(createDto.getProposerName());
        bill.setPartyName(createDto.getPartyName());
        bill.setProposalDate(createDto.getProposalDate());
        bill.setStatus(createDto.getStatus());
        bill.setCategory(createDto.getCategory());
        bill.setCommittee(createDto.getCommittee());
        bill.setStage(createDto.getStage());
        bill.setPassageProbability(createDto.getPassageProbability());

        if (createDto.getUrgencyLevel() != null) {
            bill.setUrgencyLevel(Bill.UrgencyLevel.valueOf(createDto.getUrgencyLevel()));
        }

        bill.setPublicInterestScore(createDto.getPublicInterestScore());
        bill.setMediaAttentionScore(createDto.getMediaAttentionScore());
        bill.setIsFeatured(createDto.getIsFeatured());
        bill.setApprovalStatus(createDto.getApprovalStatus());
        bill.setPriorityCategory(createDto.getPriorityCategory());
        bill.setAdminNotes(createDto.getAdminNotes());
        bill.setSourceUrl(createDto.getSourceUrl());
        bill.setAiSummary(createDto.getAiSummary());
        bill.setAiImpactAnalysis(createDto.getAiImpactAnalysis());
        bill.setAiKeywords(createDto.getAiKeywords());
        bill.setAiReliabilityScore(createDto.getAiReliabilityScore());

        Bill savedBill = billRepository.save(bill);
        return new BillResponseDto(savedBill);
    }

    /**
     * 법안 수정 (관리자용)
     */
    public BillResponseDto updateBill(Long billId, BillCreateDto updateDto, Long adminId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("법안을 찾을 수 없습니다."));

        // 발의자 정보 업데이트
        if (updateDto.getProposerId() != null) {
            Politician proposer = politicianRepository.findById(updateDto.getProposerId())
                    .orElseThrow(() -> new RuntimeException("발의자를 찾을 수 없습니다."));
            bill.setProposer(proposer);
        }

        bill.setTitle(updateDto.getTitle());
        bill.setSummary(updateDto.getSummary());
        bill.setFullText(updateDto.getFullText());
        bill.setProposerName(updateDto.getProposerName());
        bill.setPartyName(updateDto.getPartyName());
        bill.setProposalDate(updateDto.getProposalDate());
        bill.setStatus(updateDto.getStatus());
        bill.setCategory(updateDto.getCategory());
        bill.setCommittee(updateDto.getCommittee());
        bill.setStage(updateDto.getStage());
        bill.setPassageProbability(updateDto.getPassageProbability());

        if (updateDto.getUrgencyLevel() != null) {
            bill.setUrgencyLevel(Bill.UrgencyLevel.valueOf(updateDto.getUrgencyLevel()));
        }

        bill.setPublicInterestScore(updateDto.getPublicInterestScore());
        bill.setMediaAttentionScore(updateDto.getMediaAttentionScore());
        bill.setIsFeatured(updateDto.getIsFeatured());
        bill.setApprovalStatus(updateDto.getApprovalStatus());
        bill.setPriorityCategory(updateDto.getPriorityCategory());
        bill.setAdminNotes(updateDto.getAdminNotes());
        bill.setSourceUrl(updateDto.getSourceUrl());
        bill.setAiSummary(updateDto.getAiSummary());
        bill.setAiImpactAnalysis(updateDto.getAiImpactAnalysis());
        bill.setAiKeywords(updateDto.getAiKeywords());
        bill.setAiReliabilityScore(updateDto.getAiReliabilityScore());

        Bill savedBill = billRepository.save(bill);
        return new BillResponseDto(savedBill);
    }

    /**
     * 법안 승인 상태 변경 (관리자용)
     */
    public BillResponseDto setBillApprovalStatus(Long billId, ApprovalStatus status, PriorityCategory priorityCategory, Long adminId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("법안을 찾을 수 없습니다."));

        bill.setApprovalStatus(status);
        if (status == ApprovalStatus.APPROVED) {
            bill.setPriorityCategory(priorityCategory);
        } else {
            bill.setPriorityCategory(null);
        }
        Bill savedBill = billRepository.save(bill);

        return new BillResponseDto(savedBill);
    }

    /**
     * 법안 주요 설정 토글 (관리자용)
     */
    public BillResponseDto toggleBillFeatured(Long billId, Long adminId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("법안을 찾을 수 없습니다."));

        bill.setIsFeatured(!bill.getIsFeatured());
        Bill savedBill = billRepository.save(bill);

        return new BillResponseDto(savedBill);
    }

    /**
     * 법안 삭제 (관리자용)
     */
    public void deleteBill(Long billId, Long adminId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("법안을 찾을 수 없습니다."));

        billRepository.delete(bill);
    }

    /**
     * 승인 대기 중인 법안 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public Page<BillResponseDto> getPendingBills(Pageable pageable) {
        Page<Bill> bills = billRepository.findByApprovalStatusOrderByProposalDateDesc(ApprovalStatus.PENDING, pageable);
        return bills.map(BillResponseDto::new);
    }

    /**
     * 거부된 법안 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public Page<BillResponseDto> getRejectedBills(Pageable pageable) {
        Page<Bill> bills = billRepository.findByApprovalStatusOrderByProposalDateDesc(ApprovalStatus.REJECTED, pageable);
        return bills.map(BillResponseDto::new);
    }


    /**
     * 모든 법안 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public Page<BillResponseDto> getAllBills(Pageable pageable) {
        Page<Bill> bills = billRepository.findAll(pageable);
        return bills.map(BillResponseDto::new);
    }

    /**
     * 법안 통계 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public Object getBillStatistics() {
        List<Object[]> categoryStats = billRepository.getBillCountByCategory();
        List<Object[]> statusStats = billRepository.getBillCountByStatus();

        return new Object() {
            public final List<Object[]> categoryStatistics = categoryStats;
            public final List<Object[]> statusStatistics = statusStats;
            public final Long totalBills = billRepository.count();
            public final Long approvedBills = billRepository.findByApprovalStatusOrderByProposalDateDesc(ApprovalStatus.APPROVED, Pageable.unpaged()).getTotalElements();
        };
    }

    @Autowired
    private AssemblyApiService assemblyApiService;

    /**
     * 공공데이터포털 국회 의안정보시스템 Open API를 통한 22대 국회 전체 법안 데이터 수집
     * 페이지네이션을 통해 모든 법안을 API로 수집합니다.
     */
    public void fetchRealBillData() {
        try {
            log.info("22대 국회 전체 법안 데이터 수집을 시작합니다 (공공데이터포털 Open API 사용)...");
            
            int totalSavedCount = 0;
            int currentPage = 1;
            final int pageSize = 100; // 한 번에 100개씩 처리
            boolean hasMoreData = true;
            
            while (hasMoreData) {
                log.info("페이지 {} 처리 중...", currentPage);
                
                // 공공데이터포털 Open API에서 법안 정보 가져오기
                List<AssemblyBillDto> apiBills = assemblyApiService.fetchBillList(currentPage, pageSize);
                
                if (apiBills.isEmpty()) {
                    if (currentPage == 1) {
                        log.warn("공공데이터포털 국회 의안정보시스템 Open API에서 데이터를 가져오지 못했습니다. API 키를 확인해주세요.");
                        throw new RuntimeException("법안 데이터를 수집할 수 없습니다. 공공데이터포털에서 발급받은 API 키를 .env 파일에 설정해주세요.");
                    }
                    hasMoreData = false;
                    break;
                }
                
                int pageSavedCount = 0;
                for (AssemblyBillDto apiDto : apiBills) {
                    // 중복 체크
                    if (billRepository.findByBillNumber(apiDto.getBillNo()).isPresent()) {
                        continue; // 이미 존재하는 법안은 건너뛰기
                    }
                    
                    // API 응답을 Bill 엔티티로 변환
                    Bill bill = convertToBill(apiDto);
                    billRepository.save(bill);
                    pageSavedCount++;
                }
                
                totalSavedCount += pageSavedCount;
                log.info("페이지 {} 완료: {}개 신규 법안 저장", currentPage, pageSavedCount);
                
                // 다음 페이지로
                currentPage++;
                
                // 응답 데이터가 페이지 크기보다 작으면 마지막 페이지
                if (apiBills.size() < pageSize) {
                    hasMoreData = false;
                }
                
                // API 부하 방지를 위한 딜레이 (1초)
                Thread.sleep(1000);
            }
            
            log.info("22대 국회 법안 데이터 수집 완료: 총 {}개의 신규 법안을 저장했습니다.", totalSavedCount);
            
        } catch (InterruptedException e) {
            log.error("법안 데이터 수집 중 인터럽트 발생: ", e);
            Thread.currentThread().interrupt();
            throw new RuntimeException("법안 데이터 수집이 중단되었습니다.");
        } catch (Exception e) {
            log.error("국회 의안정보 API 호출 실패: ", e);
            throw new RuntimeException("법안 데이터 수집 실패: " + e.getMessage() + ". 공공데이터포털 API 키를 확인해주세요.");
        }
    }
    
    /**
     * AssemblyBillDto를 Bill 엔티티로 변환
     */
    private Bill convertToBill(AssemblyBillDto apiDto) {
        Bill bill = new Bill();
        
        bill.setBillNumber(apiDto.getBillNo());
        bill.setTitle(apiDto.getBillName());
        bill.setSummary(apiDto.getBillName()); // API에서 상세 요약이 없으면 제목으로 대체
        bill.setFullText(""); // 상세 텍스트는 별도 API 호출 필요
        bill.setProposerName(apiDto.getProposer());
        bill.setPartyName(extractPartyFromProposer(apiDto.getProposer()));
        bill.setProposalDate(apiDto.getProposeDt() != null ? apiDto.getProposeDt() : LocalDate.now());
        bill.setStatus(apiDto.getProcStage() != null ? apiDto.getProcStage() : "접수");
        bill.setCategory(categorizeByCommittee(apiDto.getCommittee()));
        bill.setCommittee(apiDto.getCommittee());
        bill.setStage(apiDto.getProcStage());
        bill.setPassageProbability(determinePassageProbability(apiDto.getProcStage()));
        bill.setUrgencyLevel(Bill.UrgencyLevel.NORMAL);
        bill.setPublicInterestScore(50); // 기본값
        bill.setMediaAttentionScore(30); // 기본값
        bill.setVotingFor(0);
        bill.setVotingAgainst(0);
        bill.setViewCount(0);
        bill.setIsFeatured(false);
        bill.setApprovalStatus(ApprovalStatus.PENDING); // 기본값: 승인 대기
        bill.setPriorityCategory(PriorityCategory.NEWSWORTHY); // 기본값
        bill.setAiSummary(""); // AI 분석은 별도 처리
        bill.setAiImpactAnalysis("");
        bill.setAiKeywords("");
        bill.setAiReliabilityScore(70); // 기본값
        bill.setSourceUrl(apiDto.getDetailLink());
        
        return bill;
    }
    
    /**
     * 발의자 정보에서 정당명 추출
     */
    private String extractPartyFromProposer(String proposer) {
        if (proposer == null) return "";
        
        // 정당명이 포함된 경우 추출 (예: "홍길동 의원(더불어민주당)")
        if (proposer.contains("(") && proposer.contains(")")) {
            int start = proposer.indexOf("(") + 1;
            int end = proposer.indexOf(")");
            if (end > start) {
                return proposer.substring(start, end);
            }
        }
        return ""; // 정당 정보가 없는 경우
    }
    
    /**
     * 소관위원회를 기반으로 카테고리 분류
     */
    private String categorizeByCommittee(String committee) {
        if (committee == null) return "기타";
        
        if (committee.contains("행정") || committee.contains("정무") || committee.contains("안전")) {
            return "정치/행정";
        } else if (committee.contains("경제") || committee.contains("산업") || committee.contains("중소") || committee.contains("기획재정")) {
            return "경제/산업";
        } else if (committee.contains("보건복지") || committee.contains("고용노동") || committee.contains("여성가족")) {
            return "노동/복지";
        } else if (committee.contains("교육") || committee.contains("문화") || committee.contains("체육")) {
            return "교육/문화";
        } else if (committee.contains("환경") || committee.contains("에너지") || committee.contains("산자")) {
            return "환경/에너지";
        } else if (committee.contains("과학") || committee.contains("정보통신") || committee.contains("방통")) {
            return "디지털/AI/데이터";
        }
        return "기타";
    }
    
    /**
     * 처리상태를 기반으로 통과가능성 판단
     */
    private String determinePassageProbability(String procStage) {
        if (procStage == null) return "MEDIUM";
        
        if (procStage.contains("본회의") || procStage.contains("가결")) {
            return "HIGH";
        } else if (procStage.contains("폐기") || procStage.contains("부결")) {
            return "LOW";
        }
        return "MEDIUM";
    }

}