import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import ApplicationTable from "../inbox/ApplicationTable";
import { Card, Loader } from "@nudmcdgnpm/digit-ui-react-components";
import InboxLinks from "../inbox/ApplicationLinks";
import SearchApplication from "./search";
import { Link } from "react-router-dom";
import XLSX from "xlsx";

const DesktopInbox = ({ tableConfig, filterComponent, ...props }) => {
  const { t } = useTranslation();
  const tenantIds = Digit.SessionStorage.get("HRMS_TENANTS");

  // ✅ Get logged-in user's zone from multiple sources
  const getUserZone = () => {
    let zoneName = Digit.SessionStorage.get("Employee.zone");

    if (!zoneName || zoneName === "HQ") {
      const userInfo = Digit.UserService.getUser();
      zoneName = userInfo?.info?.tenantId ||
        userInfo?.info?.zone?.code ||
        userInfo?.tenantId ||
        props?.defaultSearchParams?.zone ||
        "HQ";

      zoneName = userInfo?.info?.zone?.name ||
        userInfo?.zoneName ||
        "";

      if (zoneName && zoneName.includes('.')) {
        const parts = zoneName.split('.');
        if (parts.length > 1) {
          const possibleZone = parts[parts.length - 1].toUpperCase();
          if (possibleZone !== "HQ") {
            zoneName = possibleZone;
          }
        }
      }
    }

    return { code: zoneName, name: zoneName };
  };

  const userZone = getUserZone();
  const loggedInZoneCode = userZone.code || "HQ";
  const loggedInZoneName = userZone.name || "";

  const GetCell = (value) => <span className="cell-text">{t(value)}</span>;
  const GetSlaCell = (value) => {
    return value == "INACTIVE" ? (
      <span className="sla-cell-error">{t(value) || ""}</span>
    ) : (
      <span className="sla-cell-success">{t(value) || ""}</span>
    );
  };

  const [FilterComponent, setComp] = useState(() => Digit.ComponentRegistryService?.getComponent(filterComponent));

  // ✅ FIXED: Apply strict zone filtering
  const data = useMemo(() => {
    const rawData = props?.data?.Employees;

    if (!rawData || rawData.length === 0) return [];

    // ✅ Get the active zone filter
    const searchedZone = props.searchParams?.zone;

    // ✅ If zone is selected, filter strictly by that zone only
    if (searchedZone) {
      console.log("🔍 Filtering for zone:", searchedZone);
      const filtered = rawData.filter((employee) => {
        const employeeZone = employee?.jurisdictions?.[0]?.zone;
        const matches = employeeZone === searchedZone;
        if (!matches) {
          console.log("❌ Excluding:", employee.code, "Zone:", employeeZone);
        }
        return matches;
      });
      return filtered;
    }

    // ✅ No zone filter - return all data
    return rawData;

  }, [props?.data?.Employees, props.searchParams]);

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
              <span className="tooltiptext" style={{ whiteSpace: "nowrap" }}>
                {row.original?.user?.roles.map((ele, index) => (
                  <span key={index}>
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
          const firstAssignment = row.original?.assignments?.sort(
            (a, b) => new Date(a.fromDate) - new Date(b.fromDate)
          )[0];
          return GetCell(
            t(`COMMON_MASTERS_DESIGNATION_${firstAssignment?.designation}`) || ""
          );
        },
      },
      {
        Header: t("HR_DEPT_LABEL"),
        disableSortBy: true,
        Cell: ({ row }) => {
          const firstAssignment = row.original?.assignments?.sort(
            (a, b) => new Date(a.fromDate) - new Date(b.fromDate)
          )[0];
          return GetCell(
            t(`COMMON_MASTERS_DEPARTMENT_${firstAssignment?.department}`) || ""
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
        Cell: ({ row }) =>
          GetSlaCell(`${row.original?.isActive ? "ACTIVE" : "INACTIVE"}`),
      },
    ];
  }, [t]);

  const downloadXLS = () => {
    if (!data || data.length === 0) {
      alert("No data available to download.");
      return;
    }

    try {
      const tableColumn = [
        "Employee ID",
        "Employee Name",
        "Designation",
        "Department",
        "Zone",
        "Status",
      ];

      const tableRows = data.map((emp) => {
        const firstAssignment = emp?.assignments?.sort(
          (a, b) => new Date(a.fromDate) - new Date(b.fromDate)
        )[0];
        const zone = emp?.jurisdictions?.[0]?.zone;

        const designationTranslated = firstAssignment?.designation
          ? t(`COMMON_MASTERS_DESIGNATION_${firstAssignment.designation}`)
          : "";
        const departmentTranslated = firstAssignment?.department
          ? t(`COMMON_MASTERS_DEPARTMENT_${firstAssignment.department}`)
          : "";
        const zoneTranslated = zone ? t(`TENANT_${zone}`) : "";

        return [
          emp.code || "",
          emp?.user?.name || "",
          designationTranslated,
          departmentTranslated,
          zoneTranslated,
          emp?.isActive ? "ACTIVE" : "INACTIVE",
        ];
      });

      const worksheet = XLSX.utils.aoa_to_sheet([tableColumn, ...tableRows]);
      const workbook = XLSX.utils.book_new();

      worksheet["!cols"] = [
        { wch: 18 },
        { wch: 28 },
        { wch: 26 },
        { wch: 26 },
        { wch: 20 },
        { wch: 15 },
      ];

      worksheet["!rows"] = new Array(tableRows.length + 1).fill({ hpt: 22 });

      tableColumn.forEach((col, idx) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx });
        if (!worksheet[cellAddress]) return;
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "0078D7" } },
          alignment: { horizontal: "center", vertical: "center" },
        };
      });

      for (let R = 1; R <= tableRows.length; ++R) {
        for (let C = 0; C < tableColumn.length; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellAddress]) continue;
          worksheet[cellAddress].s = {
            alignment: { vertical: "center", horizontal: "left", wrapText: true },
          };
        }
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Report");

      const timestamp = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `HRMS-Employees-${timestamp}.xlsx`);

      console.log("Excel file downloaded successfully!");
    } catch (error) {
      console.error("Error while exporting to Excel:", error);
    }
  };

  let result;
  if (props.isLoading) {
    result = <Loader />;
  } else if (data?.length === 0) {
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
  } else {
    result = (
      <React.Fragment>
        <div style={{ textAlign: "right", marginBottom: "1rem" }}>
          <button
            onClick={downloadXLS}
            className="primary-btn"
            style={{
              background: "#882636",
              color: "white",
              padding: "8px 16px",
            }}
          >
            {t("DOWNLOAD_EXCEL")}
          </button>
        </div>
        <ApplicationTable
          t={t}
          data={data}
          columns={columns}
          getCellProps={(cellInfo) => ({
            style: {
              maxWidth:
                cellInfo.column.Header === t("HR_EMP_ID_LABEL") ? "150px" : "",
              padding: "20px 18px",
              fontSize: "16px",
              minWidth: "150px",
            },
          })}
          onPageSizeChange={props.onPageSizeChange}
          currentPage={props.currentPage}
          onNextPage={props.onNextPage}
          onPrevPage={props.onPrevPage}
          pageSizeLimit={props.pageSizeLimit}
          onSort={props.onSort}
          disableSort={props.disableSort}
          sortParams={props.sortParams}
          totalRecords={props?.length || 0}
        />
      </React.Fragment>
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
                loggedInZoneCode={loggedInZoneCode}
                loggedInZoneName={loggedInZoneName}
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
          loggedInZoneCode={loggedInZoneCode}
          loggedInZoneName={loggedInZoneName}
        />
        <div className="result" style={{ marginLeft: !props?.isSearch ? "24px" : "", flex: 1 }}>
          {result}
        </div>
      </div>
    </div>
  );
};

export default DesktopInbox;