/**
 * Created By : Umesh Kumar
 * Created On : 13-05-2025
 * Purpose : Finance Card for micro-ui
 * Code status : open
 */
import React from "react";
import { useRouteMatch } from "react-router-dom";
import FinanceCard from "./components/financecard";
import FinanceApp from "./pages";
import RedirectToFinanceInbox from "./utils/RedirectToFinanceInbox";
import RedirectToFinanceHome from "./utils/RedirectToFinanceHome";


export const FinanceModule = ({ stateCode, userType, tenants }) => {
  const moduleCode = "Finance";
  const language = Digit.StoreData.getCurrentLanguage();
  const { isLoading, data: store } = Digit.Services.useStore({ stateCode, moduleCode, language });

  Digit.SessionStorage.set("FINANCE_TENANTS", tenants);
  const { path, url } = useRouteMatch();

  const userRoles = Digit.UserService.getUser()?.info?.roles?.map(role => role.code) || [];
  const isFinanceEmployee = userRoles.includes("EMPLOYEE") || userRoles.includes("FINANCE_EMPLOYEE");

  if (!isFinanceEmployee) return null;

  if (userType === "employee") {
    return <FinanceApp path={path} url={url} />;
  } else return null;
};

const componentsToRegister = {
  FinanceCard,
  FinanceModule,
  RedirectToFinanceInbox,
  RedirectToFinanceHome
};

export const initFinanceComponents = () => {
  Object.entries(componentsToRegister).forEach(([key, value]) => {
    Digit.ComponentRegistryService.setComponent(key, value);
  });
};
