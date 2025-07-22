package org.egov.user.domain.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.user.domain.exception.InvalidAccessTokenException;
import org.egov.user.domain.model.SecureUser;
import org.egov.user.domain.model.UserDetail;
import org.egov.user.persistence.repository.ActionRestRepository;
import org.egov.user.security.CustomAuthenticationKeyGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.jedis.JedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.oauth2.provider.OAuth2Authentication;
import org.springframework.security.oauth2.provider.token.TokenStore;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class TokenService {

    private TokenStore tokenStore;

    private ActionRestRepository actionRestRepository;

    @Value("${roles.state.level.enabled}")
    private boolean isRoleStateLevel;

    @Autowired
    private JedisConnectionFactory jedisConnectionFactory;


    @Autowired
    private CustomAuthenticationKeyGenerator authenticationKeyGenerator;

    private TokenService(TokenStore tokenStore, ActionRestRepository actionRestRepository) {
        this.tokenStore = tokenStore;
        this.actionRestRepository = actionRestRepository;
    }

    /**
     * Get UserDetails By AccessToken
     *
     * @param accessToken
     * @return
     */
    public UserDetail getUser(String accessToken) {
        if (StringUtils.isEmpty(accessToken)) {
            throw new InvalidAccessTokenException();
        }

        OAuth2Authentication authentication = tokenStore.readAuthentication(accessToken);

        if (authentication == null) {
            throw new InvalidAccessTokenException();
        }

        SecureUser secureUser = ((SecureUser) authentication.getPrincipal());
        return new UserDetail(secureUser, null);
//		String tenantId = null;
//		if (isRoleStateLevel && (secureUser.getTenantId() != null && secureUser.getTenantId().contains(".")))
//			tenantId = secureUser.getTenantId().split("\\.")[0];
//		else
//			tenantId = secureUser.getTenantId();
//
//		List<Action> actions = actionRestRepository.getActionByRoleCodes(secureUser.getRoleCodes(), tenantId);
//		log.info("returning STATE-LEVEL roleactions for tenant: "+tenantId);
//		return new UserDetail(secureUser, actions);
    }

    /**
     * Deletes the auth_to_access Redis mapping for a given OAuth2Authentication.
     *
     * @param authentication the authentication object
     */
    public void deleteAuthToAccessKey(OAuth2Authentication authentication) {
        RedisConnection connection = null;
        if (authentication == null) {
            log.warn("Cannot delete auth_to_access key: authentication is null");
            return;
        }

        try {
            // You MUST inject your CustomAuthenticationKeyGenerator as a bean
            String authenticationKey = authenticationKeyGenerator.extractKey(authentication);
            String redisKey = "auth_to_access:" + authenticationKey;
            log.info("Deleting Redis auth_to_access key: {}", redisKey);

            // Select DB 0 (in case your factory is configured differently)
            Long removed;
            try {
                connection = jedisConnectionFactory.getConnection();
                connection.select(0);
                removed = connection.del(redisKey.getBytes());
            } finally {
                if (connection != null) {
                    connection.close();
                }
            }
            log.info("Deleted key '{}'? {}", redisKey, removed == 1);

        } catch (Exception e) {
            log.error("Error while deleting auth_to_access key from Redis", e);
        }
    }


}