package com.factlab.common.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Spring Security 대신 사용할 간단한 패스워드 유틸리티
 */
public class PasswordUtil {
    
    private static final String ALGORITHM = "SHA-256";
    private static final int SALT_LENGTH = 16;
    
    /**
     * 패스워드를 해시화 (솔트 포함)
     */
    public static String encode(String plainPassword) {
        try {
            // 솔트 생성
            SecureRandom random = new SecureRandom();
            byte[] salt = new byte[SALT_LENGTH];
            random.nextBytes(salt);
            
            // 패스워드 + 솔트 해시화
            MessageDigest md = MessageDigest.getInstance(ALGORITHM);
            md.update(salt);
            byte[] hashedPassword = md.digest(plainPassword.getBytes(StandardCharsets.UTF_8));
            
            // 솔트 + 해시를 Base64로 인코딩하여 반환
            byte[] combined = new byte[salt.length + hashedPassword.length];
            System.arraycopy(salt, 0, combined, 0, salt.length);
            System.arraycopy(hashedPassword, 0, combined, salt.length, hashedPassword.length);
            
            return Base64.getEncoder().encodeToString(combined);
            
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("패스워드 해시화 실패", e);
        }
    }
    
    /**
     * 패스워드 검증
     */
    public static boolean matches(String plainPassword, String encodedPassword) {
        try {
            // Base64 디코딩
            byte[] combined = Base64.getDecoder().decode(encodedPassword);
            
            // 솔트와 해시 분리
            byte[] salt = new byte[SALT_LENGTH];
            byte[] hash = new byte[combined.length - SALT_LENGTH];
            System.arraycopy(combined, 0, salt, 0, SALT_LENGTH);
            System.arraycopy(combined, SALT_LENGTH, hash, 0, hash.length);
            
            // 입력 패스워드를 같은 솔트로 해시화
            MessageDigest md = MessageDigest.getInstance(ALGORITHM);
            md.update(salt);
            byte[] inputHash = md.digest(plainPassword.getBytes(StandardCharsets.UTF_8));
            
            // 해시 비교
            return MessageDigest.isEqual(hash, inputHash);
            
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 개발용 평문 패스워드 검증 (임시)
     */
    public static boolean matchesPlain(String plainPassword, String storedPassword) {
        return plainPassword != null && plainPassword.equals(storedPassword);
    }
}