package com.factlab.user.repository;

import com.factlab.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByNickname(String nickname);
    
    boolean existsByEmail(String email);
    
    boolean existsByNickname(String nickname);
    
    long countByCreatedAtAfter(LocalDateTime dateTime);
    
    long countByStatus(User.UserStatus status);
    
    long countByLastLoginAtAfter(LocalDateTime dateTime);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.lastLoginAt > :threshold")
    long countActiveUsers(@Param("threshold") LocalDateTime threshold);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :startDate AND u.createdAt < :endDate")
    long countByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // 관리자용 사용자 조회 메서드
    Page<User> findByStatus(User.UserStatus status, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE " +
           "(:status IS NULL OR u.status = :status) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(u.nickname) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findUsersWithFilters(@Param("status") User.UserStatus status, 
                                   @Param("search") String search, 
                                   Pageable pageable);
    
    // 사용자 통계 조회
    @Query("SELECT u FROM User u WHERE u.id IN :userIds")
    List<User> findByIdIn(@Param("userIds") List<Long> userIds);
    
    // 소셜 로그인 관련 메서드
    Optional<User> findByRegistrationMethodAndSocialProviderId(User.RegistrationMethod registrationMethod, String socialProviderId);
    
    // 소셜 회원가입 방법별 사용자 수 조회
    long countByRegistrationMethod(User.RegistrationMethod registrationMethod);
}