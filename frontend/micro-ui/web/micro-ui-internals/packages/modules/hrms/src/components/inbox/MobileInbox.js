import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ApplicationCard } from "./ApplicationCard";
import XLSX from "xlsx";

const MobileInbox = ({
  data,
  isLoading,
  isSearch,
  searchFields,
  onFilterChange,
  onSearch,
  onSort,
  parentRoute,
  searchParams,
  sortParams,
  linkPrefix,
  tableConfig,
  filterComponent,
  allLinks,
}) => {
  const { t } = useTranslation();

  // ✅ Get logged-in user's zone (same logic as DesktopInbox)
  const getUserZone = () => {
    let zoneName = Digit.SessionStorage.get("Employee.zone");

    if (!zoneName || zoneName === "HQ") {
      const userInfo = Digit.UserService.getUser();

      zoneName =
        userInfo?.info?.tenantId ||
        userInfo?.info?.zone?.code ||
        userInfo?.tenantId ||
        searchParams?.zone ||
        "HQ";

      zoneName = userInfo?.info?.zone?.name || userInfo?.zoneName || "";

      if (zoneName && zoneName.includes(".")) {
        const parts = zoneName.split(".");
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

  // ✅ Fetch zone name from MDMS (already in your original code)
  const { data: zoneMdmsData = {} } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getCurrentTenantId(),
    "egov-location",
    [{ name: "TenantBoundary" }],
    {
      select: (data) => {
        const zones = data?.["egov-location"]?.TenantBoundary?.[0]?.boundary?.children || [];
        return zones.reduce((acc, zone) => {
          acc[zone.code] = zone.name || zone.code;
          return acc;
        }, {});
      },
    }
  );

  // ✅ UPDATED: Client-side zone filtering logic
  const filteredData = useMemo(() => {
    const rawData = data?.Employees;
    if (!rawData || rawData.length === 0) return [];

    const isSpecificSearch =
      searchParams?.name || searchParams?.mobileNumber || searchParams?.code;

    if (isSpecificSearch) return rawData;

    const zoneFilter = searchParams?.zone || searchParams?._clientZone;

    const effectiveZoneFilter =
      loggedInZoneCode !== "HQ" ? loggedInZoneCode : zoneFilter;

    if (!effectiveZoneFilter) return rawData;

    return rawData.filter((employee) => {
      const employeeZone = employee?.jurisdictions?.[0]?.zone;
      return employeeZone === effectiveZoneFilter;
    });
  }, [data?.Employees, searchParams, loggedInZoneCode]);

  const GetCell = (value) => <span className="cell-text">{t(value)}</span>;
  const GetSlaCell = (value) =>
    value == "INACTIVE" ? (
      <span className="sla-cell-error">{t(value) || ""}</span>
    ) : (
      <span className="sla-cell-success">{t(value) || ""}</span>
    );

  const getData = () => {
    return filteredData?.map((original) => {
      const zone = original?.jurisdictions?.[0]?.zone;
      return {
        [t("HR_EMP_ID_LABEL")]: original?.code,
        [t("HR_EMP_NAME_LABEL")]: GetCell(original?.user?.name || ""),
        [t("HR_ROLE_NO_LABEL")]: GetCell(original?.user?.roles.length || ""),
        [t("HR_DESG_LABEL")]: GetCell(
          t(
            "COMMON_MASTERS_DESIGNATION_" +
            original?.assignments?.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate))[0]
              ?.designation
          )
        ),
        [t("HR_DEPT_LABEL")]: GetCell(
          t(
            `COMMON_MASTERS_DEPARTMENT_${original?.assignments?.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate))[0]
              ?.department
            }`
          )
        ),
        [t("HR_ZONE_LABEL")]: GetCell(zone ? zoneMdmsData[zone] || zone : ""),
        [t("HR_STATUS_LABEL")]: GetSlaCell(original?.isActive ? "ACTIVE" : "INACTIVE"),
      };
    });
  };

  const serviceRequestIdKey = (original) => {
    return `${searchParams?.tenantId}/${original?.[t("HR_EMP_ID_LABEL")]}`;
  };

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

      const tableRows = filteredData.map((emp) => {
        const firstAssignment = emp?.assignments?.sort(
          (a, b) => new Date(a.fromDate) - new Date(b.fromDate)
        )[0];
        const zone = emp?.jurisdictions?.[0]?.zone;

        // ✅ Translate Department / Designation
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

      // ✅ Create worksheet and workbook
      const worksheet = XLSX.utils.aoa_to_sheet([tableColumn, ...tableRows]);
      const workbook = XLSX.utils.book_new();

      // ✅ Horizontal spacing (column widths)
      worksheet["!cols"] = [
        { wch: 18 }, // Employee ID
        { wch: 28 }, // Employee Name
        { wch: 26 }, // Designation
        { wch: 26 }, // Department
        { wch: 20 }, // Zone
        { wch: 15 }, // Status
      ];

      // ✅ Vertical spacing (row heights)
      worksheet["!rows"] = new Array(tableRows.length + 1).fill({ hpt: 22 });
      // hpt = height in points; default is ~15. 22 gives nice vertical padding

      // ✅ Style headers (bold + centered + background)
      tableColumn.forEach((col, idx) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx });
        if (!worksheet[cellAddress]) return;
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "0078D7" } }, // light blue background
          alignment: { horizontal: "center", vertical: "center" },
        };
      });

      // ✅ Apply general alignment for all data cells
      for (let R = 1; R <= tableRows.length; ++R) {
        for (let C = 0; C < tableColumn.length; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[cellAddress]) continue;
          worksheet[cellAddress].s = {
            alignment: { vertical: "center", horizontal: "left", wrapText: true },
          };
        }
      }

      // ✅ Append worksheet and download
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Report");

      // ✅ Add timestamp to filename
      const timestamp = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `HRMS-Employees-${timestamp}.xlsx`);

      console.log("Excel file downloaded successfully with spacing!");
    } catch (error) {
      console.error("Error while exporting to Excel:", error);
    }
  };
  return (
    <div style={{ padding: 0 }}>
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

      <div className="inbox-container">
        <ApplicationCard
          t={t}
          data={getData()}
          onFilterChange={onFilterChange}
          isLoading={isLoading}
          isSearch={isSearch}
          onSearch={onSearch}
          onSort={onSort}
          searchParams={searchParams}
          searchFields={searchFields}
          linkPrefix={linkPrefix}
          sortParams={sortParams}
          filterComponent={filterComponent}
          serviceRequestIdKey={serviceRequestIdKey}
        />
      </div>
    </div>
  );
};

export default MobileInbox;
