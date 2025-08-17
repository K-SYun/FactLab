package com.factlab.system.repository;

import com.factlab.system.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, Long> {
    
    /**
     * 설정 키로 조회
     */
    Optional<SystemSetting> findBySettingKey(String settingKey);
    
    /**
     * 카테고리별 설정 조회
     */
    List<SystemSetting> findByCategoryOrderBySettingKey(String category);
    
    /**
     * 설정값을 직접 조회하는 편의 메서드
     */
    @Query("SELECT s.settingValue FROM SystemSetting s WHERE s.settingKey = :key")
    Optional<String> findSettingValueByKey(@Param("key") String key);
    
    /**
     * 설정값을 정수로 조회하는 편의 메서드
     */
    @Query("SELECT CAST(s.settingValue AS integer) FROM SystemSetting s WHERE s.settingKey = :key")
    Optional<Integer> findSettingValueAsIntegerByKey(@Param("key") String key);
}