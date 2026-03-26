import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, TextField, Image } from "components";
import { Button } from "egov-ui-framework/ui-atoms";
import { CityPicker } from "modules/common";
import Label from "egov-ui-kit/utils/translationNode";
import logo from "egov-ui-kit/assets/images/logo_black.png";
import "./index.css";

import RefreshIcon from "material-ui/svg-icons/navigation/refresh";
import { fetchCaptcha } from "ui-utils/api";

const LoginForm = ({ handleFieldChange, form, onForgotPasswdCLick, logoUrl, submitForm }) => {
  const fields = form.fields || {};
  const submit = form.submit;
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadCaptcha();
  }, []);

  const loadCaptcha = async () => {
    setIsRefreshing(true);
    try {
      // Cleanup previous object URL to prevent memory leaks
      if (captchaImage && captchaImage.startsWith('blob:')) {
        URL.revokeObjectURL(captchaImage);
      }

      const data = await fetchCaptcha();

      setCaptchaImage(data.captcha);  // This is now an object URL for the image
      setCaptchaId(data.captchaId);

      handleFieldChange("captchaId", data.captchaId);

      // Keep spinning for a bit for visual feedback if it was too fast
      setTimeout(() => setIsRefreshing(false), 500);

    } catch (err) {
      console.error("Error fetching captcha:", err);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (form.error && !form.loading) {
      loadCaptcha();
      handleFieldChange("captcha", "");
    }
  }, [form.error, form.loading]);

  // Cleanup object URL when component unmounts
  useEffect(() => {
    return () => {
      if (captchaImage && captchaImage.startsWith('blob:')) {
        URL.revokeObjectURL(captchaImage);
      }
    };
  }, [captchaImage]);

  return (
    <Card
      className="user-screens-card col-lg-offset-4 col-lg-4 col-md-offset-4 col-md-4 col-sm-offset-4 col-sm-4"
      textChildren={
        <div>
          <div
            className="rainmaker-displayInline"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <div>
              <Image
                className="mseva-logo"
                source={logoUrl ? logoUrl : `${logo}`}
                style={{ height: "60px", width: "auto" }}
              />
            </div>
            <div style={{ margin: "0 10px" }}>
              <Label bold={true} fontSize="24px" label="|" />
            </div>
            <div>
              <Label bold={true} color="black" fontSize="24px" label="STATE_LABEL" />
            </div>
          </div>
          <Label style={{ marginBottom: "12px" }} className="text-center" bold={true} dark={true} fontSize={16} label="CORE_COMMON_LOGIN" />
          <TextField
            onChange={(e, value) => handleFieldChange("username", value)}
            {...fields.username}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                submitForm();
              }
            }}
          />
          <TextField
            onChange={(e, value) => handleFieldChange("password", value)}
            {...fields.password}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                submitForm();
              }
            }}
          />
          <CityPicker onChange={handleFieldChange} fieldKey="city" field={fields.city} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
            <div style={{ flex: 1 }}>
              <TextField
                {...fields.captcha}
                onChange={(e, v) => handleFieldChange("captcha", v)}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitForm();
                  }
                }}
              />
            </div>
            <div style={{
              padding: "4px",
              background: "#f5f5f5",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "50px"
            }}>
              {captchaImage ? (
                <img
                  src={captchaImage}
                  alt="Captcha verification"
                  style={{
                    maxHeight: "50px",
                    maxWidth: "100%",
                    display: "block"
                  }}
                />
              ) : (
                <span style={{ color: "#999" }}>Loading...</span>
              )}
            </div>

            <Button variant="outlined" style={{ minWidth: "50px" }} onClick={loadCaptcha}>
              <RefreshIcon className={isRefreshing ? "captcha-refresh-spin" : ""} color="#fe7a51" />
            </Button>
          </div>

          <Link to="/forgot-password">
            <div style={{ float: "right" }}>
              <Label
                containerStyle={{ cursor: "pointer", position: "relative", zIndex: 10 }}
                labelStyle={{ marginBottom: "12px" }}
                className="forgot-passwd"
                fontSize={14}
                label="CORE_COMMON_FORGOT_PASSWORD"
              />
            </div>
          </Link>
          <Button
            {...submit}
            style={{
              height: "48px",
              width: "100%"
            }}
            variant={"contained"}
            color={"primary"}
            type="submit"
          >
            <Label buttonLabel={true} labelStyle={{ fontWeight: 500 }} label="CORE_COMMON_CONTINUE" />
          </Button>
          {/* <Button {...submit} fullWidth={true} primary={true} /> */}
        </div>
      }
    />
  );
};

export default LoginForm;

