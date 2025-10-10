import { Dropdown, Hamburger, TopBar as TopBarComponent } from "@nudmcdgnpm/digit-ui-react-components";
import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import ChangeCity from "../ChangeCity";
import ChangeRole from "../ChangeRole";
import ChangeLanguage from "../ChangeLanguage";

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
  handleUserDropdownSelection,
  logoUrl,
  showLanguageChange = true,
  setSideBarScrollTop,
}) => {
  const [profilePic, setProfilePic] = React.useState(null);
  const [zoneName, setZoneName] = React.useState(Digit.SessionStorage.get("Employee.zone"));
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
      <img className="city" src="https://mcd-asset.s3.ap-south-1.amazonaws.com/Logo.png" />
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        {loggedin &&
          (cityDetails?.city?.ulbGrade ? (
            <p className="ulb" style={mobileView ? { fontSize: "14px", display: "inline-block" } : {}}>
              {t(
                `ULBGRADE_${cityDetails?.city?.ulbGrade?.toUpperCase().replace(" ", "_").replace(".", "_")}_${cityDetails?.i18nKey
                  ?.toUpperCase()
                  .replace(" ", "_").replace(".", "_")}`
              ).toUpperCase()}
              {zoneName ? ` - ${t(`TENANT_${zoneName}`).toUpperCase()}` : ""}
            </p>
          ) : (
            <img className="state" src={logoUrl} />
          ))}
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
            <div className="left">
              {!window.location.href.includes("employee/user/login") &&
              !window.location.href.includes("employee/user/language-selection") && (
                <ChangeRole t={t} />
              )}
            </div>

            <div className="left">{showLanguageChange && <ChangeLanguage dropdown={true} />}</div>
            {userDetails?.access_token && (
              <div className="left">
                <Dropdown
                  option={userOptions}
                  optionKey={"name"}
                  select={handleUserDropdownSelection}
                  showArrow={true}
                  freeze={true}
                  style={mobileView ? { right: 0 } : {}}
                  optionCardStyles={{ overflow: "revert" }}
                  customSelector={
                    !profilePic ? ( // Changed from profilePic == null
                      <TextToImg name={userDetails?.info?.name || userDetails?.info?.userInfo?.name || "Employee"} />
                    ) : (
                      <img src={profilePic} style={{ height: "48px", width: "48px", borderRadius: "50%" }} />
                    )
                  }
                />
              </div>
            )}
            <img className="state" src="https://mcd-asset.s3.ap-south-1.amazonaws.com/sbm-logo1.png" />
          </div>
        )}
      </span>
    </div>
  );
};

export default TopBar;
