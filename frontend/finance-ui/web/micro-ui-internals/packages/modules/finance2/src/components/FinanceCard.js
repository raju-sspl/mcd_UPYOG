/**
 * Created By : Umesh Kumar 
 * Created On : 13-05-2025
 * Purpose : Finance Card for micro-ui
 * Code status : open
 */
import { EmployeeModuleCard, FinanceChartIcon } from "@egovernments/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";

const FinanceCard = () => {
  const { t } = useTranslation();

  const userRoles = Digit.UserService.getUser()?.info?.roles?.map(role => role.code) || [];
  const isFinanceUser = userRoles.includes("EMPLOYEE") || userRoles.includes("FINANCE");

  if (!isFinanceUser) return null;

  const propsForModuleCard = {
    Icon: <FinanceChartIcon />,
    moduleName: t("ACTION_TEST_FINANCE").toUpperCase(),
    links: [
      {
      label: t("ACTION_TEST_INBOX"),
      link: `/${window?.contextPath}/employee/finance/inbox`,
    //   roles: ROLES.MDMS,
    },
    {
      label: t("TENANT_FINANCE_MODULE"),
      link: `/${window?.contextPath}/employee/finance/journal-voucher`,
    //   roles: ROLES.LOCALISATION,
    },
    {
      label: t("ACTION_TEST_APPLY_TEST"),
      link: `/${window?.contextPath}/employee/finance/test`,
    //   roles: ROLES.WORKFLOW,
    }
    ],
  };

  return <EmployeeModuleCard {...propsForModuleCard} />;
};

export default FinanceCard;