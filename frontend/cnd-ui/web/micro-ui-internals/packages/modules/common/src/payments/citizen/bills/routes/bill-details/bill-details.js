import { Card, CardSubHeader, Header, KeyNote, Loader, RadioButtons, SubmitBar, TextInput } from "@nudmcdgnpm/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation, useParams, Redirect } from "react-router-dom";
import ArrearSummary from "./arrear-summary";
import BillSumary from "./bill-summary";
import { stringReplaceAll } from "./utils";
// import TimerServices from "../../../timer-Services/timerServices";
// import { timerEnabledForBusinessService } from "./utils";

const BillDetails = ({ paymentRules, businessService }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { state, pathname, search } = useLocation();
  const userInfo = Digit.UserService.getUser();
  let { consumerCode } = useParams();
  const { workflow: wrkflow, tenantId: _tenantId, authorization, ConsumerName } = Digit.Hooks.useQueryParams();
  const [bill, setBill] = useState(state?.bill);
  const tenantId = state?.tenantId || _tenantId || Digit.UserService.getUser().info?.tenantId;
  const propertyId = state?.propertyId;


  const { data, isLoading } = state?.bill
    ? { isLoading: false }
    : Digit.Hooks.useFetchPayment({
        tenantId,
        businessService,
        consumerCode: consumerCode,
      });
     
  let Useruuid = data?.Bill?.[0]?.userId || "";
  let requestCriteria = [
    "/user/_search",
    {},
    { data: { uuid: [Useruuid] } },
    { recordId: Useruuid, plainRequestFields: ["mobileNumber"] },
    {
      enabled: Useruuid ? true : false,
      cacheTime: 100,
    },
  ];

  let { minAmountPayable, isAdvanceAllowed } = paymentRules; 
  minAmountPayable = wrkflow === "WNS" ? 100 : minAmountPayable;
  const billDetails = bill?.billDetails?.sort((a, b) => b.fromPeriod - a.fromPeriod)?.[0] || [];
  const Arrears =
    bill?.billDetails
      ?.sort((a, b) => b.fromPeriod - a.fromPeriod)
      ?.reduce((total, current, index) => (index === 0 ? total : total + current.amount), 0) || 0;

  const { key, label } = Digit.Hooks.useApplicationsForBusinessServiceSearch({ businessService }, { enabled: false });
  const getBillingPeriod = () => {
    const { fromPeriod, toPeriod } = billDetails;
    if (fromPeriod && toPeriod) {
      let from, to;
      from = new Date(billDetails.fromPeriod).getFullYear().toString();
      to = new Date(billDetails.toPeriod).getFullYear().toString();
      if (from === to) {
        return "FY " + from;
      }
      return "FY " + from + "-" + to;
    } else return "N/A";
  };

  const getBillBreakDown = () => billDetails?.billAccountDetails || [];
  const getTotal = () => bill?.totalAmount || 0;

  const [paymentType, setPaymentType] = useState(t("CS_PAYMENT_FULL_AMOUNT"));
  const [amount, setAmount] = useState(getTotal());
  const [paymentAllowed, setPaymentAllowed] = useState(true);
  const [formError, setError] = useState("");

  if (authorization === "true" && !userInfo?.access_token) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = `/cnd-ui/citizen/login?from=${encodeURIComponent(pathname + search)}`;
  }
  useEffect(() => {
    window.scroll({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (paymentType == t("CS_PAYMENT_FULL_AMOUNT")) setAmount(getTotal());
  }, [paymentType, bill]);

  useEffect(() => {
    let changeAdvanceAllowed = isAdvanceAllowed;
    if (isAdvanceAllowed && wrkflow === "WNS") changeAdvanceAllowed = false;
    const allowPayment = minAmountPayable && amount >= minAmountPayable && !changeAdvanceAllowed && amount <= getTotal() && !formError;
    if (paymentType != t("CS_PAYMENT_FULL_AMOUNT")) setPaymentAllowed(allowPayment);
    else setPaymentAllowed(true);
  }, [paymentType, amount]);

  useEffect(() => {
    if (!bill && data) {
      let requiredBill = data.Bill.filter((e) => e.consumerCode == (wrkflow === "WNS" ? stringReplaceAll(consumerCode, "+", "/") : consumerCode))[0];
      setBill(requiredBill);
    }
  }, [isLoading]); 

  const onSubmit = () => {
    let paymentAmount = paymentType === t("CS_PAYMENT_FULL_AMOUNT") ? getTotal() : amount;
      history.push(`/cnd-ui/citizen/payment/collect/${businessService}/${consumerCode}`, { paymentAmount, tenantId: billDetails.tenantId, propertyId: propertyId });
    
  };
  
  const onChangeAmount = (value) => {
    setError("");
    if (isNaN(value) || value.includes(".")) {
      setError("AMOUNT_INVALID");
    } else if (!isAdvanceAllowed && value > getTotal()) {
      setError("CS_ADVANCED_PAYMENT_NOT_ALLOWED");
    } else if (value < minAmountPayable) {
      setError("CS_CANT_PAY_BELOW_MIN_AMOUNT");
    }
    setAmount(value);
  };

  if (isLoading) return <Loader />;

  return (
    <React.Fragment>
      <Header>{t("CS_PAYMENT_BILL_DETAILS")}</Header>
      <Card>
        <div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <KeyNote
            keyValue={t(label)}
            note={consumerCode}
          />
          </div>
            <KeyNote keyValue={t("CS_PAYMENT_BILLING_PERIOD")} note={getBillingPeriod()} />
          
            <BillSumary billAccountDetails={getBillBreakDown()} total={getTotal()} businessService={businessService} arrears={Arrears} />
        </div>

        <div className="bill-payment-amount">
          <hr className="underline" />
          <CardSubHeader>{t("CS_COMMON_PAYMENT_AMOUNT")}</CardSubHeader>
            <RadioButtons
              selectedOption={paymentType}
              onSelect={setPaymentType}
              options={ paymentRules.partPaymentAllowed && [t("CS_PAYMENT_FULL_AMOUNT")]}
            />

          <div style={{ position: "relative" }}>
            <span
              className="payment-amount-front"
              style={{ border: `1px solid ${paymentType === t("CS_PAYMENT_FULL_AMOUNT") ? "#9a9a9a" : "#9a9a9a"}` }}
            >
              ₹
            </span>
            {console.log(bill,"bill")}
            {paymentType !== t("CS_PAYMENT_FULL_AMOUNT") ? (
                <TextInput className="text-indent-xl" onChange={(e) => onChangeAmount(e.target.value)} value={amount} disable={getTotal() === 0} />
            ) :
              <TextInput className="text-indent-xl" value={getTotal()} onChange={() => {}} disable={true} />
            }
            {formError === "CS_CANT_PAY_BELOW_MIN_AMOUNT" ? (
              <span className="card-label-error">
                {t(formError)}: {"₹" + minAmountPayable}
              </span>
            ) : (
              <span className="card-label-error">{t(formError)}</span>
            )}
          </div>
          <SubmitBar disabled={!paymentAllowed || getTotal() === 0} onSubmit={onSubmit} label={t("CS_COMMON_PROCEED_TO_PAY")} />
        </div>
      </Card>
    </React.Fragment>
  );
};

export default BillDetails;
