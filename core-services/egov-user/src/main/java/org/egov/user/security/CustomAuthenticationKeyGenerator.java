package org.egov.user.security;

import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.LinkedHashMap;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.common.util.OAuth2Utils;
import org.springframework.security.oauth2.provider.OAuth2Authentication;
import org.springframework.security.oauth2.provider.OAuth2Request;
import org.springframework.security.oauth2.provider.token.AuthenticationKeyGenerator;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class CustomAuthenticationKeyGenerator implements AuthenticationKeyGenerator {
    private static final String CLIENT_ID = "client_id";

    private static final String SCOPE = "scope";

    private static final String USERNAME = "username";

    @Value("${key.generator.hash.algorithm}")
    private String hashAlgorithm;

    @Override
    public String extractKey(OAuth2Authentication authentication) {
        Map<String, String> values = new LinkedHashMap<String, String>();
        OAuth2Request authorizationRequest = authentication.getOAuth2Request();
        log.info("DEBUG: authorizationRequest = {}", authorizationRequest);
        if (!authentication.isClientOnly()) {
            log.info("Client Name value put {}", authentication.getName());
            values.put(USERNAME, authentication.getName());
        }
        log.info("Client ID value put");
        values.put(CLIENT_ID, authorizationRequest.getClientId());
        if (authorizationRequest.getScope() != null) {
            log.info("Client Scope value put");
            values.put(SCOPE, OAuth2Utils.formatParameterList(authorizationRequest.getScope()));
        }
        log.info("DEBUG: requestParameters = {}", authorizationRequest.getRequestParameters());
        String tenantId = authorizationRequest.getRequestParameters().get("tenantId");
        if (tenantId != null && !tenantId.isEmpty()) {
            log.info("Client tenantID value put");
            values.put("tenantId", tenantId);
        }

        MessageDigest digest;
        try {
            digest = MessageDigest.getInstance(hashAlgorithm);
            log.info("DEBUG: digest = {}", digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(hashAlgorithm+" algorithm not available.  Fatal (should be in the JDK).");
        }

        try {
            log.info("before digest bytes");
            byte[] bytes = digest.digest(values.toString().getBytes("UTF-8"));
            log.info("after digest bytes: bytes = {}", bytes.length);
            return String.format("%032x", new BigInteger(1, bytes));
        } catch (UnsupportedEncodingException e) {
            throw new IllegalStateException("UTF-8 encoding not available.  Fatal (should be in the JDK).");
        }
    }
}