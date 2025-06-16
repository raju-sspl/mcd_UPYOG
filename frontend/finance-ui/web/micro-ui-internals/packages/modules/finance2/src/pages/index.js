/**
 * Created By : Umesh Kumar
 * Created On : 13-05-2025
 * Purpose : FinanceApp component for routing
 */
import { PrivateRoute } from "@mcd89/finance-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link, Switch, useLocation } from "react-router-dom";
import Inbox from "../components/inbox";

const FinanceApp = ({ path, url, userType }) => {

  const { t } = useTranslation();
  const location = useLocation();
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const inboxInitialState = {
    searchParams: {
      tenantId: tenantId,
    },
  };

  const FinanceInbox = Digit.ComponentRegistryService.getComponent("Inbox");
  const JournalVoucher = Digit.ComponentRegistryService.getComponent("JournalVoucher");


  return (
    <Switch>
      <React.Fragment>
        <div className="ground-container">
          <PrivateRoute exact path={`${path}/voucher/journalVoucher`} component={() => <FinanceInbox />} />
          <PrivateRoute exact path={`${path}/journal-voucher`} component={() => <JournalVoucher />} />
          {/* <PrivateRoute exact path={`${path}/journal-voucher`} component={() => <JournalVoucher />} /> */}

        </div>
      </React.Fragment>
    </Switch>
  );
};

export default FinanceApp;
