package com.factlab.user.repository;

import com.factlab.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
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
}