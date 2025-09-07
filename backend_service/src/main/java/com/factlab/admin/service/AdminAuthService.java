package com.factlab.admin.service;

import com.factlab.admin.dto.AdminLoginRequestDto;
import com.factlab.admin.dto.AdminLoginResponseDto;
import com.factlab.admin.dto.AdminUserDto;
import com.factlab.admin.entity.AdminUser;
import com.factlab.admin.repository.AdminUserRepository;
import com.factlab.common.exception.UnauthorizedException;
import com.factlab.common.util.PasswordUtil;
import com.factlab.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class AdminAuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(AdminAuthService.class);
    
    private final AdminUserRepository adminUserRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    
    @Autowired
    public AdminAuthService(AdminUserRepository adminUserRepository, AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider, PasswordEncoder passwordEncoder) {
        this.adminUserRepository = adminUserRepository;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.passwordEncoder = passwordEncoder;
    }
    
    /**
     * 관리자 로그인
     */
    public AdminLoginResponseDto login(AdminLoginRequestDto loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getUsername(),
                    loginRequest.getPassword()
                )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt = tokenProvider.generateToken(authentication);
            
            AdminUser adminUser = (AdminUser) authentication.getPrincipal();
            AdminUserDto userDto = AdminUserDto.from(adminUser);
            
            return new AdminLoginResponseDto(jwt, userDto);
            
        } catch (Exception e) {
            logger.error("Authentication failed for user: {}", loginRequest.getUsername(), e);
            throw new UnauthorizedException("Invalid username or password");
        }
    }

    /**
     * 패스워드 해시 생성 (개발용 임시)
     */
    public String hashPassword(String password) {
        return passwordEncoder.encode(password);
    }
}