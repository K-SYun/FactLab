package com.factlab.politics.repository;

import com.factlab.politics.entity.Politician;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PoliticianRepository extends JpaRepository<Politician, Long> {
    
    // 활성 정치인 조회
    Page<Politician> findByIsActiveTrueOrderByName(Pageable pageable);
    
    // 정당별 정치인 조회
    Page<Politician> findByPartyIdAndIsActiveTrueOrderByName(Long partyId, Pageable pageable);
    
    // 이름으로 검색
    Page<Politician> findByNameContainingAndIsActiveTrue(String name, Pageable pageable);
    
    // 직책별 조회
    Page<Politician> findByPositionAndIsActiveTrueOrderByName(String position, Pageable pageable);
    
    // 선거구별 조회
    Page<Politician> findByElectoralDistrictContainingAndIsActiveTrueOrderByName(
            String electoralDistrict, Pageable pageable);
    
    // 위원회별 조회
    Page<Politician> findByCommitteeContainingAndIsActiveTrueOrderByName(
            String committee, Pageable pageable);
    
    // 정확한 이름 매치
    Optional<Politician> findByNameAndIsActiveTrue(String name);
    
    // 현직 의원 조회 (임기 중)
    @Query("SELECT p FROM Politician p WHERE p.isActive = true AND " +
           "p.termStartDate <= CURRENT_DATE AND " +
           "(p.termEndDate IS NULL OR p.termEndDate >= CURRENT_DATE) " +
           "ORDER BY p.name")
    Page<Politician> findCurrentTermPoliticians(Pageable pageable);
    
    // 정당별 현직 의원 수
    @Query("SELECT p.party.name, COUNT(p) FROM Politician p WHERE p.isActive = true AND " +
           "p.termStartDate <= CURRENT_DATE AND " +
           "(p.termEndDate IS NULL OR p.termEndDate >= CURRENT_DATE) " +
           "GROUP BY p.party.name")
    List<Object[]> getCurrentPoliticianCountByParty();
    
    // 다중 조건 검색
    @Query("SELECT p FROM Politician p WHERE p.isActive = true AND " +
           "(:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:partyId IS NULL OR p.party.id = :partyId) AND " +
           "(:position IS NULL OR LOWER(p.position) LIKE LOWER(CONCAT('%', :position, '%'))) " +
           "ORDER BY p.name")
    Page<Politician> searchPoliticians(@Param("name") String name, 
                                     @Param("partyId") Long partyId,
                                     @Param("position") String position, 
                                     Pageable pageable);
}