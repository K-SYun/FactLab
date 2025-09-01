package com.factlab.admin.service;

import com.factlab.admin.dto.AdminLoginRequestDto;
import com.factlab.admin.dto.AdminLoginResponseDto;
import com.factlab.admin.dto.AdminUserDto;
import com.factlab.admin.entity.AdminUser;
import com.factlab.admin.repository.AdminUserRepository;
import com.factlab.common.exception.UnauthorizedException;
import com.factlab.common.util.PasswordUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class AdminAuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(AdminAuthService.class);
    
    private final AdminUserRepository adminUserRepository;
    
    @Autowired
    public AdminAuthService(AdminUserRepository adminUserRepository) {
        this.adminUserRepository = adminUserRepository;
        
        // Startup verification
        System.out.println("=== AdminAuthService CONSTRUCTOR CALLED ===");
        System.err.println("=== AdminAuthService CONSTRUCTOR CALLED (stderr) ===");
        logger.info("AdminAuthService initialized with PasswordUtil");
        logger.error("AdminAuthService CONSTRUCTOR - This is an ERROR level log to ensure visibility");
    }
    
    /**
     * 관리자 로그인
     */
    public AdminLoginResponseDto login(AdminLoginRequestDto loginRequest) {
        System.out.println("=== ADMIN LOGIN METHOD CALLED ===");
        System.err.println("=== ADMIN LOGIN METHOD CALLED (stderr) ===");
        System.out.println("Username: " + loginRequest.getUsername());
        System.out.println("Password length: " + (loginRequest.getPassword() != null ? loginRequest.getPassword().length() : "null"));
        
        logger.error("ADMIN LOGIN METHOD CALLED - username: {}", loginRequest.getUsername());
        logger.debug("로그인 시도: username={}", loginRequest.getUsername());
        
        try {
            // 사용자명으로 관리자 계정 조회
            Optional<AdminUser> adminUserOpt = adminUserRepository.findByUsername(loginRequest.getUsername());
            
            if (adminUserOpt.isEmpty()) {
                logger.debug("사용자를 찾을 수 없음: username={}", loginRequest.getUsername());
                throw new UnauthorizedException("잘못된 사용자명 또는 비밀번호입니다.");
            }

            AdminUser adminUser = adminUserOpt.get();
            System.out.println("=== USER FOUND ===");
            System.out.println("Username: " + adminUser.getUsername());
            System.out.println("Email: " + adminUser.getEmail());
            System.out.println("IsActive: " + adminUser.getIsActive());
            System.out.println("Stored hash: " + adminUser.getPassword());
            
            logger.debug("사용자 찾음: username={}, email={}, isActive={}", 
                        adminUser.getUsername(), adminUser.getEmail(), adminUser.getIsActive());
            
            // 계정 활성화 확인
            if (!adminUser.getIsActive()) {
                logger.debug("비활성화된 계정: username={}", loginRequest.getUsername());
                throw new UnauthorizedException("비활성화된 계정입니다.");
            }
            
            // 비밀번호 확인
            System.out.println("=== PASSWORD VERIFICATION ===");
            System.out.println("Input password: " + loginRequest.getPassword());
            System.out.println("Stored password: " + adminUser.getPassword());
            
            // BCrypt 해시 비교 사용
            boolean passwordMatches = PasswordUtil.matches(loginRequest.getPassword(), adminUser.getPassword());
            System.out.println("Password matches: " + passwordMatches);
            
            logger.debug("비밀번호 검증: username={}, matches={}, inputPassword={}, storedHash={}", 
                        loginRequest.getUsername(), passwordMatches, loginRequest.getPassword(), adminUser.getPassword());
            
            if (!passwordMatches) {
                logger.debug("비밀번호 불일치: username={}", loginRequest.getUsername());
                throw new UnauthorizedException("잘못된 사용자명 또는 비밀번호입니다.");
            }
            
            // 최근 로그인 시간 업데이트 (임시로 주석 처리)
            // adminUser.updateLastLogin();
            // adminUserRepository.save(adminUser);
            
            logger.debug("로그인 성공: username={}", loginRequest.getUsername());
            
            // 개발용 임시 토큰 (실제 JWT 대신 사용자명 사용)
            String token = "dev-token-" + adminUser.getUsername();
            logger.debug("임시 토큰 생성 완료: username={}", loginRequest.getUsername());
            
            // 응답 DTO 생성
            AdminUserDto userDto = AdminUserDto.from(adminUser);
            return new AdminLoginResponseDto(token, userDto);
            
        } catch (UnauthorizedException e) {
            logger.error("인증 실패: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("로그인 처리 중 오류 발생: username={}, error={}", loginRequest.getUsername(), e.getMessage(), e);
            throw new UnauthorizedException("로그인 처리 중 오류가 발생했습니다.");
        }
    }
    
    /**
     * 토큰으로 관리자 정보 조회 (개발용 임시)
     */
    @Transactional(readOnly = true)
    public AdminUserDto getCurrentAdmin(String token) {
        // 개발용: 토큰에서 사용자명 추출
        if (token.startsWith("dev-token-")) {
            String username = token.replace("dev-token-", "");
            Optional<AdminUser> adminUserOpt = adminUserRepository.findByUsername(username);
            if (adminUserOpt.isEmpty()) {
                throw new UnauthorizedException("유효하지 않은 토큰입니다.");
            }
            
            AdminUser adminUser = adminUserOpt.get();
            if (!adminUser.getIsActive()) {
                throw new UnauthorizedException("비활성화된 계정입니다.");
            }
            
            return AdminUserDto.from(adminUser);
        }
        throw new UnauthorizedException("유효하지 않은 토큰입니다.");
    }
    
    /**
     * 토큰 검증 (개발용 임시)
     */
    public boolean validateToken(String token) {
        return token != null && token.startsWith("dev-token-");
    }
    
    /**
     * 패스워드 해시 생성 (개발용 임시)
     */
    public String hashPassword(String plainPassword) {
        String hash = PasswordUtil.encode(plainPassword);
        
        // 즉시 검증 테스트
        boolean immediateTest = PasswordUtil.matches(plainPassword, hash);
        System.out.println("=== IMMEDIATE HASH TEST ===");
        System.out.println("Plain password: " + plainPassword);
        System.out.println("Generated hash: " + hash);
        System.out.println("Immediate match test: " + immediateTest);
        System.out.println("Using PasswordUtil");
        
        return hash;
    }
    
    /**
     * 패스워드 검증 테스트 (디버깅용)
     */
    public boolean testPasswordMatch(String plainPassword, String hash) {
        boolean matches = PasswordUtil.matches(plainPassword, hash);
        System.out.println("=== PASSWORD MATCH TEST ===");
        System.out.println("Plain password: " + plainPassword);
        System.out.println("Hash: " + hash);
        System.out.println("Matches: " + matches);
        System.out.println("Using PasswordUtil");
        return matches;
    }
}