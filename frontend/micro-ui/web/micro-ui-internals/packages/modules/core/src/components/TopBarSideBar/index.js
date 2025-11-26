import React, { useState, useEffect } from "react";
import { EditPencilIcon, LogoutIcon } from "@nudmcdgnpm/digit-ui-react-components";
import TopBar from "./TopBar";
import { useHistory } from "react-router-dom";
import SideBar from "./SideBar";
import LogoutDialog from "../Dialog/LogoutDialog";
const TopBarSideBar = ({
  t,
  stateInfo,
  userDetails,
  CITIZEN,
  cityDetails,
  mobileView,
  handleUserDropdownSelection,
  logoUrl,
  showSidebar = true,
  showLanguageChange,
  linkData,
  islinkDataLoading,
}) => {
  const [isSidebarOpen, toggleSidebar] = useState(false);
  const [isSideBarScroll, setSideBarScrollTop] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const history = useHistory();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const sessionData = Digit.SessionStorage.get("User");
    const userInfo = sessionData?.info;
    const roles = userInfo?.roles || [];
    
    const formattedRoles = roles.map((role) => ({
      name: role.name,
      code: role.code,
      tenantId: role.tenantId,
    }));
    
    setRoleOptions(formattedRoles);
    
    const selectedRoleCode = userInfo?.roles?.[0]?.code;
    const currentRole = formattedRoles.find((r) => r.code === selectedRoleCode);
    setSelectedRole(currentRole);
  }, []);

  const handleLogout = () => {
    toggleSidebar(false);
    setShowDialog(true);
  };

  const handleOnSubmit = () => {
    Digit.UserService.logout();
    setShowDialog(false);
  };

  const handleOnCancel = () => {
    setShowDialog(false);
  };

  const userProfile = () => {
    history.push("/digit-ui/employee/user/profile");
  };

  const handleRoleChange = (selected) => {
    setSelectedRole(selected);
    console.log("Selected Role:", selected);
    // Add your role change logic here
  };

  const userOptions = [
    { name: t("EDIT_PROFILE"), icon: <EditPencilIcon className="icon" />, func: userProfile },
    { name: t("CORE_COMMON_LOGOUT"), icon: <LogoutIcon className="icon" />, func: handleLogout },
  ];

  return (
    <React.Fragment>
      <TopBar
        t={t}
        stateInfo={stateInfo}
        toggleSidebar={toggleSidebar}
        setSideBarScrollTop={setSideBarScrollTop}
        isSidebarOpen={isSidebarOpen}
        isSideBarScroll={isSideBarScroll}
        handleLogout={handleLogout}
        userDetails={userDetails}
        CITIZEN={CITIZEN}
        cityDetails={cityDetails}
        mobileView={mobileView}
        userOptions={userOptions}
        roleOptions={roleOptions}
        selectedRole={selectedRole}
        handleRoleChange={handleRoleChange}
        handleUserDropdownSelection={handleUserDropdownSelection}
        logoUrl={logoUrl}
        showLanguageChange={showLanguageChange}
      />
      {showDialog && <LogoutDialog onSelect={handleOnSubmit} onCancel={handleOnCancel} onDismiss={handleOnCancel}></LogoutDialog>}
      {showSidebar && (
        <SideBar
          t={t}
          CITIZEN={CITIZEN}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          isSideBarScroll={isSideBarScroll}
          setSideBarScrollTop={setSideBarScrollTop}
          handleLogout={handleLogout}
          mobileView={mobileView}
          userDetails={userDetails}
          linkData={linkData}
          islinkDataLoading={islinkDataLoading}
        />
      )}
    </React.Fragment>
  );
};

export default TopBarSideBar;