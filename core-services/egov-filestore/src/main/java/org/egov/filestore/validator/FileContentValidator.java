package org.egov.filestore.validator;

import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class FileContentValidator {

    // scan only first 200KB
    private static final int MAX_SCAN_BYTES = 200 * 1024;

    private static final Set<String> MALICIOUS_PATTERNS = new HashSet<>();

    /*
     * Detect script tags (case insensitive)
     * Handles:
     * <script>
     * <sCrIpT>
     * < script >
     * <script src=x>
     */
    private static final Pattern SCRIPT_PATTERN =
            Pattern.compile("<\\s*script[^>]*>", Pattern.CASE_INSENSITIVE);

    static {

        // XSS
        MALICIOUS_PATTERNS.add("</script>");
        MALICIOUS_PATTERNS.add("javascript:");
        MALICIOUS_PATTERNS.add("onerror=");
        MALICIOUS_PATTERNS.add("onload=");
        MALICIOUS_PATTERNS.add("onmouseover=");
        MALICIOUS_PATTERNS.add("onclick=");
        MALICIOUS_PATTERNS.add("alert(");
        MALICIOUS_PATTERNS.add("document.cookie");
        MALICIOUS_PATTERNS.add("window.location");
        MALICIOUS_PATTERNS.add("<iframe");

        // Server-side execution
        MALICIOUS_PATTERNS.add("<?php");
        MALICIOUS_PATTERNS.add("<jsp:");
        MALICIOUS_PATTERNS.add("<%");

        // Command execution
        MALICIOUS_PATTERNS.add("runtime.getruntime");
        MALICIOUS_PATTERNS.add("processbuilder");
        MALICIOUS_PATTERNS.add("cmd.exe");
        MALICIOUS_PATTERNS.add("/bin/sh");

        // Code execution
        MALICIOUS_PATTERNS.add("eval(");
    }

    public void validateContent(MultipartFile file, String extension) {

        if (file == null || file.isEmpty()) {
            throw new CustomException(
                    "INVALID_FILE",
                    "File is empty or missing"
            );
        }

        try (BufferedInputStream inputStream =
                     new BufferedInputStream(file.getInputStream())) {

            byte[] buffer = new byte[MAX_SCAN_BYTES];

            int totalRead = 0;
            int bytesRead;

            // Read file safely
            while (totalRead < MAX_SCAN_BYTES &&
                    (bytesRead = inputStream.read(buffer, totalRead,
                            MAX_SCAN_BYTES - totalRead)) != -1) {

                totalRead += bytesRead;
            }

            if (totalRead <= 0) {
                return;
            }

            /*
             * Use ISO_8859_1 so binary files (jpg/png/pdf) are scanned correctly
             */
            String content = new String(buffer, 0, totalRead,
                    StandardCharsets.ISO_8859_1).toLowerCase();

            /*
             * Detect script tags
             */
            if (SCRIPT_PATTERN.matcher(content).find()) {

                throw new CustomException(
                        "INVALID_FILE_CONTENT",
                        "Script tag detected in uploaded file"
                );
            }

            /*
             * Detect other malicious patterns
             */
            for (String pattern : MALICIOUS_PATTERNS) {

                if (content.contains(pattern)) {

                    throw new CustomException(
                            "INVALID_FILE_CONTENT",
                            "Malicious content detected in uploaded file"
                    );
                }
            }

            /*
             * Extra check for image formats
             */
            if (extension.equals("jpg") ||
                    extension.equals("jpeg") ||
                    extension.equals("png")) {

                if (content.contains("<script") ||
                        content.contains("javascript:")) {

                    throw new CustomException(
                            "INVALID_FILE_CONTENT",
                            "Script detected inside image file"
                    );
                }
            }

        } catch (IOException e) {

            throw new CustomException(
                    "INVALID_FILE",
                    "Unable to validate file content"
            );
        }
    }
}