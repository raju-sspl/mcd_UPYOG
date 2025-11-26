/**
 * Created By : Umesh Kumar 
 * Created On : 13-05-2025
 * Purpose : Finance Card for micro-ui
 * Code status : open
 */
import React from "react";
import { EmployeeModuleCard, FinanceChartIcon } from "@nudmcdgnpm/digit-ui-react-components";
import { useTranslation } from "react-i18next";

const FinanceCard = () => {
  const { t } = useTranslation();

  const userRoles = Digit.UserService.getUser()?.info?.roles?.map(role => role.code) || [];
  const isFinanceUser = userRoles.includes("EMPLOYEE") || userRoles.includes("FINANCE");

  if (!isFinanceUser) return null;

  const propsForModuleCard = {
    Icon: <FinanceChartIcon />,
    moduleName: t("ACTION_TEST_FINANCE").toUpperCase(),
    kpis: [
      // {
      //   count: "-",
      //   label: t("TENANT_FINANCE_MODULE"),
      //   link: "/digit-ui/employee/finance/home",
      // },
      {
        count: "-",
        label: t("ACTION_TEST_FINANCE_INBOX"),
        link: "/digit-ui/employee/finance/inbox",
      }
    ],
    links: [
      // {
      //   label: t("ACTION_TEST_FINANCE_INBOX"),
      //   link: `/digit-ui/employee/finance/inbox`,
      // }
    ],
  };

  return <EmployeeModuleCard {...propsForModuleCard} />;
};

export default FinanceCard;
