package org.egov.user.domain.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.user.domain.service.utils.EncryptionDecryptionUtil;
import org.egov.user.persistence.dto.UserRoleDTO;
import org.egov.user.persistence.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class RoleService {

    private final RoleRepository roleRepository;
    private final EncryptionDecryptionUtil encryptionDecryptionUtil;

    public RoleService(RoleRepository roleRepository,
                       EncryptionDecryptionUtil encryptionDecryptionUtil) {
        this.roleRepository = roleRepository;
        this.encryptionDecryptionUtil = encryptionDecryptionUtil;
    }

    /**
     * Purpose : Fetch roles by any user identifier
     * @param userId
     * @param username
     * @param uuid
     * @param mobileNumber
     * @param tenantId
     * @return
     */
    public List<UserRoleDTO> getUserRolesByIdentifier(Long userId, String username, String uuid, String mobileNumber, String tenantId) {

        if (tenantId == null) {
        	log.error("TenantId is missing while fetching user roles");
            throw new IllegalArgumentException("tenantId is mandatory");
        }
        log.info("Fetching user roles for tenantId={}", tenantId);
        
        /* Encrypt sensitive inputs */
        String encryptedUsername = encryptUsername(username);
        String encryptedMobile = encryptMobile(mobileNumber);
        String encryptedUuid = encryptUuid(uuid);

        return roleRepository.fetchUserRoles(
                userId,
                encryptedUsername,
                encryptedUuid,
                encryptedMobile,
                tenantId
        );
    }

    private String encryptUsername(String username) {
        if (username == null) return null;

        org.egov.user.domain.model.User temp =
                org.egov.user.domain.model.User.builder()
                        .username(username)
                        .build();

        org.egov.user.domain.model.User encrypted =
                encryptionDecryptionUtil.encryptObject(
                        temp, "User", org.egov.user.domain.model.User.class);

        return encrypted.getUsername();
    }

    private String encryptMobile(String mobile) {
        if (mobile == null) return null;

        org.egov.user.domain.model.User temp =
                org.egov.user.domain.model.User.builder()
                        .mobileNumber(mobile)
                        .build();

        org.egov.user.domain.model.User encrypted =
                encryptionDecryptionUtil.encryptObject(
                        temp, "User", org.egov.user.domain.model.User.class);

        return encrypted.getMobileNumber();
    }

    private String encryptUuid(String uuid) {
        if (uuid == null) return null;

        org.egov.user.domain.model.User temp =
                org.egov.user.domain.model.User.builder()
                        .uuid(uuid)
                        .build();

        org.egov.user.domain.model.User encrypted =
                encryptionDecryptionUtil.encryptObject(
                        temp, "User", org.egov.user.domain.model.User.class);

        return encrypted.getUuid();
    }
}
