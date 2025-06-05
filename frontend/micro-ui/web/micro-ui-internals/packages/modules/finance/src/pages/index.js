/**
 * Created By : Umesh Kumar
 * Created On : 13-05-2025
 * Purpose : FinanceApp component for routing
 */
import { PrivateRoute } from "@nudmcdgnpm/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link, Switch, useLocation } from "react-router-dom";

const FinanceApp = ({ path, url, userType }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const mobileView = innerWidth <= 640;
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const inboxInitialState = {
    searchParams: {
      tenantId: tenantId,
    },
  };

  const FinanceInbox = Digit.ComponentRegistryService.getComponent("RedirectToFinanceInbox");
  const FinanceHome = Digit.ComponentRegistryService.getComponent("RedirectToFinanceHome");

  return (
    <Switch>
      <React.Fragment>
        <div className="ground-container">
          <p className="breadcrumb" style={{ marginLeft: mobileView ? "1vw" : "15px" }}>
            <Link to="/digit-ui/employee" style={{ cursor: "pointer", color: "#666" }}>
              {t("Home")}
            </Link>{" "}
            / <span>{location.pathname === "/digit-ui/employee/finance/inbox" ? t("inbox") : t("inbox")}</span>
          </p>
          <PrivateRoute exact path={`${path}/inbox`} component={() => <FinanceInbox />} />
          <PrivateRoute exact path={`${path}/home`} component={() => <FinanceHome />} />
        </div>
      </React.Fragment>
    </Switch>
  );
};

export default FinanceApp;
