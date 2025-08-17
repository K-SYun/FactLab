package com.factlab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(exclude = {org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class})
public class FactlabApplication {
    public static void main(String[] args) {
        SpringApplication.run(FactlabApplication.class, args);
    }
}