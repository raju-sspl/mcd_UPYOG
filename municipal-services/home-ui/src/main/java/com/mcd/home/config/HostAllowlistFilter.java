package com.mcd.home.config;

//import jakarta.servlet.FilterChain;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class HostAllowlistFilter extends OncePerRequestFilter {

    private final Set<String> allowedHosts;

    public HostAllowlistFilter(@Value("${security.allowed-hosts}") String allowedHostsCsv) {
        this.allowedHosts = Arrays.stream(allowedHostsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(String::toLowerCase)
                .collect(Collectors.toCollection(HashSet::new));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String host = request.getHeader("Host");
        String forwardedHost = request.getHeader("X-Forwarded-Host");

        // Prefer the effective host as seen externally if you are behind proxy,
        // but only if you trust that proxy (enforced at Nginx).
        String effective = (forwardedHost != null && !forwardedHost.trim().isEmpty())
                ? forwardedHost.split(",")[0].trim()
                : host;

        if (effective == null || effective.trim().isEmpty()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid Host header");
            return;
        }

        // Remove port if present: host:443
        String normalized = effective.toLowerCase().replaceFirst(":\\d+$", "");

        if (!allowedHosts.contains(normalized)) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Untrusted Host header");
            return;
        }

        filterChain.doFilter(request, response);
    }
}

