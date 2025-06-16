/**
 * Created By : Umesh Kumar
 * Created On : 11-06-2025
 * Purpose : Display User Role List on Topbar & user can change role and ui will change according to that role
 * Code Status : Closed
 */
import React, { useEffect, useState } from "react";
import { Dropdown } from "@nudmcdgnpm/digit-ui-react-components";
import { useHistory } from "react-router-dom";

const ChangeRole = ({ t }) => {
  const [roleOptions, setRoleOptions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const history = useHistory();

  useEffect(() => {
    const sessionData = Digit.SessionStorage.get("User");
  const userInfo = sessionData?.info;

  const roles = userInfo?.roles || [];
  // console.log("========> ", userInfo);

    const formattedRoles = roles.map((role) => ({
      label: role.name,
      value: role.code,
      tenantId: role.tenantId,
    }));

    setRoleOptions(formattedRoles);

    const selectedRoleCode = userInfo?.roles?.[0]?.code;
    const currentRole = formattedRoles.find((r) => r.value === selectedRoleCode);
    setSelectedRole(currentRole);
  }, []);

  const handleRoleChange = (selected) => {
    setSelectedRole(selected);
    console.log("Selected Role (UI only):", selected);
  };

  return (
    <div>
      <Dropdown
        option={roleOptions}
        selected={selectedRole}
        optionKey="label"
        select={handleRoleChange}
        freeze={false}
        customSelector={<label className="cp">{selectedRole?.label || "Select Role"}</label>}
      />
    </div>
  );
};

export default ChangeRole;
