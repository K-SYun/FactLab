package com.factlab.popup.repository;

import com.factlab.popup.entity.Popup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PopupRepository extends JpaRepository<Popup, Integer> {
    
    // 활성화된 팝업 목록 조회 (최신순)
    @Query("SELECT p FROM Popup p WHERE p.active = true ORDER BY p.createdAt DESC")
    List<Popup> findActivePopups();
    
    // 현재 시간 기준으로 표시되어야 하는 팝업 조회
    @Query("SELECT p FROM Popup p WHERE p.active = true AND p.startDate <= :now AND p.endDate >= :now ORDER BY p.createdAt DESC")
    List<Popup> findActivePopupsForDisplay(@Param("now") LocalDateTime now);
    
    // 전체 팝업 목록 조회 (최신순)
    @Query("SELECT p FROM Popup p ORDER BY p.createdAt DESC")
    List<Popup> findAllOrderByCreatedAtDesc();
    
    // 페이징된 팝업 목록 조회
    @Query("SELECT p FROM Popup p ORDER BY p.createdAt DESC LIMIT :size OFFSET :offset")
    List<Popup> findAllOrderByCreatedAtDesc(@Param("offset") int offset, @Param("size") int size);
    
    // 활성 상태별 팝업 개수
    long countByActive(Boolean active);
    
    // 기간별 팝업 개수
    @Query("SELECT COUNT(p) FROM Popup p WHERE p.startDate <= :endDate AND p.endDate >= :startDate")
    long countByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}