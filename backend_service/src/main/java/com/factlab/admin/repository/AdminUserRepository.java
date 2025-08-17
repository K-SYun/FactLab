package com.factlab.admin.repository;

import com.factlab.admin.entity.AdminUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {
    
    /**
     * 사용자명으로 관리자 계정 조회
     */
    Optional<AdminUser> findByUsername(String username);
    
    /**
     * 이메일로 관리자 계정 조회
     */
    Optional<AdminUser> findByEmail(String email);
    
    /**
     * 사용자명 중복 확인
     */
    boolean existsByUsername(String username);
    
    /**
     * 이메일 중복 확인
     */
    boolean existsByEmail(String email);
    
    /**
     * 사용자명 또는 이메일로 관리자 계정 조회
     */
    Optional<AdminUser> findByUsernameOrEmail(String username, String email);
    
    /**
     * 활성화된 관리자 계정만 조회
     */
    List<AdminUser> findByIsActive(Boolean isActive);
    
    /**
     * 역할별 관리자 계정 조회
     */
    List<AdminUser> findByRole(AdminUser.AdminRole role);
    
    /**
     * 활성화 상태와 역할로 관리자 계정 조회
     */
    List<AdminUser> findByIsActiveAndRole(Boolean isActive, AdminUser.AdminRole role);
}