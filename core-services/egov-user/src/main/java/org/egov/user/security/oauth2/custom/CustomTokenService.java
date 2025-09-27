package org.egov.user.security.oauth2.custom;

import lombok.extern.slf4j.Slf4j;
import org.egov.user.domain.service.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.common.OAuth2AccessToken;
import org.springframework.security.oauth2.provider.OAuth2Authentication;
import org.springframework.security.oauth2.provider.token.DefaultTokenServices;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.provider.token.TokenStore;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CustomTokenService extends DefaultTokenServices {

    @Autowired
    private TokenService tokenService;

    // manual token store pass as constructor param removed
    @Autowired
    public void setTokenStore(TokenStore tokenStore) {
        super.setTokenStore(tokenStore);
    }

    @Override
    public OAuth2AccessToken createAccessToken(OAuth2Authentication authentication) throws AuthenticationException {
        log.info("In MyTokenServices before getAccessToken");
        if (authentication == null) {
            log.error("OAuth2Authentication is null");
        } else {
            log.debug("OAuth2Authentication: {}", authentication);
        }

        try {
            OAuth2AccessToken existingAccessToken = this.getAccessToken(authentication);
        } catch (Exception e) {
            log.warn("Could not get existing access token due to exception — ignoring exception and creating new.");
            try {
                // Delete the old auth_to_access key (stale Redis mapping) in case of exception
                log.error("Exception occurred while getting existing access token", e);
                tokenService.deleteAuthToAccessKey(authentication);
            } catch (Exception ex) {
                log.error("Error while deleting old auth_to_access key", ex);
            }
        }

        OAuth2AccessToken accessToken =null;

        try {
            log.info("About to create access token...");
            accessToken = super.createAccessToken(authentication);
            log.info("Access token created successfully:");
            return accessToken;
        } catch (Exception e) {
            log.error("Exception occurred while creating access token", e);
            throw e; // You can rethrow or wrap if you want
        }
        //return super.createAccessToken(authentication);
    }


}