package com.factlab.auth.service;

import com.factlab.auth.dto.DuplicateCheckDto;
import com.factlab.auth.dto.UserRegisterRequestDto;
import com.factlab.auth.dto.UserRegisterResponseDto;
import com.factlab.auth.dto.UserLoginRequestDto;
import com.factlab.auth.dto.UserLoginResponseDto;
import com.factlab.user.entity.User;
import com.factlab.user.repository.UserRepository;
import com.factlab.common.util.PasswordUtil;
import com.factlab.admin.service.JwtTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class UserAuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtTokenService jwtTokenService;
    
    /**
     * 이메일 중복 확인
     */
    public DuplicateCheckDto checkEmailDuplicate(String email) {
        boolean exists = userRepository.existsByEmail(email);
        
        if (exists) {
            return DuplicateCheckDto.unavailable("이미 사용 중인 이메일입니다.");
        } else {
            return DuplicateCheckDto.available("사용 가능한 이메일입니다.");
        }
    }
    
    /**
     * 닉네임 중복 확인
     */
    public DuplicateCheckDto checkNicknameDuplicate(String nickname) {
        boolean exists = userRepository.existsByNickname(nickname);
        
        if (exists) {
            return DuplicateCheckDto.unavailable("이미 사용 중인 닉네임입니다.");
        } else {
            return DuplicateCheckDto.available("사용 가능한 닉네임입니다.");
        }
    }
    
    /**
     * 사용자 회원가입
     */
    @Transactional
    public UserRegisterResponseDto registerUser(UserRegisterRequestDto requestDto) {
        try {
            // 이메일 중복 확인
            if (userRepository.existsByEmail(requestDto.getEmail())) {
                throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
            }
            
            // 닉네임 중복 확인
            if (userRepository.existsByNickname(requestDto.getNickname())) {
                throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
            }
            
            // 비밀번호 암호화
            String encryptedPassword = PasswordUtil.encode(requestDto.getPassword());
            
            // 사용자 엔티티 생성
            User user = new User();
            user.setEmail(requestDto.getEmail());
            user.setNickname(requestDto.getNickname());
            user.setPassword(encryptedPassword);
            user.setStatus(User.UserStatus.ACTIVE);
            user.setRole(User.UserRole.USER);
            user.setLevel(1);
            user.setActivityScore(0);
            
            // 저장
            User savedUser = userRepository.save(user);
            
            // 응답 DTO 생성
            return new UserRegisterResponseDto(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getNickname(),
                savedUser.getCreatedAt()
            );
            
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("이미 존재하는 이메일 또는 닉네임입니다.");
        }
    }
    
    /**
     * 사용자 로그인 인증
     */
    public UserLoginResponseDto loginUser(UserLoginRequestDto requestDto) {
        // 이메일로 사용자 조회
        Optional<User> userOptional = userRepository.findByEmail(requestDto.getEmail());
        
        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("등록되지 않은 이메일입니다.");
        }
        
        User user = userOptional.get();
        
        // 계정 상태 확인
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new IllegalArgumentException("비활성화된 계정입니다.");
        }
        
        // 비밀번호 검증 (해시 비교 시도)
        boolean passwordMatches = PasswordUtil.matches(requestDto.getPassword(), user.getPassword());
        
        // 평문 비밀번호도 테스트 (개발 환경용 - 추후 제거 예정)
        if (!passwordMatches) {
            passwordMatches = PasswordUtil.matchesPlain(requestDto.getPassword(), user.getPassword());
        }
        
        if (!passwordMatches) {
            throw new IllegalArgumentException("비밀번호가 올바르지 않습니다.");
        }
        
        // 로그인 성공 시 최근 로그인 시간 업데이트
        updateLastLoginTime(user);
        
        // JWT 토큰 생성
        String token = jwtTokenService.generateToken(user.getEmail(), user.getId());
        LocalDateTime loginTime = LocalDateTime.now();
        
        // 로그인 성공 응답 생성
        return new UserLoginResponseDto(
            user.getId(),
            user.getEmail(),
            user.getNickname(),
            token,
            loginTime
        );
    }
    
    /**
     * 사용자 최근 로그인 시간 업데이트
     */
    @Transactional
    private void updateLastLoginTime(User user) {
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
    }
}