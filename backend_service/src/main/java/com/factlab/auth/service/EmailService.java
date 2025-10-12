package com.factlab.auth.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@factlab.com}")
    private String fromEmail;

    @Value("${spring.mail.enabled:false}")
    private boolean emailEnabled;

    /**
     * 이메일 인증 코드 발송
     */
    public boolean sendVerificationCode(String email, String code) {
        try {
            logger.info("이메일 인증 코드 발송 시작: {}", email);

            // 이메일 발송 기능이 활성화된 경우에만 실제 발송
            if (emailEnabled && mailSender != null) {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(fromEmail);
                helper.setTo(email);
                helper.setSubject("[PolRadar] 이메일 인증 코드");
                helper.setText(createEmailTemplate(code), true);

                mailSender.send(message);
                logger.info("이메일 발송 완료: {}", email);
            } else {
                logger.warn("이메일 발송 기능이 비활성화되어 있습니다.");
                return false;
            }

            return true;

        } catch (Exception e) {
            logger.error("이메일 발송 실패: email={}, error={}", email, e.getMessage());
            return false;
        }
    }
    
    /**
     * 이메일 인증 코드 템플릿 생성 (HTML)
     */
    private String createEmailTemplate(String code) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { background-color: #f9f9f9; padding: 30px; margin: 20px 0; }
                    .code-box { background-color: #fff; border: 2px solid #4CAF50; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; }
                    .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>PolRadar 이메일 인증</h1>
                    </div>
                    <div class="content">
                        <p>안녕하세요,</p>
                        <p>PolRadar 회원가입을 위한 이메일 인증 코드입니다.</p>
                        <div class="code-box">%s</div>
                        <p><strong>인증 코드는 30분간 유효합니다.</strong></p>
                        <p>본인이 요청하지 않은 경우 이 메일을 무시하시기 바랍니다.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 PolRadar. All rights reserved.</p>
                        <p>이 메일은 발신 전용입니다.</p>
                    </div>
                </div>
            </body>
            </html>
            """, code);
    }
}