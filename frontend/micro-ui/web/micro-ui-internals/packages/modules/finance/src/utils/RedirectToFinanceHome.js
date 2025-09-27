import React from "react";
import { Loader } from "@nudmcdgnpm/digit-ui-react-components";

const RedirectToFinanceHome = () => {

  const redirectPath = "/employee/services/EGF/voucher/journalVoucher-newForm.action";

  if (typeof window !== "undefined" && window?.location) {
    window.location.href = `${redirectPath}`;
  }

  return (
    <div className="loader-container">
      <Loader />
    </div>
  );
};

export default RedirectToFinanceHome;
