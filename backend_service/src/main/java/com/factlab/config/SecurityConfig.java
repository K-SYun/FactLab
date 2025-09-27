package com.factlab.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@Profile("prod") // 운영 환경에서만 사용
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 공개 API (인증 불필요)
                        .requestMatchers("/api/health", "/actuator/**").permitAll()
                        .requestMatchers("/api/news/**").permitAll() // 뉴스 조회는 공개
                        .requestMatchers("/api/news-summary/**").permitAll() // 뉴스 요약 공개
                        .requestMatchers("/api/boards/**").permitAll() // 게시판 조회는 공개
                        .requestMatchers("/api/trending/**").permitAll() // 트렌딩 키워드
                        .requestMatchers("/api/popups/**").permitAll() // 팝업

                        // 인증 API (로그인/회원가입)
                        .requestMatchers("/api/user/auth/**").permitAll()
                        .requestMatchers("/api/admin/auth/**").permitAll()

                        // 사용자 API (인증 필요)
                        .requestMatchers("/api/user/**").authenticated() // 마이페이지, 사용자 정보
                        .requestMatchers("/api/comments/**").authenticated() // 댓글 작성/수정
                        .requestMatchers("/api/votes/**").authenticated() // 투표

                        // 관리자 API (관리자 인증 필요)
                        .requestMatchers("/api/admin/dashboard/**").permitAll() // 임시: 대시보드 API 허용
                        .requestMatchers("/api/admin/**").authenticated()

                        // 기타 모든 요청은 인증 필요
                        .anyRequest().authenticated());

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "https://polradar.com",
                "https://www.polradar.com",
                "http://polradar.com",
                "http://www.polradar.com",
                "http://backend-service:8080", // 내부 네트워크 추가
                "http://nginx:*" // nginx 컨테이너 허용
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}