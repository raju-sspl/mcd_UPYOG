import React from "react";
import { Loader } from "@nudmcdgnpm/digit-ui-react-components";

const RedirectToFinanceHome = () => {

  const baseUrl = process.env.REACT_APP_PROXY_API || "https://mcdupyog.sparrowsoftech.in";
  const redirectPath = "/employee/services/EGF/voucher/journalVoucher-newForm.action";

  if (baseUrl && typeof window !== "undefined" && window?.location) {
    window.location.href = `${baseUrl}${redirectPath}`;
  }

  return (
    <div className="loader-container">
      <Loader />
    </div>
  );
};

export default RedirectToFinanceHome;
