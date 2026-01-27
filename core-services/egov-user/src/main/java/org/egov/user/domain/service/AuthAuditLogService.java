package org.egov.user.domain.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AuthAuditLogService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void log(
            String userUuid,
            String username,
            String ip,
            String userAgent,
            String sessionId,
            String action,
            String status,
            String requestUrl) {

        try {
            jdbcTemplate.update(
                "INSERT INTO eg_user_auth_audit " +
                "(user_uuid, username, ip_address, user_agent, session_id, action, status, request_url) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                userUuid, username, ip, userAgent, sessionId, action, status, requestUrl
            );
        } catch (Exception e) {
            log.error("Failed to write auth audit log", e);
        }
    }
}
