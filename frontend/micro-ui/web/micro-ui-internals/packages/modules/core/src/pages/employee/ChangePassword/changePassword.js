import {
  BackButton, CardSubHeader, CardText, FormComposer, Toast
} from "@nudmcdgnpm/digit-ui-react-components";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import Background from "../../../components/Background";
import Header from "../../../components/Header";
import SelectOtp from "../../citizen/Login/SelectOtp";

const ChangePasswordComponent = ({ config: propsConfig, t }) => {
  const [user, setUser] = useState(null);
  const { mobile_number: mobileNumber, tenantId } = Digit.Hooks.useQueryParams();
  const history = useHistory();
  const [otp, setOtp] = useState("");
  const [isOtpValid, setIsOtpValid] = useState(true);
  const [showToast, setShowToast] = useState(null);
  const [formData, setFormData] = useState({});

  const getUserType = () => Digit.UserService.getType();
  let sourceUrl = "https://s3.ap-south-1.amazonaws.com/egov-qa-assets";
  const pdfUrl = "https://pg-egov-assets.s3.ap-south-1.amazonaws.com/Upyog+Code+and+Copyright+License_v1.pdf";

  useEffect(() => {
    if (!user) {
      Digit.UserService.setType("employee");
      return;
    }
    Digit.UserService.setUser(user);
    const redirectPath = location.state?.from || "/digit-ui/employee";
    history.replace(redirectPath);
  }, [user]);

  const closeToast = () => {
    setShowToast(null);
  };

  const onResendOTP = async () => {
    const requestData = {
      otp: {
        mobileNumber,
        userType: getUserType().toUpperCase(),
        type: "passwordreset",
        tenantId,
      },
    };

    try {
      await Digit.UserService.sendOtp(requestData, tenantId);
      setShowToast(t("ES_OTP_RESEND"));
    } catch (err) {
      setShowToast(err?.response?.data?.error_description || t("ES_INVALID_LOGIN_CREDENTIALS"));
    }
    setTimeout(closeToast, 5000);
  };

  const onChangePassword = async (data) => {
    try {
      if (data.newPassword !== data.confirmPassword) {
        return setShowToast(t("ERR_PASSWORD_DO_NOT_MATCH"));
      }
      const requestData = {
        ...data,
        otpReference: otp,
        tenantId,
        type: getUserType().toUpperCase(),
      };

      await Digit.UserService.changePassword(requestData, tenantId);

      // ✅ Show success toast and navigate to login after 3 sec
      setShowToast(t("Password Updated Successfully"));
      setTimeout(() => {
        closeToast();
        navigateToLogin();
      }, 2000);
    } catch (err) {
      setShowToast(err?.response?.data?.error?.fields?.[0]?.message || t("ES_SOMETHING_WRONG"));
      setTimeout(closeToast, 5000);
    }
  };

  const navigateToLogin = () => history.replace("/digit-ui/employee/user/login");

  const [username, password, confirmPassword] = propsConfig.inputs;

  // ✅ Password validation rules
  const passwordRules = [
    "At least 8 characters long",
    "Contains one uppercase letter",
    "Contains one lowercase letter",
    "Contains one number",
    "Contains one special character (!@#$%^&*)"
  ];

  // ✅ Password rule conditions
  const passwordConditions = (pwd) => [
    /.{8,}/.test(pwd),
    /[A-Z]/.test(pwd),
    /[a-z]/.test(pwd),
    /[0-9]/.test(pwd),
    /[!@#$%^&*]/.test(pwd),
  ];

  const isPasswordValid = (pwd) => passwordConditions(pwd).every(Boolean);

  // ✅ Determine if submit button should be disabled
  const isButtonDisabled =
    !formData.newPassword ||
    !formData.confirmPassword ||
    formData.newPassword !== formData.confirmPassword ||
    !isPasswordValid(formData.newPassword);

  const config = [
    {
      body: [
        {
          label: t(username.label),
          type: username.type,
          populators: {
            name: username.name,
            onChange: (e) => setFormData({ ...formData, userName: e.target.value }),
          },
          isMandatory: true,
        },
        {
          label: t(password.label),
          type: password.type,
          populators: {
            name: password.name,
            onChange: (e) => setFormData({ ...formData, newPassword: e.target.value }),
          },
          isMandatory: true,
        },
        {
          label: t(confirmPassword.label),
          type: confirmPassword.type,
          populators: {
            name: confirmPassword.name,
            onChange: (e) => setFormData({ ...formData, confirmPassword: e.target.value }),
          },
          isMandatory: true,
        },
      ],
    },
  ];

  return (
    <Background>
      <div className="employeeBackbuttonAlign">
        <BackButton variant="white" style={{ borderBottom: "none" }} />
      </div>

      <FormComposer
        onSubmit={onChangePassword}
        noBoxShadow
        inline
        submitInForm
        config={config}
        label={propsConfig.texts.submitButtonLabel}
        cardStyle={{ maxWidth: "408px", margin: "auto", marginBottom: "0" }}
        className="employeeChangePassword"
        isDisabled={isButtonDisabled}
      >
        <Header />
        <CardSubHeader style={{ textAlign: "center" }}>
          {propsConfig.texts.header}
        </CardSubHeader>

        <CardText>
          {`${t(`CS_LOGIN_OTP_TEXT`)} `}
          <b>{`${t(`+ 91 - `)} ${mobileNumber}`}</b>
        </CardText>

        <SelectOtp
          t={t}
          userType="employee"
          otp={otp}
          onOtpChange={setOtp}
          error={isOtpValid}
          onResend={onResendOTP}
        />

        {/* ✅ Show Password Rules */}
        {formData.newPassword && (
          <div style={{ fontSize: "12px", color: "#555", marginBottom: "10px" }}>
            <strong>{t("Password must include:")}</strong>
            <ul style={{ listStyleType: "none", padding: 0 }}>
              {passwordRules.map((rule, idx) => {
                const isValid = passwordConditions(formData.newPassword)[idx];
                return (
                  <li
                    key={idx}
                    title={isValid ? "✓ Requirement met" : "✗ Requirement not met"}
                    style={{
                      color: isValid ? "green" : "red",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>{isValid ? "✅" : "❌"}</span> {rule}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </FormComposer>

      {/* ✅ Smart toast coloring */}
      {showToast && (
        <Toast
          error={!showToast.includes("Successfully")}
          label={t(showToast)}
          onClose={closeToast}
        />
      )}

      <div
        style={{
          width: "100%",
          position: "fixed",
          bottom: 0,
          backgroundColor: "white",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            color: "black",
          }}
        >
          <a
            style={{ cursor: "pointer", fontSize: "12px", fontWeight: "400" }}
            href="#"
            target="_blank"
          >
            UPYOG License
          </a>
          <span
            className="upyog-footer-separator"
            style={{ margin: "0 10px", fontSize: "12px" }}
          >
            |
          </span>
          <span
            className="upyog-footer-copy"
            style={{ cursor: "pointer", fontSize: "12px", fontWeight: "400" }}
            onClick={() => window.open("https://mcdonline.nic.in/", "_blank").focus()}
          >
            Copyright © 2025 Municipal Corporation of Delhi
          </span>
          <span
            className="upyog-footer-separator"
            style={{ margin: "0 10px", fontSize: "12px" }}
          >
            |
          </span>
          <span
            className="upyog-footer-credit"
            style={{ cursor: "pointer", fontSize: "12px", fontWeight: "400" }}
            onClick={() => window.open("https://nitcon.org/", "_blank").focus()}
          >
            Designed & Developed By NITCON Ltd
          </span>
        </div>
      </div>
    </Background>
  );
};

ChangePasswordComponent.propTypes = {
  loginParams: PropTypes.any,
};

ChangePasswordComponent.defaultProps = {
  loginParams: null,
};

export default ChangePasswordComponent;
