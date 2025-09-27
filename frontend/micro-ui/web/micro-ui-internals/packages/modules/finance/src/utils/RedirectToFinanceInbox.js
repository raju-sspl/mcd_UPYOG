import React from "react";
import { Loader } from "@nudmcdgnpm/digit-ui-react-components";

const RedirectToFinanceInbox = () => {

  const redirectPath = "/employee/services/EGF/inbox";

  if (typeof window !== "undefined" && window?.location) {
    window.location.href = `${redirectPath}`;
  }

  return (
    <div className="loader-container">
      <Loader />
    </div>
  );
};

export default RedirectToFinanceInbox;
