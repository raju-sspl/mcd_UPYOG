package org.egov.user.domain.service.utils;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;

@Component
@Slf4j
public class PasswordCryptoUtil {

    @Value("${password.encryption.secret}")
    private String secretKey;

    /**
     * Decrypts password encrypted using:
     * CryptoJS.AES.encrypt(password, secret)
     */
    public String decrypt(String encryptedPassword) {
        try {
            // 1. URL decode (very important)
            String decoded = URLDecoder.decode(encryptedPassword, StandardCharsets.UTF_8.name());

            // 2. Base64 decode
            byte[] cipherData = Base64.getDecoder().decode(decoded);

            // 3. Validate OpenSSL header "Salted__"
            byte[] saltHeader = Arrays.copyOfRange(cipherData, 0, 8);
            byte[] expected = "Salted__".getBytes(StandardCharsets.UTF_8);
            if (!Arrays.equals(saltHeader, expected)) {
                throw new IllegalArgumentException("Invalid OpenSSL salt header");
            }

            // 4. Extract salt and ciphertext
            byte[] salt = Arrays.copyOfRange(cipherData, 8, 16);
            byte[] encrypted = Arrays.copyOfRange(cipherData, 16, cipherData.length);

            // 5. Generate key & IV using OpenSSL EVP_BytesToKey
            byte[][] keyAndIV = evpBytesToKey(
                    32,                     // AES-256
                    16,                     // IV length
                    MessageDigest.getInstance("MD5"),
                    salt,
                    secretKey.getBytes(StandardCharsets.UTF_8),
                    1
            );

            SecretKeySpec key = new SecretKeySpec(keyAndIV[0], "AES");
            IvParameterSpec iv = new IvParameterSpec(keyAndIV[1]);

            // 6. AES decrypt
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, key, iv);

            byte[] decryptedBytes = cipher.doFinal(encrypted);
            return new String(decryptedBytes, StandardCharsets.UTF_8);

        } catch (Exception e) {
            log.error("Password decryption failed", e);
            throw new CustomException("INVALID_LOGIN", "Invalid login credentials");
        }
    }

    /**
     * OpenSSL-compatible EVP_BytesToKey implementation
     * (This is the CRITICAL part)
     */
    private static byte[][] evpBytesToKey(
            int keyLen,
            int ivLen,
            MessageDigest md,
            byte[] salt,
            byte[] password,
            int iterations) {

        byte[] key = new byte[keyLen];
        byte[] iv = new byte[ivLen];

        byte[] digest = null;
        int keyOffset = 0;
        int ivOffset = 0;

        while (keyOffset < keyLen || ivOffset < ivLen) {
            md.reset();

            if (digest != null) {
                md.update(digest);
            }

            md.update(password);
            md.update(salt);

            digest = md.digest();

            for (int i = 1; i < iterations; i++) {
                md.reset();
                digest = md.digest(digest);
            }

            int digestOffset = 0;
            while (digestOffset < digest.length) {
                if (keyOffset < keyLen) {
                    key[keyOffset++] = digest[digestOffset++];
                } else if (ivOffset < ivLen) {
                    iv[ivOffset++] = digest[digestOffset++];
                } else {
                    break;
                }
            }
        }
        return new byte[][]{key, iv};
    }
}
