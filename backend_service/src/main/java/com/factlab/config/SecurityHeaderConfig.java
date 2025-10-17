package com.factlab.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
public class SecurityHeaderConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SecurityHeaderInterceptor());
    }

    public static class SecurityHeaderInterceptor implements HandlerInterceptor {
        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
            // 보안 헤더 추가
            response.setHeader("X-Frame-Options", "SAMEORIGIN");  // DENY에서 SAMEORIGIN으로 변경 (광고 iframe 허용)
            response.setHeader("X-Content-Type-Options", "nosniff");
            response.setHeader("X-XSS-Protection", "1; mode=block");
            response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            response.setHeader("Content-Security-Policy",
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://www.googletagservices.com; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https: http:; " +
                "connect-src 'self' https: http:; " +
                "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com;");
            
            // HTTPS에서만 HSTS 헤더 추가
            if (request.isSecure()) {
                response.setHeader("Strict-Transport-Security", 
                    "max-age=31536000; includeSubDomains; preload");
            }
            
            return true;
        }
    }
}