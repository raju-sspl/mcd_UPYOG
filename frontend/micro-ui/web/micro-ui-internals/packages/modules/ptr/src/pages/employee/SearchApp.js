/**
 * @file SearchApp.js
 * @description This component handles the search functionality for the employee application.
 * It allows users to search by application number, date range, creation reason, status, and mobile number.
 * 
 * @component
 * - Uses `useState` to manage form data and payload.
 * - Uses `react-hook-form` for form handling.
 * - Displays a toast notification for validation errors.
 * - Fetches search results using the `Digit.Hooks.ptr.usePTRSearch` hook.
 * 
 * @props
 * @param {string} path - The base route path for the search module.
 * 
 * @usage
 * <SearchApp path="/digit-ui/employee/ptr/petservice/search" />
 */

import React, { useState } from "react"
import { TextInput, Label, SubmitBar, LinkLabel, ActionBar, CloseSvg, DatePicker, CardLabelError, SearchForm, SearchField, Dropdown, Toast } from "@nudmcdgnpm/digit-ui-react-components";
import { useForm, Controller } from "react-hook-form";
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next";
import PTRSearchApplication from "../../components/SearchApplication";

const SearchApp = ({path}) => {
    const { variant } = useParams();
    const { t } = useTranslation();
    const tenantId = Digit.ULBService.getCurrentTenantId();
    const [payload, setPayload] = useState({})
    const [showToast, setShowToast] = useState(null);

    function onSubmit (_data) {
        var fromDate = new Date(_data?.fromDate)
        fromDate?.setSeconds(fromDate?.getSeconds() - 19800 )
        var toDate = new Date(_data?.toDate)
        toDate?.setSeconds(toDate?.getSeconds() + 86399 - 19800)
        const data = {
            ..._data,
            ...(_data.toDate ? {toDate: toDate?.getTime()} : {}),
            ...(_data.fromDate ? {fromDate: fromDate?.getTime()} : {})
        }

        let payload = Object.keys(data).filter( k => data[k] ).reduce( (acc, key) => ({...acc,  [key]: typeof data[key] === "object" ? data[key].code : data[key] }), {} );
        if(Object.entries(payload).length>0 && !payload.applicationNumber && !payload.creationReason && !payload.fromDate && !payload.mobileNumber && !payload.applicationNumber && !payload.status && !payload.toDate)
        setShowToast({ warning: true, label: "ERR_PTR_FILL_VALID_FIELDS" });
        else if(Object.entries(payload).length>0 && (payload.creationReason || payload.status ) && (!payload.applicationNumber && !payload.fromDate && !payload.mobileNumber && !payload.applicationNumber && !payload.toDate))
        setShowToast({ warning: true, label: "ERR_PROVIDE_MORE_PARAM_WITH_TYPE_STATUS" });
        else if(Object.entries(payload).length>0 && (payload.fromDate && !payload.toDate) || (!payload.fromDate && payload.toDate))
        setShowToast({ warning: true, label: "ERR_PROVIDE_BOTH_FORM_TO_DATE" });
        else
        setPayload(payload)
    }

    const config = {
        enabled: !!( payload && Object.keys(payload).length > 0 )
    }

    const { isLoading, isSuccess, isError, error, data: {PetRegistrationApplications: searchReult, Count: count} = {} } = Digit.Hooks.ptr.usePTRSearch(
        { tenantId,
          filters: payload
        },
       config,
      );
    return <React.Fragment>
        <PTRSearchApplication t={t} isLoading={isLoading} tenantId={tenantId} setShowToast={setShowToast} onSubmit={onSubmit} data={  isSuccess && !isLoading ? (searchReult.length>0? searchReult : { display: "ES_COMMON_NO_DATA" } ):""} count={count} /> 
        {showToast && (
        <Toast
          error={showToast.error}
          warning={showToast.warning}
          label={t(showToast.label)}
          isDleteBtn={true}
          onClose={() => {
            setShowToast(null);
          }}
        />
      )}
    </React.Fragment>

}

export default SearchApp