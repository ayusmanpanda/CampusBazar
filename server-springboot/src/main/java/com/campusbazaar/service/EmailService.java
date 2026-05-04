package com.campusbazaar.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    @Async
    public void sendOtpEmail(String to, String otp) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, "UTF-8");
            helper.setFrom(from, "CampusBazaar");
            helper.setTo(to);
            helper.setSubject("Verify your CampusBazaar account");
            helper.setText("""
                    <div style="font-family:sans-serif;padding:24px">
                      <h2>Welcome to CampusBazaar 🎓</h2>
                      <p>Your verification code is:</p>
                      <div style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:16px 0">%s</div>
                      <p style="color:#666">Expires in 15 minutes. Ignore this email if you didn't sign up.</p>
                    </div>
                    """.formatted(otp), true);
            mailSender.send(msg);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send OTP email to {}", to, e);
        }
    }
}
