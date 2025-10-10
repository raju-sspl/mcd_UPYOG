import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ApplicationCard } from "./ApplicationCard";
// import { ApplicationLinks } from "@nudmcdgnpm/digit-ui-react-components";

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

  // Fetch zone data for display using i18text
  const { data: zoneMdmsData = {} } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getCurrentTenantId(),
    "egov-location",
    [
      {
        name: "TenantBoundary",
      },
    ],
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

  // Apply client-side zone filtering
  const filteredData = useMemo(() => {
    const rawData = data?.Employees;

    // If no data, return empty array
    if (!rawData || rawData.length === 0) return [];

    // Check if zone filter is active
    const zoneFilter = searchParams?.zone || searchParams?._clientZone;

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
  }, [data?.Employees, searchParams?.zone, searchParams?._clientZone]);

  const GetCell = (value) => <span className="cell-text">{t(value)}</span>;
  const GetSlaCell = (value) => {
    return value == "INACTIVE" ? (
      <span className="sla-cell-error">{t(value) || ""}</span>
    ) : (
      <span className="sla-cell-success">{t(value) || ""}</span>
    );
  };
  const getData = () => {
    return filteredData?.map((original) => {
      const zone = original?.jurisdictions?.[0]?.zone;
      return {
        [t("HR_EMP_ID_LABEL")]: original?.code,
        [t("HR_EMP_NAME_LABEL")]: GetCell(original?.user?.name || ""),
        [t("HR_ROLE_NO_LABEL")]: GetCell(original?.user?.roles.length || ""),
        [t("HR_DESG_LABEL")]: GetCell(
          t("COMMON_MASTERS_DESIGNATION_" + original?.assignments?.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate))[0]?.designation)
        ),
        [t("HR_DEPT_LABEL")]: GetCell(
          t(`COMMON_MASTERS_DEPARTMENT_${original?.assignments?.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate))[0]?.department}`)
        ),
        [t("HR_ZONE_LABEL")]: GetCell(zone ? zoneMdmsData[zone] || zone : ""),
        [t("HR_STATUS_LABEL")]: GetSlaCell(original?.isActive ? "ACTIVE" : "INACTIVE"),
      };
    });
  };

  const serviceRequestIdKey = (original) => {
    return `${searchParams?.tenantId}/${original?.[t("HR_EMP_ID_LABEL")]}`;
  };

  return (
    <div style={{ padding: 0 }}>
      <div className="inbox-container">
        <div className="filters-container">
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
    </div>
  );
};

export default MobileInbox;
