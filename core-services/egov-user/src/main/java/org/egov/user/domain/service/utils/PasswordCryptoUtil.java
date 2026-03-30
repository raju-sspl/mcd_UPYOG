package org.egov.user.domain.service.utils;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.spec.KeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class PasswordCryptoUtil {

    @Value("${password.encryption.secret}")
    private String secretKey;

    @Autowired
    private StringRedisTemplate redisTemplate;

    public String decrypt(String encryptedPassword) {
        if (encryptedPassword == null || encryptedPassword.isEmpty()) return null;

        try {
            byte[] cipherData = Base64.getDecoder().decode(URLDecoder.decode(encryptedPassword, "UTF-8"));
            
            byte[] salt = Arrays.copyOfRange(cipherData, 8, 16);
            byte[] iv = Arrays.copyOfRange(cipherData, 16, 32);
            byte[] encryptedBytes = Arrays.copyOfRange(cipherData, 32, cipherData.length);

            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            KeySpec spec = new PBEKeySpec(secretKey.toCharArray(), salt, 1000, 256);
            byte[] tmp = factory.generateSecret(spec).getEncoded();
            SecretKeySpec secretKeySpec = new SecretKeySpec(tmp, "AES");

            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, new IvParameterSpec(iv));
            String decryptedData = new String(cipher.doFinal(encryptedBytes), StandardCharsets.UTF_8);

            // Split by pipe (regex requires \\|)
            String[] parts = decryptedData.split("\\|");
            if (parts.length < 3) {
                log.error("Structure error. Found {} parts in decrypted data", parts.length);
                throw new IllegalArgumentException("Invalid security format");
            }

            String password = parts[0];
            String nonce = parts[1];
            String timestamp = parts[2];

            // 1. Time Check (60 seconds)
            Instant requestTime = Instant.parse(timestamp);
            long diff = Duration.between(requestTime, Instant.now()).abs().getSeconds();
            if (diff > 60) {
                throw new CustomException("LOGIN_EXPIRED", "Session expired.");
            }

            String redisKey = "LOGIN_NONCE:" + nonce;
            Boolean isFirstUse = redisTemplate.opsForValue().setIfAbsent(redisKey, "USED");

            if (Boolean.TRUE.equals(isFirstUse)) {
                redisTemplate.expire(redisKey, 70, TimeUnit.SECONDS);
            } else {
                log.error("Replay Attack Detected for Nonce: {}", nonce);
                throw new CustomException("REPLAY_ATTACK", "Invalid request.");
            }

            return password;
        } catch (Exception e) {
            log.error("Decryption Error: {}", e.getMessage());
            throw new CustomException("INVALID_LOGIN", "Invalid login credentials");
        }
    }
}