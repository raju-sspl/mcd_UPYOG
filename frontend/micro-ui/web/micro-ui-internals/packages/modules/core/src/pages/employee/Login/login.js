import { BackButton, Dropdown, FormComposer, Loader, Toast } from "@nudmcdgnpm/digit-ui-react-components";
import PropTypes from "prop-types";
import React, { useEffect, useState, useMemo } from "react";
import { useHistory } from "react-router-dom";
import Background from "../../../components/Background";
import Header from "../../../components/Header";
import HrmsService from "../../../../../../libraries/src/services/elements/HRMS";

/* set employee details to enable backward compatiable */
const setEmployeeDetail = (userObject, token) => {
  let locale = JSON.parse(sessionStorage.getItem("Digit.locale"))?.value || "en_IN";
  localStorage.setItem("Employee.tenant-id", userObject?.tenantId);
  localStorage.setItem("tenant-id", userObject?.tenantId);
  localStorage.setItem("citizen.userRequestObject", JSON.stringify(userObject));
  localStorage.setItem("locale", locale);
  localStorage.setItem("Employee.locale", locale);
  localStorage.setItem("token", token);
  localStorage.setItem("Employee.token", token);
  localStorage.setItem("user-info", JSON.stringify(userObject));
  localStorage.setItem("Employee.user-info", JSON.stringify(userObject));
};

