package com.factlab.admin.service;

import com.factlab.admin.dto.AdminUserDto;
import com.factlab.admin.dto.AdminUserRequestDto;
import com.factlab.admin.entity.AdminUser;
import com.factlab.admin.repository.AdminUserRepository;
import com.factlab.common.exception.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminAccountService {
    
    private final AdminUserRepository adminUserRepository;
    
    @Autowired
    public AdminAccountService(AdminUserRepository adminUserRepository) {
        this.adminUserRepository = adminUserRepository;
    }
    
    @Transactional(readOnly = true)
    public List<AdminUserDto> getAllAdminUsers() {
        return adminUserRepository.findAll()
                .stream()
                .map(AdminUserDto::from)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public AdminUserDto getAdminUserById(Long id) {
        AdminUser adminUser = adminUserRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("관리자 계정을 찾을 수 없습니다: " + id));
        return AdminUserDto.from(adminUser);
    }
    
    public AdminUserDto createAdminUser(AdminUserRequestDto requestDto) {
        if (adminUserRepository.existsByUsername(requestDto.getUsername())) {
            throw new IllegalArgumentException("이미 사용 중인 사용자명입니다: " + requestDto.getUsername());
        }
        
        if (adminUserRepository.existsByEmail(requestDto.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + requestDto.getEmail());
        }
        
        AdminUser adminUser = requestDto.toEntity();
        
        if (requestDto.getPassword() != null && !requestDto.getPassword().isEmpty()) {
            // 개발 단계에서는 평문으로 저장 (추후 해시화 필요)
            adminUser.setPassword(requestDto.getPassword());
        } else {
            throw new IllegalArgumentException("비밀번호는 필수입니다.");
        }
        
        AdminUser savedUser = adminUserRepository.save(adminUser);
        return AdminUserDto.from(savedUser);
    }
    
    public AdminUserDto updateAdminUser(Long id, AdminUserRequestDto requestDto) {
        AdminUser existingUser = adminUserRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("관리자 계정을 찾을 수 없습니다: " + id));
        
        if (!existingUser.getUsername().equals(requestDto.getUsername()) &&
            adminUserRepository.existsByUsername(requestDto.getUsername())) {
            throw new IllegalArgumentException("이미 사용 중인 사용자명입니다: " + requestDto.getUsername());
        }
        
        if (!existingUser.getEmail().equals(requestDto.getEmail()) &&
            adminUserRepository.existsByEmail(requestDto.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + requestDto.getEmail());
        }
        
        existingUser.setUsername(requestDto.getUsername());
        existingUser.setEmail(requestDto.getEmail());
        existingUser.setRole(AdminUser.AdminRole.valueOf(requestDto.getRole()));
        existingUser.setIsActive(requestDto.getIsActive());
        
        if (requestDto.getPassword() != null && !requestDto.getPassword().isEmpty()) {
            // 개발 단계에서는 평문으로 저장 (추후 해시화 필요)
            existingUser.setPassword(requestDto.getPassword());
        }
        
        AdminUser updatedUser = adminUserRepository.save(existingUser);
        return AdminUserDto.from(updatedUser);
    }
    
    public void deleteAdminUser(Long id) {
        AdminUser adminUser = adminUserRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("관리자 계정을 찾을 수 없습니다: " + id));
        
        adminUserRepository.delete(adminUser);
    }
    
    @Transactional(readOnly = true)
    public List<AdminUserDto> getActiveAdminUsers() {
        return adminUserRepository.findByIsActive(true)
                .stream()
                .map(AdminUserDto::from)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<AdminUserDto> getAdminUsersByRole(AdminUser.AdminRole role) {
        return adminUserRepository.findByRole(role)
                .stream()
                .map(AdminUserDto::from)
                .collect(Collectors.toList());
    }
}