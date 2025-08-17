package com.factlab.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

// @Component - Disabled to avoid CORS conflicts with WebConfig
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsFilter implements Filter {

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
        HttpServletResponse response = (HttpServletResponse) res;
        HttpServletRequest request = (HttpServletRequest) req;
        
        System.out.println("=== CORS FILTER CALLED ===");
        System.out.println("Method: " + request.getMethod());
        System.out.println("Origin: " + request.getHeader("Origin"));
        System.out.println("Request URI: " + request.getRequestURI());
        
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Max-Age", "3600");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        response.setHeader("Access-Control-Allow-Credentials", "false");
        
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            System.out.println("=== OPTIONS REQUEST - RETURNING 200 ===");
            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().flush();
            return;
        }
        
        System.out.println("=== CONTINUING FILTER CHAIN ===");
        chain.doFilter(req, res);
    }
}