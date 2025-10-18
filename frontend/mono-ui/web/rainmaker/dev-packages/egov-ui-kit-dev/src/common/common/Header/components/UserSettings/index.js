import { DropDown, Icon, Image, List } from "components";
import { getTransformedLocale, getLocaleLabels } from "egov-ui-framework/ui-utils/commons";
import emptyFace from "egov-ui-kit/assets/images/download.png";
import { getLocale, getTenantId, setTenantId, getUserInfo, setStoredModulesList, setModule } from "egov-ui-kit/utils/localStorageUtils";
import React, { Component } from "react";
import LogoutDialog from "../LogoutDialog";
import { getQueryArg } from "egov-ui-kit/utils/commons";
import { CommonMenuItems } from "../NavigationDrawer/commonMenuItems";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Button from "@material-ui/core/Button";
import { CircularProgress, Backdrop } from "@material-ui/core";
import axios from "axios";
import { connect } from "react-redux";
import get from "lodash/get";
import { setRoute, setLocalizationLabels } from "egov-ui-kit/redux/app/actions";
import { logout } from "egov-ui-kit/redux/auth/actions";
import Label from "egov-ui-kit/utils/translationNode";

import "./index.css";
import { getAccessToken } from "../../../../../utils/localStorageUtils";

class UserSettings extends Component {
  popupInterval = null;
  state = {
    languageSelected: getLocale(),
    displayAccInfo: false,
    tenantSelected: getTenantId(),
    tempTenantSelected: getTenantId(),
    open: false,
    roleSelected: "",
    showSessionPopup: false,
    sessionRefreshInProgress: false,
    loading: false,
    popupTimer: 0,
    designation: "",
    zone: "",
    showRoles: false,
  };
  style = {
    baseStyle: {
      background: "#ffffff",
      height: "65px",
      marginRight: "0px",
      width: "98px",
      marginBottom: "30px",
    },
    label: {
      color: "#5F5C57",
      fontSize: "14px",
      paddingRight: "0px",
    },
    arrowIconStyle: {
      marginTop: "7px",
      marginLeft: "10px",
    },
    iconStyle: {
      marginRight: "30px",
    },
    listStyle: {
      display: "block",
    },
    listInnerDivStyle: {
      padding: "10px",
      display: "flex",
      alignItems: "center",
    },
    baseTenantStyle: {
      background: "#ffffff",
      height: "65px",
      marginRight: "30px",
      width: "102px",
      marginBottom: "24px",
    },
    roleDropDownStyle: {
      background: "#ffffff",
      height: "65px",
      marginRight: "30px",
      width: "200px",
      marginBottom: "24px",
    },
  };

  onChange = (event, index, value) => {
    this.setState({ ...this.state, languageSelected: value });
    this.props.fetchLocalizationLabel(value);
  };

  handleTenantChange = () => {
    let tenantSelected = this.state.tempTenantSelected;
    this.setState({ ...this.state, tenantSelected: tenantSelected });
    setTenantId(tenantSelected);
    this.props.setRoute("/");
  };

  onTenantChange = (event, index, value) => {
    if (location.pathname.includes("/inbox")) {
      this.setState({ ...this.state, tenantSelected: value });
      setTenantId(value);
      this.props.setRoute("/");
    } else {
      this.setState({ ...this.state, open: true, tempTenantSelected: value });
    }
  };

  /**
   * TTL Popup Logic
   */
  componentDidUpdate(prevProps) {
    const { sessionTTL } = this.props;
    const { sessionRefreshInProgress } = this.state;

    // Run only when TTL changes
    if (sessionTTL !== prevProps.sessionTTL) {
      // Ignore updates during refresh
      if (sessionRefreshInProgress) return;

      // If less than 5 minutes (300 sec), show popup with countdown
      if (sessionTTL <= 300 && sessionTTL > 0 && !this.state.showSessionPopup) {
        this.setState({ showSessionPopup: true, popupTimer: sessionTTL }, () => {
          this.startPopupCountdown();
        });
      }

      // If TTL refreshed and now > 5 minutes, close popup
      if (sessionTTL > 300 && this.state.showSessionPopup) {
        this.setState({ showSessionPopup: false, popupTimer: 0 });
        if (this.popupInterval) {
          clearInterval(this.popupInterval);
          this.popupInterval = null;
        }
      }
    }
  }

