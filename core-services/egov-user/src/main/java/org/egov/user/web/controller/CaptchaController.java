package org.egov.user.web.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.GraphicsEnvironment;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import javax.imageio.ImageIO;
import javax.servlet.http.HttpServletResponse;

@Slf4j
@RestController
@RequestMapping("/api")
public class CaptchaController {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    private static final int CAPTCHA_EXPIRY_SECONDS = 120;
    
    // Cached safe font (performance optimization)
    private static Font SAFE_FONT;

    // =========================================================
    // CAPTCHA ENDPOINT
    // =========================================================
    @GetMapping("/captcha")
    public void generateCaptcha(HttpServletResponse response) throws Exception {

        String captchaText = generateRandomText(6);
        String captchaId = UUID.randomUUID().toString();

        redisTemplate.opsForValue().set(
                "CAPTCHA:" + captchaId,
                captchaText,
                CAPTCHA_EXPIRY_SECONDS,
                TimeUnit.SECONDS
        );

        byte[] imageBytes = generateCaptchaImage(captchaText);

        response.setContentType("image/png");
        response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Captcha-Id", captchaId);

        response.getOutputStream().write(imageBytes);
        response.getOutputStream().flush();
    }


    // =========================================================
    // IMAGE GENERATOR
    // =========================================================
    private byte[] generateCaptchaImage(String text) throws Exception {

        int width = 170;
        int height = 60;

        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();

        Random random = new Random();

        // Background
        g.setColor(new Color(230, 230, 230));
        g.fillRect(0, 0, width, height);

        // Quality rendering
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        // SAFE FONT USED HERE
        g.setFont(getSafeFont(30));

        int x = 20;

     // Draw characters
        for (char c : text.toCharArray()) {

            // darker readable color
            g.setColor(new Color(
                    random.nextInt(100),
                    random.nextInt(100),
                    random.nextInt(100)
            ));

            int y = 38 + random.nextInt(6) - 3;
            int angle = random.nextInt(30) - 15;

            g.rotate(Math.toRadians(angle), x, y);
            g.drawString(String.valueOf(c), x, y);
            g.rotate(Math.toRadians(-angle), x, y);

            x += 26;
        }


        // ---------- LIGHT NOISE LINES (Reduced) ----------
        g.setStroke(new BasicStroke(1f));
        for (int i = 0; i < 2; i++) {

            g.setColor(new Color(
                    150 + random.nextInt(50),
                    150 + random.nextInt(50),
                    150 + random.nextInt(50)
            ));

            g.drawLine(
                    random.nextInt(width),
                    random.nextInt(height),
                    random.nextInt(width),
                    random.nextInt(height)
            );
        }


        // ---------- LIGHT DOT NOISE (Reduced drastically) ----------
        for (int i = 0; i < 30; i++) {

            g.setColor(new Color(
                    180 + random.nextInt(50),
                    180 + random.nextInt(50),
                    180 + random.nextInt(50)
            ));

            g.fillRect(
                    random.nextInt(width),
                    random.nextInt(height),
                    1,
                    1
            );
        }


        // ---------- THIN CURVE ----------
        g.setStroke(new BasicStroke(1f));
        g.setColor(new Color(120,120,120));

        int midY = height / 2;
        for (int i = 0; i < width; i++) {
            int offset = (int)(Math.sin(i * 0.08) * 6);
            g.drawLine(i, midY + offset, i, midY + offset);
        }
	

        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);

        return baos.toByteArray();
    }


    // =========================================================
    // SAFE FONT METHOD (CONDITIONAL FONT)
    // =========================================================
    private static Font getSafeFont(int size) {

        if (SAFE_FONT != null)
            return SAFE_FONT.deriveFont((float) size);

        GraphicsEnvironment ge =
                GraphicsEnvironment.getLocalGraphicsEnvironment();

        for (String f : ge.getAvailableFontFamilyNames()) {

            if (f.toLowerCase().contains("sans")) {
                SAFE_FONT = new Font(f, Font.BOLD, size);
                return SAFE_FONT;
            }
        }

        // fallback
        SAFE_FONT = new Font(Font.MONOSPACED, Font.BOLD, size);
        return SAFE_FONT;
    }
	
    private String generateRandomText(int length) {

        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }

        return sb.toString();
    }

	
    @GetMapping(value = "/captcha/image")
    public ResponseEntity<String> generateCaptchaImage() {

        String captchaText = generateRandomText(6);
        String captchaId = UUID.randomUUID().toString();

        redisTemplate.opsForValue().set(
                "CAPTCHA:" + captchaId,
                captchaText,
                CAPTCHA_EXPIRY_SECONDS,
                TimeUnit.SECONDS
        );

        String svg = generateSvgCaptcha(captchaText);

        return ResponseEntity
                .ok()
                .header("Content-Type", "image/svg+xml")
                .header("Captcha-Id", captchaId)
                .header("Cache-Control", "no-store, no-cache, must-revalidate")
                .header("Pragma", "no-cache")
                .body(svg);
    }
    
    /**
     * Generate captcha using SVG
     * @param text
     * @return
     */
    private String generateSvgCaptcha(String text) {

        int width = 160;
        int height = 60;

        StringBuilder svg = new StringBuilder();

        svg.append("<svg xmlns='http://www.w3.org/2000/svg' ")
           .append("width='").append(width).append("' ")
           .append("height='").append(height).append("' ")
           .append("viewBox='0 0 ").append(width).append(" ").append(height).append("'>");

        // background
        svg.append("<rect width='100%' height='100%' fill='#f2f2f2'/>");

        Random random = new Random();
        int x = 20;

        // draw each character separately (allows distortion later)
        for (char c : text.toCharArray()) {
            int y = 35 + random.nextInt(10) - 5;      // vertical jitter
            int rotate = random.nextInt(30) - 15;     // rotation

            svg.append("<text ")
               .append("x='").append(x).append("' ")
               .append("y='").append(y).append("' ")
               .append("font-size='28' ")
               .append("fill='#333' ")
               .append("font-family='monospace' ")
               .append("transform='rotate(")
               .append(rotate).append(" ")
               .append(x).append(" ")
               .append(y).append(")'>")
               .append(c)
               .append("</text>");

            x += 22;
        }

        // noise lines
        for (int i = 0; i < 3; i++) {
            svg.append("<line ")
               .append("x1='").append(random.nextInt(width)).append("' ")
               .append("y1='").append(random.nextInt(height)).append("' ")
               .append("x2='").append(random.nextInt(width)).append("' ")
               .append("y2='").append(random.nextInt(height)).append("' ")
               .append("stroke='#999' stroke-width='1'/>");
        }

        svg.append("</svg>");

        return svg.toString();
    }
    
    
	
}

