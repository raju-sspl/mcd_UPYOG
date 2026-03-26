package org.egov.user.domain.service.utils;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.spec.KeySpec;
import java.util.Arrays;
import java.util.Base64;

@Component
@Slf4j
public class PasswordCryptoUtil {

    @Value("${password.encryption.secret}")
    private String secretKey;


    public String decrypt(String encryptedPassword) {
        try {
            byte[] cipherData = Base64.getDecoder().decode(URLDecoder.decode(encryptedPassword, "UTF-8"));
            
            // Header: Salted__ (8) + Salt (8) + IV (16) + Ciphertext
            byte[] salt = Arrays.copyOfRange(cipherData, 8, 16);
            byte[] iv = Arrays.copyOfRange(cipherData, 16, 32);
            byte[] encryptedBytes = Arrays.copyOfRange(cipherData, 32, cipherData.length);

            // Derive Key using PBKDF2 - This is standard and matches the frontend
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            KeySpec spec = new PBEKeySpec(secretKey.toCharArray(), salt, 1000, 256);
            byte[] tmp = factory.generateSecret(spec).getEncoded();
            SecretKeySpec secretKeySpec = new SecretKeySpec(tmp, "AES");

            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, new IvParameterSpec(iv));

            return new String(cipher.doFinal(encryptedBytes), StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Critical Decryption Error: {}", e.getMessage());
            throw new CustomException("INVALID_LOGIN", "Invalid credentials");
        }
    }

}