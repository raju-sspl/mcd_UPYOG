import { Dropdown, Hamburger, LocationIcon, TopBar as TopBarComponent } from "@nudmcdgnpm/digit-ui-react-components";
import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import ChangeCity from "../ChangeCity";
import ChangeRole from "../ChangeRole";
import ChangeLanguage from "../ChangeLanguage";
import CustomUserDropdown from "./CustomUserDropdown";
import FontIncrease from "./FontIncrease";


const TextToImg = (props) => (
  <span className="user-img-txt" onClick={props.toggleMenu} title={props.name}>
    {props?.name?.[0]?.toUpperCase()}
  </span>
);
const TopBar = ({
  t,
  stateInfo,
  toggleSidebar,
  isSidebarOpen,
  handleLogout,
  userDetails,
  CITIZEN,
  cityDetails,
  mobileView,
  userOptions,
  roleOptions = [],
  selectedRole = null,
  handleRoleChange,
  handleUserDropdownSelection,
  logoUrl,
  showLanguageChange = true,
  setSideBarScrollTop,
}) => {
  const [profilePic, setProfilePic] = React.useState(null);
  const [zoneName, setZoneName] = React.useState(Digit.SessionStorage.get("Employee.zone"));
  const [designationName, setDesignationName] = React.useState(Digit.SessionStorage.get("Employee.designation"));

  React.useEffect(() => {
    const interval = setInterval(() => {
      const storedZone = Digit.SessionStorage.get("Employee.zone");
      if (storedZone && storedZone !== zoneName) {
        setZoneName(storedZone);
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const storedDesignation = Digit.SessionStorage.get("Employee.designation");
      if (storedDesignation && storedDesignation !== designationName) {
        setDesignationName(storedDesignation);
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(async () => {
    const tenant = Digit.ULBService.getCurrentTenantId();
    const uuid = userDetails?.info?.uuid;
    if (uuid) {
      const usersResponse = await Digit.UserService.userSearch(tenant, { uuid: [uuid] }, {});
      if (usersResponse && usersResponse.user && usersResponse.user.length) {
        const userDetails = usersResponse.user[0];
        const thumbs = userDetails?.photo?.split(",");
        setProfilePic(thumbs?.at(0));
      }
    }
  }, [profilePic !== null, userDetails?.info?.uuid]);

  const CitizenHomePageTenantId = Digit.ULBService.getCitizenCurrentTenant(true);

  let history = useHistory();
  const { pathname } = useLocation();

  const conditionsToDisableNotificationCountTrigger = () => {
    if (Digit.UserService?.getUser()?.info?.type === "EMPLOYEE") return false;
    if (Digit.UserService?.getUser()?.info?.type === "CITIZEN") {
      if (!CitizenHomePageTenantId) return false;
      else return true;
    }
    return false;
  };

  const { data: { unreadCount: unreadNotificationCount } = {}, isSuccess: notificationCountLoaded } = Digit.Hooks.useNotificationCount({
    tenantId: CitizenHomePageTenantId,
    config: {
      enabled: conditionsToDisableNotificationCountTrigger(),
    },
  });

  const updateSidebar = () => {
    if (!Digit.clikOusideFired) {
      toggleSidebar(true);
      setSideBarScrollTop(true);
    } else {
      Digit.clikOusideFired = false;
    }
  };

  function onNotificationIconClick() {
    history.push("/digit-ui/citizen/engagement/notifications");
  }

  const urlsToDisableNotificationIcon = (pathname) =>
    !!Digit.UserService?.getUser()?.access_token
      ? false
      : ["/digit-ui/citizen/select-language", "/digit-ui/citizen/select-location"].includes(pathname);

  if (CITIZEN) {
    return (
      <div>
        <TopBarComponent
          img={stateInfo?.logoUrlWhite}
          isMobile={true}
          toggleSidebar={updateSidebar}
          logoUrl={stateInfo?.logoUrlWhite}
          onLogout={handleLogout}
          userDetails={userDetails}
          notificationCount={unreadNotificationCount < 99 ? unreadNotificationCount : 99}
          notificationCountLoaded={notificationCountLoaded}
          cityOfCitizenShownBesideLogo={t(CitizenHomePageTenantId)}
          onNotificationIconClick={onNotificationIconClick}
          hideNotificationIconOnSomeUrlsWhenNotLoggedIn={urlsToDisableNotificationIcon(pathname)}
          changeLanguage={!mobileView ? <ChangeLanguage dropdown={true} /> : null}
        />
      </div>
    );
  }
  const loggedin = userDetails?.access_token ? true : false;
  return (
    <div className="topbar">
      {mobileView ? <Hamburger handleClick={toggleSidebar} color="#9E9E9E" /> : null}
      {/* <img className="city" /> */}
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <img className="city" src="https://abdeas-dev.sparrowsoftech.in/employee/static/media/mcd-logo.b45b7066.png" />

        {!loggedin && (
          <p className="ulb" style={mobileView ? { fontSize: "14px", display: "inline-block" } : {}}>
            {t(`MYCITY_${stateInfo?.code?.toUpperCase()}_LABEL`)} {t(`MYCITY_STATECODE_LABEL`)}
          </p>
        )}
        {!mobileView && (
          <div className={mobileView ? "right" : "flex-right right w-80 column-gap-15"} style={!loggedin ? { width: "80%" } : {}}>
            {/* <div className="left">
              {!window.location.href.includes("employee/user/login") && !window.location.href.includes("employee/user/language-selection") && (
                <ChangeCity dropdown={true} t={t} />
              )}
            </div> */}
            {loggedin &&
              (cityDetails?.city?.ulbGrade ? (
                <p
                  style={
                    mobileView
                      ? {
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 12px",
                        borderRadius: "6px",
                        background: "rgba(59, 130, 246, 0.08)", // updated background
                        color: "rgb(15, 23, 42)", // added color
                        boxShadow: "rgba(59, 130, 246, 0.2) 0px 0px 3px inset", // added shadow
                      }
                      : {
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 12px",
                        borderRadius: "6px",
                        background: "rgba(59, 130, 246, 0.08)", // updated background
                        color: "rgb(15, 23, 42)", // added color
                        boxShadow: "rgba(59, 130, 246, 0.2) 0px 0px 3px inset", // added shadow
                      }
                  }
                >
                  <LocationIcon styles={{ width: "10px", border: "none" }} className="fill-path-primary-main" />

                  {zoneName ? `${t(`TENANT_${zoneName}`).toUpperCase()}` : ""}
                </p>
              ) : (
                <img className="state" src={logoUrl} />
              ))}
            <div className="left">
              {/* {!window.location.href.includes("employee/user/login") && !window.location.href.includes("employee/user/language-selection") && (
                <ChangeRole t={t} />
              )} */}
            </div>
            <div style={{ width: "2px", height: "28px", backgroundColor: "rgb(203, 213, 225" }}></div>
            <div className="left"> <FontIncrease /></div>
            <div style={{ width: "2px", height: "28px", backgroundColor: "rgb(203, 213, 225" }}></div>
            <div className="left">{showLanguageChange && <ChangeLanguage dropdown={true} />}</div>
            <div style={{ width: "2px", height: "28px", backgroundColor: "rgb(203, 213, 225" }}></div>

            {/* {userDetails?.access_token && (
              <div className="left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Dropdown
                  option={userOptions}
                  optionKey={"name"}
                  select={handleUserDropdownSelection}
                  showArrow={true}
                  freeze={true}
                  style={mobileView ? { right: 0 } : {}}
                  optionCardStyles={{ overflow: "revert" }}
                  customSelector={
                    !profilePic ? (
                      <TextToImg name={userDetails?.info?.name || userDetails?.info?.userInfo?.name || "Employee"} />
                    ) : (
                      <img src={profilePic} style={{ height: "48px", width: "48px", borderRadius: "50%" }} />
                    )
                  }
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#0B0C0C",
                      lineHeight: "1.2",
                    }}
                  >
                    {userDetails?.info?.name.toUpperCase() || userDetails?.info?.userInfo?.name.toUpperCase() || "Employee"}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "400",
                      color: "#505A5F",
                      lineHeight: "1.2",
                    }}
                  >
                    {designationName ? `${t(`COMMON_MASTERS_DESIGNATION_${designationName}`).toUpperCase()}` : ""}
                  </div>
                </div>
              </div>
            )} */}

            {userDetails?.access_token && (
              <div className="left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <CustomUserDropdown
                  userOptions={userOptions}
                  roleOptions={roleOptions}
                  selectedRole={selectedRole}
                  handleRoleChange={handleRoleChange}
                  profilePic={profilePic}
                  userName={userDetails?.info?.name || userDetails?.info?.userInfo?.name || "Employee"}
                  t={t}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#0B0C0C",
                      lineHeight: "1.2",
                    }}
                  >
                    {userDetails?.info?.name.toUpperCase() || userDetails?.info?.userInfo?.name.toUpperCase() || "Employee"}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "400",
                      color: "#505A5F",
                      lineHeight: "1.2",
                    }}
                  >
                    {designationName ? `${t(`COMMON_MASTERS_DESIGNATION_${designationName}`).toUpperCase()}` : ""}
                  </div>
                </div>
              </div>
            )}
            <img className="state" src="https://mcd-asset.s3.ap-south-1.amazonaws.com/SBM_IMG.jpeg" />
          </div>
        )}
      </span>
    </div>
  );
};

export default TopBar;