  startPopupCountdown = () => {
    if (this.popupInterval) clearInterval(this.popupInterval);

    this.popupInterval = setInterval(() => {
      const { popupTimer } = this.state;

      if (popupTimer <= 1) {
        clearInterval(this.popupInterval);
        this.popupInterval = null;
        this.handleLogout(); // Auto logout when countdown ends
      } else {
        this.setState({ popupTimer: popupTimer - 1 });
      }
    }, 1000);
  };

  async componentDidMount() {
    const userInfo = JSON.parse(getUserInfo());
    const username = userInfo && userInfo.userName;
    const tenantId = userInfo && userInfo.tenantId;
    const token = getAccessToken(); // from login/session
    const body = {
      RequestInfo: {
        apiId: "Rainmaker",
        authToken: token,
        userInfo,
      },
    };

    if (username && tenantId) {
      try {
        const response = await axios.post("/egov-hrms/employees/_search", body, {
          params: { codes: username, tenantId },
          headers: { "Content-Type": "application/json" },
        });
        const emp = response && response.data && response.data.Employees && response.data.Employees[0];
        const designation =
          emp && emp.assignments && emp.assignments[0] && emp.assignments[0].designation ? emp.assignments[0].designation : "Not Assigned";
        const zone = emp && emp.jurisdictions && emp.jurisdictions[0] && emp.jurisdictions[0].zone ? emp.jurisdictions[0].zone : "Not Available";
        this.setState({ zone });
        this.setState({ designation });
      } catch (error) {
        console.error("Error fetching designation:", error);
      }
    }
    window.addEventListener("sessionRefreshComplete", () => {
      this.setState({ sessionRefreshInProgress: false, loading: false });
    });
  }
  handleContinueSession = () => {
    // Stop popup countdown if running
    if (this.popupInterval) {
      clearInterval(this.popupInterval);
      this.popupInterval = null;
    }

    // Mark refresh in progress and close popup
    this.setState({
      sessionRefreshInProgress: true,
      loading: true,
      showSessionPopup: false,
      popupTimer: 0,
    });

    // Dispatch custom event to refresh TTL in EGFFinance
    const event = new CustomEvent("refreshSession");
    window.dispatchEvent(event);
  };

  handleLogout = () => {
    if (this.loggingOut) return;
    this.loggingOut = true;

    if (this.popupInterval) {
      clearInterval(this.popupInterval);
      this.popupInterval = null;
    }

    this.setState({ loading: true, showSessionPopup: false });
    this.props.logout();
  };

  handleClose = () => {
    this.setState({ open: false, displayAccInfo: false, showRoles: false });
  };

  onLanguageChange = (event, index, value) => {
    //const {setRote} = this.props;
    this.setState({ languageSelected: value });
    let tenantId = getTenantId();

    if (process.env.REACT_APP_NAME === "Citizen") {
      const tenantInfo = getQueryArg(window.location.href, "tenantId");
      const userInfo = JSON.parse(getUserInfo());
      tenantId = userInfo && userInfo.permanentCity;
      tenantId = tenantInfo ? tenantInfo : tenantId;
    }
    var resetList = [];
    var newList = JSON.stringify(resetList);
    setStoredModulesList(newList);
    let locale = getLocale();
    let resultArray = [];
    setLocalizationLabels(locale, resultArray);
    this.props.fetchLocalizationLabel(value, tenantId, tenantId);
  };

  // onUserChange = (event, index, value) => {
  //   const { setRoute } = this.props;

  //   setRoute(value);
  // }

  toggleAccInfo() {
    this.setState({
      displayAccInfo: !this.state.displayAccInfo,
    });
  }

  handleClose = (event) => {
    // if (this.anchorEl.contains(event.target)) {
    //   return;
    // }
    this.setState({ displayAccInfo: false });
  };

