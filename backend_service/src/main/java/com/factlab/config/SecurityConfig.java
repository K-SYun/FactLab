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
                                                .requestMatchers(HttpMethod.GET, "/api/news/**", "/api/boards/**")
                                                .permitAll()
                                                .requestMatchers("/api/admin/auth/**", "/api/auth/**", "/api/health",
                                                                "/actuator/health")
                                                .permitAll()
                                                .requestMatchers("/api/popups/display", "/api/trending/keywords")
                                                .permitAll()
                                                .requestMatchers("/api/admin/**", "/api/news-summary/**")
                                                .hasRole("ADMIN")
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