const Login = ({ config: propsConfig, t, isDisabled }) => {
  const { data: cities, isLoading } = Digit.Hooks.useTenants();
  const { data: storeData, isLoading: isStoreLoading } = Digit.Hooks.useStore.getInitData();
  const { stateInfo } = storeData || {};
  const [user, setUser] = useState(null);
  const [showToast, setShowToast] = useState(null);
  const [disable, setDisable] = useState(false);
  const [captchaText, setCaptchaText] = useState(() => generateCaptchaText());
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  const history = useHistory();
  // const getUserType = () => "EMPLOYEE" || Digit.UserService.getType();
  let sourceUrl = "https://s3.ap-south-1.amazonaws.com/egov-qa-assets";
  const pdfUrl = "https://pg-egov-assets.s3.ap-south-1.amazonaws.com/Upyog+Code+and+Copyright+License_v1.pdf";

  function generateCaptchaText() {
    const chars = '0123456789';
    let captchaText = '';
    for (let i = 0; i < 6; i++) {
      captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return captchaText;
  }

  // ... [other captcha functions remain unchanged]
  function getCharStyles(index) {
    return {
      fontSize: `${Math.floor(Math.random() * 10) + 18}px`,
      fontFamily: index % 2 === 0 ? 'Arial' : 'Verdana',
      fontWeight: index % 2 === 0 ? 'bold' : 'normal',
      x: 30 + (index * 25),
      y: 30,
      rotation: Math.floor(Math.random() * 40) - 20,
      translateY: Math.floor(Math.random() * 10) - 5
    };
  }

  function generateNoiseLines() {
    const lines = [];
    for (let i = 0; i < 4; i++) {
      lines.push({
        x1: Math.floor(Math.random() * 200),
        y1: Math.floor(Math.random() * 50),
        x2: Math.floor(Math.random() * 200),
        y2: Math.floor(Math.random() * 50),
        // stroke: `rgb(${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)})`,
        // strokeWidth: Math.floor(Math.random() * 2) + 1,
      });
    }
    return lines;
  }

  function generateNoiseDots() {
    const dots = [];
    for (let i = 0; i < 30; i++) {
      dots.push({
        // cx: Math.floor(Math.random() * 200),
        // cy: Math.floor(Math.random() * 50),
        // r: Math.floor(Math.random() * 2) + 1,
        // fill: `rgb(${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)})`,
      });
    }
    return dots;
  }

  const noiseLines = useMemo(() => generateNoiseLines(), [captchaText]);
  const noiseDots = useMemo(() => generateNoiseDots(), [captchaText]);
  const charStyles = useMemo(() =>
    captchaText.split('').map((_, index) => getCharStyles(index)),
    [captchaText]
  );

  const refreshCaptcha = () => {
    setCaptchaText(generateCaptchaText());
    setCaptchaInput("");
    setCaptchaError("");
  };

  const validateCaptcha = () => {
    if (!captchaInput) {
      setCaptchaError("Please enter the captcha");
      return false;
    }

    if (captchaInput !== captchaText) {
      setCaptchaError("Invalid captcha. Please try again");

      // Delay refreshing the captcha to allow error message to show
      setTimeout(() => {
        refreshCaptcha();
      }, 2000);

      return false;
    }

    setCaptchaError(""); // Clear error if captcha is correct
    return true;
  }

  const defaultCity = useMemo(() => {
    return cities?.find((c) => c.code === "dl.mcd") || null;
  }, [cities]);

  useEffect(() => {
    if (!user) {
      return;
    }
    Digit.SessionStorage.set("citizen.userRequestObject", user);
    const filteredRoles = user?.info?.roles?.filter((role) => role.tenantId === Digit.SessionStorage.get("Employee.tenantId"));
    if (user?.info?.roles?.length > 0) user.info.roles = filteredRoles;
    Digit.UserService.setUser(user);
    setEmployeeDetail(user?.info, user?.access_token);
    let redirectPath = "/digit-ui/employee";

    /* logic to redirect back to same screen where we left off  */
    if (window?.location?.href?.includes("from=")) {
      redirectPath = decodeURIComponent(window?.location?.href?.split("from=")?.[1]) || "/digit-ui/employee";
    }

    /*  RAIN-6489 Logic to navigate to National DSS home incase user has only one role [NATADMIN]*/
    if (user?.info?.roles && user?.info?.roles?.length > 0 && user?.info?.roles?.every((e) => e.code === "NATADMIN")) {
      redirectPath = "/digit-ui/employee/dss/landing/NURT_DASHBOARD";
    }
    /*  RAIN-6489 Logic to navigate to National DSS home incase user has only one role [NATADMIN]*/
    if (user?.info?.roles && user?.info?.roles?.length > 0 && user?.info?.roles?.every((e) => e.code === "STADMIN")) {
      redirectPath = "/digit-ui/employee/dss/landing/home";
    }

    history.replace(redirectPath);
  }, [user]);

  const onLogin = async (data) => {
    if (!data.city) {
      alert("Please Select City!");
      return;
    }

    if (!validateCaptcha()) {
      return;
    }
    setDisable(true);

    const requestData = {
      ...data,
      userType: "EMPLOYEE",
      tenantId: data.city.code,
    };
    delete requestData.city;

    try {
      const { UserRequest: info, ...tokens } = await Digit.UserService.authenticate(requestData);
      Digit.SessionStorage.set("Employee.tenantId", info?.tenantId);
      setUser({ info, ...tokens });
      Digit.UserService.setUser({ info, ...tokens });

      const hrmsResponse = await HrmsService.search(info?.tenantId, { codes: info?.userName });
      const employee = hrmsResponse?.Employees?.[0];
      const zone = employee?.jurisdictions?.[0]?.zone;
      const designation = employee?.assignments?.[0]?.designation;
      const department = employee?.assignments?.[0]?.department;

      if (designation) {
        Digit.SessionStorage.set("Employee.designation", designation);
      }
      if (department) {
        Digit.SessionStorage.set("Employee.department", department);
      }
      if (zone) {
        Digit.SessionStorage.set("Employee.zone", zone);
      }
      const zon = Digit.SessionStorage.get("Employee.zone");
      console.log("=> ", zone);
    } catch (err) {
      setShowToast(err?.response?.data?.error_description || "Invalid login credentials!");
      setTimeout(closeToast, 5000);
      refreshCaptcha();
    }
    setDisable(false);
  };

  const closeToast = () => {
    setShowToast(null);
  };

  const onForgotPassword = () => {
    sessionStorage.getItem("User") && sessionStorage.removeItem("User");
    history.push("/digit-ui/employee/user/forgot-password");
  };

  const handleCaptchaInputChange = (e) => {
    const value = e.target.value;
    setCaptchaInput(value);
    if (captchaError) setCaptchaError("");
  };

  const [userId, password, city] = propsConfig.inputs;

  const config = [
    {
      body: [
        {
          label: t(userId.label),
          type: userId.type,
          populators: {
            name: userId.name,
          },
          isMandatory: true,
        },
        {
          label: t(password.label),
          type: password.type,
          populators: {
            name: password.name,
          },
          isMandatory: true,
        },
        {
          // label: t(city.label),
          type: city.type,
          populators: {
            name: city.name,
            customProps: {},
            component: (props, customProps) => (
              <Dropdown
                disable
                option={cities}
                defaultProps={{ name: "i18nKey", value: "code" }}
                className="login-city-dd"
                optionKey="i18nKey"
              style={{ display:"none" }}
                selected={props.value || defaultCity} // ✅ ensures pre-selected
                select={(d) => props.onChange(d)}
                t={t}
                {...customProps}
              />
            ),
          },
          // isMandatory: true,
        },
        {
          label: t("Captcha Verification"),
          type: "custom",
          populators: {
            name: "captcha",
            customProps: {},
            component: () => (
              <div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ border: "1px solid #ccc", marginRight: "10px" }}>
                    <svg width="200" height="50" viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg" style={{ backgroundColor: '#f0f0f0' }}>
                      {noiseLines.map((line, index) => (
                        <line key={`line-${index}`} {...line} />
                      ))}
                      {noiseDots.map((dot, index) => (
                        <circle key={`dot-${index}`} {...dot} />
                      ))}
                      {captchaText.split('').map((char, index) => {
                        const charStyle = charStyles[index];
                        return (
                          <g key={index} transform={`translate(${charStyle.x}, ${charStyle.y}) rotate(${charStyle.rotation})`}>
                            <text
                              x="0"
                              y="0"
                              fill={`rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)})`}
                              style={{ fontSize: charStyle.fontSize, fontFamily: charStyle.fontFamily, fontWeight: charStyle.fontWeight }}
                            >
                              {char}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#882636",
                      fontSize: "20px",
                      outline: "none"
                    }}
                    title="Refresh Captcha"
                  >
                    ↻
                  </button>
                </div>
                <div>
                  <input
                    type="text"
                    value={captchaInput}
                    onChange={handleCaptchaInputChange}
                    placeholder={t("Enter captcha text")}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: captchaError ? "1px solid red" : "1px solid #ccc",
                      borderRadius: "4px",
                      marginBottom: "10px",
                      outline: "none",

                    }}
                  />
                  {captchaError && (
                    <div style={{ color: "red", fontSize: "14px", marginTop: "5px" }}>
                      {captchaError}
                    </div>
                  )}

                </div>
              </div>
            ),
          },
        },
      ],
    },
  ];

  return isLoading || isStoreLoading ? (
    <Loader />
  ) : (
    <Background>
      <div className="employeeBackbuttonAlign">
        <BackButton variant="white" style={{ borderBottom: "none" }} />
      </div>

      <FormComposer
        onSubmit={onLogin}
        isDisabled={isDisabled || disable}
        noBoxShadow
        inline
        submitInForm
        config={config}
        defaultValues={{ city: defaultCity }} // ✅ pre-fill city for form
        label={propsConfig.texts.submitButtonLabel}
        secondaryActionLabel={propsConfig.texts.secondaryButtonLabel}
        onSecondayActionClick={onForgotPassword}
        heading={propsConfig.texts.header}
        headingStyle={{ textAlign: "center" }}
        cardStyle={{ margin: "auto", minWidth: "408px" }}
        className="loginFormStyleEmployee"
        buttonStyle={{ maxWidth: "100%", width: "100%", backgroundColor: "#5a1166" }}
      >
        {/* <Header /> */}
      </FormComposer>
      {showToast && <Toast error={true} label={t(showToast)} onClose={closeToast} />}
      <div style={{ width: "100%", position: "fixed", bottom: 0, backgroundColor: "white", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", color: "black" }}>
          {/* <span style={{ cursor: "pointer", fontSize: window.Digit.Utils.browser.isMobile()?"12px":"12px", fontWeight: "400"}} onClick={() => { window.open('https://www.digit.org/', '_blank').focus();}} >Powered by DIGIT</span>
          <span style={{ margin: "0 10px" ,fontSize: window.Digit.Utils.browser.isMobile()?"12px":"12px"}}>|</span> */}
          <a
            style={{ cursor: "pointer", fontSize: window.Digit.Utils.browser.isMobile() ? "12px" : "12px", fontWeight: "400" }}
            href="#"
            target="_blank"
          >
            UPYOG License
          </a>

          <span className="upyog-copyright-footer" style={{ margin: "0 10px", fontSize: "12px" }}>
            |
          </span>
          <span
            className="upyog-copyright-footer"
            style={{ cursor: "pointer", fontSize: window.Digit.Utils.browser.isMobile() ? "12px" : "12px", fontWeight: "400" }}
            onClick={() => {
              window.open("https://mcdonline.nic.in/", "_blank").focus();
            }}
          >
            Copyright © 2025 Municipal Corporation of Delhi
          </span>
          <span className="upyog-copyright-footer" style={{ margin: "0 10px", fontSize: "12px" }}>
            |
          </span>
          <span
            className="upyog-copyright-footer"
            style={{ cursor: "pointer", fontSize: window.Digit.Utils.browser.isMobile() ? "12px" : "12px", fontWeight: "400" }}
            onClick={() => {
              window.open("https://nitcon.org/", "_blank").focus();
            }}
          >
            Designed & Developed By NITCON Ltd
          </span>

          {/* <a style={{ cursor: "pointer", fontSize: "16px", fontWeight: "400"}} href="#" target='_blank'>UPYOG License</a> */}
        </div>
        <div className="upyog-copyright-footer-web">
          <span
            className=""
            style={{ cursor: "pointer", fontSize: window.Digit.Utils.browser.isMobile() ? "14px" : "16px", fontWeight: "400" }}
            onClick={() => {
              window.open("https://mcdonline.nic.in/", "_blank").focus();
            }}
          >
            Copyright © 2025 Municipal Corporation of Delhi
          </span>
        </div>
      </div>
    </Background>
  );
};

Login.propTypes = {
  loginParams: PropTypes.any,
};

Login.defaultProps = {
  loginParams: null,
};

export default Login;
