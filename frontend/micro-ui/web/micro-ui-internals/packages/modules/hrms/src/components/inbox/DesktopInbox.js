import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import ApplicationTable from "../inbox/ApplicationTable";
import { Card, Loader } from "@nudmcdgnpm/digit-ui-react-components";
import InboxLinks from "../inbox/ApplicationLinks";
import SearchApplication from "./search";
import { Link } from "react-router-dom";

const DesktopInbox = ({ tableConfig, filterComponent, ...props }) => {
  const { t } = useTranslation();
  const tenantIds = Digit.SessionStorage.get("HRMS_TENANTS");
  const GetCell = (value) => <span className="cell-text">{t(value)}</span>;
  const GetSlaCell = (value) => {
    return value == "INACTIVE" ? (
      <span className="sla-cell-error">{t(value) || ""}</span>
    ) : (
      <span className="sla-cell-success">{t(value) || ""}</span>
    );
  };

  const [FilterComponent, setComp] = useState(() => Digit.ComponentRegistryService?.getComponent(filterComponent));

  // Apply client-side zone filtering
  const filteredData = useMemo(() => {
    const rawData = props?.data?.Employees;

    // If no data, return empty array
    if (!rawData || rawData.length === 0) return [];

    // Check if zone filter is active
    const zoneFilter = props.searchParams?.zone || props.searchParams?._clientZone;

    // If no zone filter, return all data
    if (!zoneFilter) {
      return rawData;
    }

    // Filter by zone
    const filtered = rawData.filter((employee) => {
      const employeeZone = employee?.jurisdictions?.[0]?.zone;
      return employeeZone === zoneFilter;
    });

    return filtered;
  }, [props?.data?.Employees, props.searchParams?.zone, props.searchParams?._clientZone]);

  const columns = React.useMemo(() => {
    return [
      {
        Header: t("HR_EMP_ID_LABEL"),
        disableSortBy: true,
        Cell: ({ row }) => {
          return (
            <span className="link">
              <Link to={`/digit-ui/employee/hrms/details/${row.original.tenantId}/${row.original.code}`}>{row.original.code}</Link>
            </span>
          );
        },
      },
      {
        Header: t("HR_EMP_NAME_LABEL"),
        disableSortBy: true,
        Cell: ({ row }) => {
          return GetCell(`${row.original?.user?.name}`);
        },
      },
      {
        Header: t("HR_ROLE_NO_LABEL"),
        Cell: ({ row }) => {
          return (
            <div className="tooltip">
              {" "}
              {GetCell(`${row.original?.user?.roles.length}`)}
              <span className="tooltiptext" style={{whiteSpace: "nowrap"}}>
                {row.original?.user?.roles.map((ele, index) => (
                  <span>
                    {`${index + 1}. ` + t(`ACCESSCONTROL_ROLES_ROLES_${ele.code}`)} <br />{" "}
                  </span>
                ))}
              </span>
            </div>
          );
        },
        disableSortBy: true,
      },
      {
        Header: t("HR_DESG_LABEL"),
        disableSortBy: true,
        Cell: ({ row }) => {
          return GetCell(
            `${
              t(
                "COMMON_MASTERS_DESIGNATION_" + row.original?.assignments?.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate))[0]?.designation
              ) || ""
            }`
          );
        },
      },
      {
        Header: t("HR_DEPT_LABEL"),
        disableSortBy: true,
        Cell: ({ row }) => {
          return GetCell(
            `${
              t(
                "COMMON_MASTERS_DEPARTMENT_" + row.original?.assignments?.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate))[0]?.department
              ) || ""
            }`
          );
        },
      },
      {
        Header: t("HR_ZONE_LABEL"),
        disableSortBy: true,
        Cell: ({ row }) => {
          const zone = row.original?.jurisdictions?.[0]?.zone;
          return GetCell(zone ? t(`TENANT_${zone}`) : "");
        },
      },

      {
        Header: t("HR_STATUS_LABEL"),
        disableSortBy: true,
        Cell: ({ row }) => {
          return GetSlaCell(`${row.original?.isActive ? "ACTIVE" : "INACTIVE"}`);
        },
      },
    ];
  }, []);

  let result;
  if (props.isLoading) {
    result = <Loader />;
  } else if (filteredData?.length === 0) {
    result = (
      <Card style={{ marginTop: 20 }}>
        {t("COMMON_TABLE_NO_RECORD_FOUND")
          .split("\\n")
          .map((text, index) => (
            <p key={index} style={{ textAlign: "center" }}>
              {text}
            </p>
          ))}
      </Card>
    );
  } else if (filteredData?.length > 0) {
    result = (
      <ApplicationTable
        t={t}
        data={filteredData}
        columns={columns}
        getCellProps={(cellInfo) => {
          return {
            style: {
              maxWidth: cellInfo.column.Header == t("HR_EMP_ID_LABEL") ? "150px" : "",
              padding: "20px 18px",
              fontSize: "16px",
              minWidth: "150px",
            },
          };
        }}
        onPageSizeChange={props.onPageSizeChange}
        currentPage={props.currentPage}
        onNextPage={props.onNextPage}
        onPrevPage={props.onPrevPage}
        pageSizeLimit={props.pageSizeLimit}
        onSort={props.onSort}
        disableSort={props.disableSort}
        onPageSizeChange={props.onPageSizeChange}
        sortParams={props.sortParams}
        totalRecords={filteredData.length}
      />
    );
  }

  return (
    <div className="inbox-container">
      {!props.isSearch && (
        <div className="filters-container">
          <InboxLinks
            parentRoute={props.parentRoute}
            allLinks={[
              {
                text: "HR_COMMON_CREATE_EMPLOYEE_HEADER",
                link: "/digit-ui/employee/hrms/create",
                businessService: "hrms",
                roles: ["HRMS_ADMIN"],
              },
            ]}
            headerText={"HRMS"}
            businessService={props.businessService}
          />
          <div>
            {
              <FilterComponent
                defaultSearchParams={props.defaultSearchParams}
                onFilterChange={props.onFilterChange}
                searchParams={props.searchParams}
                type="desktop"
                tenantIds={tenantIds}
              />
            }
          </div>
        </div>
      )}
      <div style={{ flex: 1 }}>
        <SearchApplication
          defaultSearchParams={props.defaultSearchParams}
          onSearch={props.onSearch}
          type="desktop"
          tenantIds={tenantIds}
          searchFields={props.searchFields}
          isInboxPage={!props?.isSearch}
          searchParams={props.searchParams}
        />
        <div className="result" style={{ marginLeft: !props?.isSearch ? "24px" : "", flex: 1 }}>
          {result}
        </div>
      </div>
    </div>
  );
};

export default DesktopInbox;
