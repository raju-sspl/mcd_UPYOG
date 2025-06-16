package org.egov.user.web.controller;

import org.egov.common.contract.response.Error;
import org.egov.common.contract.response.ErrorResponse;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.user.domain.model.TokenWrapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.common.OAuth2AccessToken;
import org.springframework.security.oauth2.common.OAuth2RefreshToken;
import org.springframework.security.oauth2.provider.token.TokenStore;
import org.springframework.web.bind.annotation.*;

import java.util.Date;

@RestController
public class LogoutController {

    private TokenStore tokenStore;

    public LogoutController(TokenStore tokenStore) {
        this.tokenStore = tokenStore;
    }

    /**
     * End-point to logout the session.
     *
     * @param
     * @return
     * @throws Exception
     */
    @PostMapping("/_logout")
    public ResponseInfo deleteToken(@RequestBody TokenWrapper tokenWrapper) throws Exception {
        String accessToken = tokenWrapper.getAccessToken();
        OAuth2AccessToken redisToken = tokenStore.readAccessToken(accessToken);
        // tokenStore.removeAccessToken(redisToken);

        if (redisToken != null) {
            // Remove the access token
            tokenStore.removeAccessToken(redisToken);

            // Remove the linked refresh token, if present
            OAuth2RefreshToken refreshToken = redisToken.getRefreshToken();
            if (refreshToken != null) {
                tokenStore.removeRefreshToken(refreshToken);
            }
        } else {
            // Optionally log — token already expired or not present
            System.out.println("Access token not found in Redis: " + accessToken);
        }
        return new ResponseInfo("", "", System.currentTimeMillis(), "", "", "Logout successfully");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleError(Exception ex) {
        ex.printStackTrace();
        ErrorResponse response = new ErrorResponse();
        ResponseInfo responseInfo = new ResponseInfo("", "", System.currentTimeMillis(), "", "", "Logout failed");
        response.setResponseInfo(responseInfo);
        Error error = new Error();
        error.setCode(400);
        error.setDescription("Logout failed");
        response.setError(error);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
}