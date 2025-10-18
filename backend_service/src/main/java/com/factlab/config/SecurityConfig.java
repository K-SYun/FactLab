package com.factlab.config;

import com.factlab.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    @Profile("dev")
    public SecurityFilterChain devFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()); // 개발 환경에서는 모든 요청 허용

        return http.build();
    }

    @Bean
    @Profile("prod")
    public SecurityFilterChain prodFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(prodCorsConfigurationSource()))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // ========== 공개 API (인증 불필요) ==========
                        // 헬스체크
                        .requestMatchers("/api/health", "/actuator/health").permitAll()
                        // 인증 API
                        .requestMatchers("/api/admin/auth/**", "/api/auth/**").permitAll()
                        // Swagger
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // ========== 사용자 API (인증 불필요) ==========
                        // 뉴스 조회
                        .requestMatchers(HttpMethod.GET, "/api/news/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/news/*/view").permitAll()
                        // 게시판/게시글/댓글 조회
                        .requestMatchers(HttpMethod.GET, "/api/boards/**", "/api/posts/**", "/api/comments/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/boards/*/view").permitAll()
                        // 트렌딩/팝업
                        .requestMatchers(HttpMethod.GET, "/api/trending/**", "/api/popups/**").permitAll()

                        // ========== 사용자 API (로그인 필요) ==========
                        // 투표
                        .requestMatchers(HttpMethod.POST, "/api/news/*/vote").authenticated()
                        // 댓글/게시글 작성
                        .requestMatchers(HttpMethod.POST, "/api/comments/**", "/api/posts/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/comments/**", "/api/posts/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/comments/**", "/api/posts/**").authenticated()
                        // 마이페이지 (본인 정보만 조회/수정 가능)
                        .requestMatchers(HttpMethod.GET, "/api/users/*/profile").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/users/*/profile").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/user/social-accounts/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/user/social-accounts/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/user/social-accounts/**").authenticated()

                        // ========== 관리자 API (ADMIN 권한 필요) ==========
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/news-summary/**").hasRole("ADMIN")

                        // ========== 기타 모든 요청 ==========
                        .anyRequest().authenticated());

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

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
    @Profile("prod")
    public CorsConfigurationSource prodCorsConfigurationSource() {
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