  render() {
    const { languageSelected, displayAccInfo, tenantSelected, open } = this.state;
    const { style } = this;
    const { onIconClick, userInfo, handleItemClick, hasLocalisation, languages, fetchLocalizationLabel, isUserSetting } = this.props;

    // This is TTL ===========
    const { sessionTTL } = this.props;
    const safeTTL = sessionTTL || 0;

    // convert into mm:ss
    const minutes = Math.floor(safeTTL / 60);
    const seconds = safeTTL % 60;

    // pad numbers (e.g., 09:04)
    const pad = (num) => String(num).padStart(2, "0");
    const formattedTTL = `${pad(minutes)}:${pad(seconds)}`;

    // ==================== Dynamic User Menu ====================

    // 🧾 BMID
    const bmid = (userInfo && (userInfo.userName || userInfo.bmid)) || "Not Available";

    // 👥 Build role list
    const userRoleList = [
      { value: "", label: "Assigned Roles" },
      ...get(userInfo, "roles", [])
        .map((role) => role.name)
        .filter((v, i, a) => a.indexOf(v) === i)
        .map((roleCode) => ({
          value: roleCode,
          label: roleCode,
        })),
    ];
    // Build dynamic menu items
    const dynamicMenuItems = [
      //  BMID (non-clickable)
      {
        primaryText: (
          <div style={{ fontWeight: "400", color: "#1e293b" }} onClick={(e) => e.stopPropagation()} >
            BMID: <span style={{ color: "#475569" }}>{bmid}</span>
          </div>
        ),
        disabled: true,
        style: { cursor: "default" },
        id: "header-bmid",
      },

      // Assigned Roles
      {
        primaryText: (
          <div
            style={{ position: "relative" }}
            onMouseEnter={() => {
              if (this.state.displayAccInfo) {
                clearTimeout(this.roleHoverTimeout);
                this.roleHoverTimeout = setTimeout(() => {
                  this.setState({ showRoles: true });
                }, 150); // small delay to avoid flicker
              }
            }}
            onMouseLeave={() => {
              clearTimeout(this.roleHoverTimeout);
              this.roleHoverTimeout = setTimeout(() => {
                this.setState({ showRoles: false });
              }, 150);
            }}
            onClick={(e) => e.stopPropagation()} // prevent closing parent dropdown
          >
            {/* Parent row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                cursor: "pointer",
                transition: "background-color 0.3s ease",
              }}
            >
              <span
                style={{
                  color: "#1e293b",
                  fontSize: "14px",
                }}
              >
                Assigned Roles
              </span>
              <Icon
                action="navigation"
                name="chevron-right"
                color="#475569"
                style={{
                  transition: "transform 0.3s ease",
                  transform: this.state.showRoles ? "rotate(90deg)" : "rotate(0deg)",
                  height: "20px",
                  width: "20px",
                }}
              />
            </div>

            {/* Side dropdown */}
            {this.state.displayAccInfo && this.state.showRoles && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "100%",
                  marginLeft: "8px",
                  background: "#ffffff",
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.15)",
                  borderRadius: "6px",
                  padding: "6px 0",
                  zIndex: 2000,
                  minWidth: "220px",
                  opacity: 1,
                  transform: "translateX(0)",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                }}
                onMouseEnter={() => {
                  clearTimeout(this.roleHoverTimeout);
                  this.setState({ showRoles: true }); // keep open when hovering over roles list
                }}
                onMouseLeave={() => {
                  this.roleHoverTimeout = setTimeout(() => {
                    this.setState({ showRoles: false });
                  }, 150);
                }}
                onClick={(e) => e.stopPropagation()} // prevent dropdown close
              >
                {userRoleList
                  .filter((item) => item.value)
                  .map((role, index, arr) => (
                    <div
                      key={role.value}
                      style={{
                        padding: "10px 16px",
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                        color: "#475569",
                        borderBottom: index !== arr.length - 1 ? "1px solid #f1f5f9" : "none",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {role.label}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ),
        disabled: true,
        style: {
          background: "#fff",
          paddingBottom: "3px",
          paddingTop: "3px",
        },
        id: "header-roles",
      },

      // Profile
      // {
      //   primaryText: <Label label="CS_HOME_HEADER_PROFILE" />,
      //   route: "/user/profile",
      //   leftIcon: <Icon action="social" name="person" className="iconClassHover material-icons whiteColor customMenuItem" />,
      //   style: { paddingBottom: "3px", paddingTop: "3px" },
      //   id: "header-profile",
      //   path: "userprofile",
      //   renderforcsr: 1,
      //   renderforadmin: 1,
      //   renderforPGREmp: 1,
      // },

      // Logout
      {
        primaryText: <Label label="CORE_COMMON_LOGOUT" />,
        route: "/logout",
        leftIcon: <Icon action="action" name="power-settings-new" className="iconClassHover material-icons whiteColor customMenuItem" />,
        style: { borderBottom: "none" },
        id: "header-logout",
        path: "logout",
        renderforcsr: 1,
        renderforadmin: 1,
        renderforPGREmp: 1,
      },
    ];

    // ========================================================

    /**
     * Get All tenant id's from (user info -> roles) to populate dropdown
     */
    let tenantIdsList = get(userInfo, "roles", []).map((role) => {
      return role.tenantId;
    });
    tenantIdsList = [...new Set(tenantIdsList)];
    tenantIdsList = tenantIdsList.map((tenantId) => {
      return { value: tenantId, label: getLocaleLabels(tenantId, "TENANT_TENANTS_" + getTransformedLocale(tenantId)) };
    });

    return (
      <div className="userSettingsContainer">
        {isUserSetting && (
          <LogoutDialog
            logoutPopupOpen={open}
            closeLogoutDialog={this.handleClose}
            logout={this.handleTenantChange}
            oktext={"CORE_CHANGE_TENANT_OK"}
            canceltext={"CORE_CHANGE_TENANT_CANCEL"}
            title={"CORE_CHANGE_TENANT"}
            body={"CORE_CHANGE_TENANT_DESCRIPTION"}
          />
        )}
        {/* {process.env.REACT_APP_NAME === "Employee" && isUserSetting && (
          <DropDown
            onChange={this.onTenantChange}
            listStyle={style.listStyle}
            style={style.baseTenantStyle}
            labelStyle={style.label}
            dropDownData={tenantIdsList}
            value={tenantSelected}
            underlineStyle={{ borderBottom: "none" }}
          />
        )} */}
        {process.env.REACT_APP_NAME === "Employee" && isUserSetting && (
          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginRight: "10px" }}>
            {/* Role Dropdown */}
            {/* <DropDown
              onChange={(event, index, value) => {
                this.setState({ roleSelected: value });
              }}
              listStyle={style.listStyle}
              style={style.roleDropDownStyle}
              labelStyle={style.label}
              dropDownData={userRoleList}
              value={this.state.roleSelected}
              underlineStyle={{ borderBottom: "none" }}
            /> */}

            {/* Language Dropdown */}
            {hasLocalisation && (
              <DropDown
                onChange={this.onLanguageChange}
                listStyle={style.listStyle}
                style={style.baseStyle}
                labelStyle={style.label}
                dropDownData={languages}
                value={languageSelected}
                className="appbar-municipal-label"
                underlineStyle={{ borderBottom: "none" }}
              />
            )}
            {/* Divider Line */}
            <div style={{ width: "2px", height: "28px", backgroundColor: "#cbd5e1" }} />
            {/* Zone Label */}
            {this.state.zone && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#0f172a",
                  background: "rgba(59, 130, 246, 0.08)",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  boxShadow: "inset 0 0 3px rgba(59, 130, 246, 0.2)",
                }}
              >
                <Icon action="maps" name="place" color="#2563eb" style={{ width: "18px", height: "18px" }} />
                <Label
                  containerStyle={{ margin: 0, padding: 0, textTransform: "capitalize" }}
                  className="appbar-municipal-label"
                  label={`TENANT_${this.state.zone.replace(/[.]/g, "_")}`}
                />
              </div>
            )}
            {/* Divider Line */}
            <div style={{ width: "2px", height: "28px", backgroundColor: "#cbd5e1" }} />
            {/* TTL Timer */}
            {sessionTTL !== null && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "60px",
                  fontFamily: "'Inter', 'Roboto', sans-serif",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#475569",
                  letterSpacing: "0.3px",
                }}
              >
                <span style={{ marginRight: "10px", opacity: 0.8 }}>Session Time:</span>
                <span
                  style={{
                    backgroundColor:
                      safeTTL < 60
                        ? "rgba(255, 77, 79, 0.15)" // light red
                        : safeTTL < 300
                        ? "rgba(234, 179, 8, 0.15)" // light yellow
                        : "rgba(22, 163, 74, 0.15)", // light green
                    color:
                      safeTTL < 60
                        ? "#ff4d4f" // red text
                        : safeTTL < 300
                        ? "#b45309" // amber text
                        : "#15803d", // green text
                    fontSize: "15px",
                    fontWeight: "700",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    transition: "all 0.4s ease",
                    minWidth: "75px",
                    textAlign: "center",
                    display: "inline-block",
                  }}
                >
                  {formattedTTL}
                </span>
                {/* Divider Line */}
                <div style={{ width: "2px", height: "28px", marginLeft: "20px", backgroundColor: "#cbd5e1" }} />
              </div>
            )}

            {/* End of TTL Timer */}
          </div>
        )}
        {/* 
        <div>
          <Image width={"33px"} circular={true} source={userInfo.photo || emptyFace} />
          <DropDown
            onChange={this.onUserChange}
            listStyle={style.listStyle}
            style={style.baseStyle}
            labelStyle={style.label}
            dropDownData={CommonMenuItems}
            value={displayAccInfo}
            underlineStyle={{ borderBottom: "none" }}
          />
        </div> */}

        {/* <Icon action="social" name="notifications" color="#767676" style={style.iconStyle} /> */}
        <ClickAwayListener onClickAway={this.handleClose}>
          {isUserSetting && (
            <div
              onClick={() => this.toggleAccInfo()}
              className="userSettingsInnerContainer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              {/* User Image */}
              <Image
                width={"42px"}
                height={"42px"}
                circular={true}
                style={{
                  borderRadius: "2px",
                  objectFit: "cover",
                }}
                source={userInfo.photo || emptyFace}
              />

              {/* Name & Designation */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontWeight: "600",
                    fontSize: "15px",
                    color: "#1e293b",
                    height: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  {userInfo.name || "Username"}
                </span>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "400", height: "20px" }}>
                  <Label
                    label={`COMMON_MASTERS_DESIGNATION_${this.state.designation}`}
                    containerStyle={{
                      textTransform: "none",
                      lineHeight: "0px",
                      color: "#64748b",
                      paddingTop: "-5px",
                      fontWeight: "400",
                      margin: "0px",
                    }}
                    fontSize="13px"
                    className="citizen-footer-text"
                    lineHeight="0px !important"
                    labelStyle={{ padding: "0px", lineHeight: "0px", color: "#64748b", fontWeight: "400", margin: "0px" }}
                  />
                </span>
              </div>
              {/* Dropdown Icon */}
              <Icon action="navigation" name="arrow-drop-down" color="#767676" style={{ marginTop: "4px" }} />

              {/* Dropdown Menu */}
              <div className="user-acc-info">
                {displayAccInfo ? (
                  <List
                    open
                    onItemClick={(item) => {
                      if (!item.disabled && item.route) {
                        // only call for routable items
                        handleItemClick(item, false);
                      }
                    }}
                    innerDivStyle={style.listInnerDivStyle}
                    className="drawer-list-style"
                    items={dynamicMenuItems}
                    listContainerStyle={{ background: "#ffffff" }}
                    listItemStyle={{ borderBottom: "1px solid #e0e0e0" }}
                  />
                ) : (
                  ""
                )}
              </div>
            </div>
          )}
        </ClickAwayListener>

        <Dialog
          open={this.state.showSessionPopup}
          onClose={() => {}}
          disableBackdropClick
          disableEscapeKeyDown
          aria-labelledby="session-expiry-dialog"
        >
          <DialogTitle id="session-expiry-dialog" style={{ fontWeight: "600" }}>
            ⚠️ Session Expiring Soon
          </DialogTitle>

          <DialogContent>
            <DialogContentText style={{ fontSize: "15px", color: "#444" }}>
              Your session will expire in less than 5 minutes. Do you want to continue or logout now?
              <br />
              <strong>Auto logout in: {`${Math.floor(this.state.popupTimer / 60)}:${String(this.state.popupTimer % 60).padStart(2, "0")}`}</strong>
            </DialogContentText>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={this.handleLogout}
              style={{
                color: "#fff",
                backgroundColor: "#ef4444",
                fontWeight: "600",
                borderRadius: "8px",
                padding: "6px 16px",
                textTransform: "none",
              }}
            >
              Logout
            </Button>
            <Button
              onClick={this.handleContinueSession}
              style={{
                color: "#fff",
                backgroundColor: "#22c55e",
                fontWeight: "600",
                borderRadius: "8px",
                padding: "6px 16px",
                textTransform: "none",
              }}
              autoFocus
            >
              Continue Session
            </Button>
          </DialogActions>
        </Dialog>

        {this.state.loading && (
          <div className="loader-overlay">
            <div className="loader"></div>
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = ({ app, common }) => {
  const { locale, sessionTTL } = app;
  const { stateInfoById } = common;
  let languages = get(stateInfoById, "0.languages", []);
  return { languages, locale, sessionTTL };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setRoute: (route) => dispatch(setRoute(route)),
    setSessionTTL: (ttl) => dispatch({ type: "SET_SESSION_TTL", payload: ttl }),
    logout: () => dispatch(logout()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(UserSettings);
