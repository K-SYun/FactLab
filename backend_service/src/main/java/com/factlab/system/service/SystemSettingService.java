package com.factlab.system.service;

import com.factlab.system.dto.BestSettingUpdateDto;
import com.factlab.system.entity.SystemSetting;
import com.factlab.system.repository.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@Transactional
public class SystemSettingService {

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    /**
     * BEST 게시판 설정 조회
     */
    @Transactional(readOnly = true)
    public Map<String, Integer> getBestSettings() {
        Map<String, Integer> settings = new HashMap<>();
        
        Integer minViewCount = systemSettingRepository
            .findSettingValueAsIntegerByKey("best.min_view_count")
            .orElse(100);
        Integer minLikeCount = systemSettingRepository
            .findSettingValueAsIntegerByKey("best.min_like_count")
            .orElse(10);
        
        settings.put("minViewCount", minViewCount);
        settings.put("minLikeCount", minLikeCount);
        
        return settings;
    }

    /**
     * BEST 게시판 설정 업데이트
     */
    public void updateBestSettings(BestSettingUpdateDto updateDto) {
        // 최소 조회수 설정 업데이트
        SystemSetting viewCountSetting = systemSettingRepository
            .findBySettingKey("best.min_view_count")
            .orElse(new SystemSetting("best.min_view_count", "100", 
                "BEST 게시판 최소 조회수 기준", "community"));
        viewCountSetting.setSettingValue(updateDto.getMinViewCount().toString());
        systemSettingRepository.save(viewCountSetting);

        // 최소 추천수 설정 업데이트
        SystemSetting likeCountSetting = systemSettingRepository
            .findBySettingKey("best.min_like_count")
            .orElse(new SystemSetting("best.min_like_count", "10", 
                "BEST 게시판 최소 추천수 기준", "community"));
        likeCountSetting.setSettingValue(updateDto.getMinLikeCount().toString());
        systemSettingRepository.save(likeCountSetting);
    }

    /**
     * 설정값 조회 (일반적인 용도)
     */
    @Transactional(readOnly = true)
    public String getSettingValue(String key, String defaultValue) {
        return systemSettingRepository.findSettingValueByKey(key).orElse(defaultValue);
    }

    /**
     * 설정값 조회 (정수형)
     */
    @Transactional(readOnly = true)
    public Integer getSettingValueAsInteger(String key, Integer defaultValue) {
        return systemSettingRepository.findSettingValueAsIntegerByKey(key).orElse(defaultValue);
    }
}