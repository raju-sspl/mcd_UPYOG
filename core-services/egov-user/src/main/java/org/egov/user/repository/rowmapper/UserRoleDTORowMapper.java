package org.egov.user.repository.rowmapper;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.egov.user.persistence.dto.UserRoleDTO;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

@Component
public class UserRoleDTORowMapper implements RowMapper<UserRoleDTO> {

    @Override
    public UserRoleDTO mapRow(ResultSet rs, int rowNum) throws SQLException {

        return UserRoleDTO.builder()
                .code(rs.getString("role_code"))
                .tenantId(rs.getString("role_tenantid"))
                .build();
    }
}
