import { Header, Loader } from "@nudmcdgnpm/digit-ui-react-components";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DesktopInbox from "../components/inbox/DesktopInbox";
import MobileInbox from "../components/inbox/MobileInbox";

const Inbox = ({ parentRoute, businessService = "HRMS", initialStates = {}, filterComponent, isInbox }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { isLoading: isLoading, data: countRes } = Digit.Hooks.hrms.useHRMSCount(tenantId);
  const { t } = useTranslation();
  const loginZone = Digit.SessionStorage.get("Employee.zone");

  const [pageOffset, setPageOffset] = useState(initialStates.pageOffset || 0);
  const [pageSize, setPageSize] = useState(initialStates.pageSize || 10);
  const [sortParams, setSortParams] = useState(initialStates.sortParams || [{ id: "createdTime", desc: false }]);
  const [totalRecords, setTotalRecords] = useState(undefined);

  // Initialize search params with provided initialStates or fallback to login zone
  const [searchParams, setSearchParams] = useState(() => {
    const fromInitial = initialStates.searchParams || {};
    // if initialStates provided a zone, keep it; otherwise set login zone as default
    return { ...fromInitial, ...(fromInitial.zone ? {} : { zone: loginZone }) };
  });

  // ZONE MDMS (Dropdown Options)
  const { data: zoneMdmsData } = Digit.Hooks.useCustomMDMS(
    tenantId,
    "egov-location",
    [{ name: "TenantBoundary" }],
    {
      select: (data) => {
        const zones = data?.["egov-location"]?.TenantBoundary?.[0]?.boundary?.children || [];
        return zones.map((zone) => ({
          code: zone.code,
          name: zone.name || zone.code,
          i18text: zone.name || zone.code,
        }));
      },
      enabled: !!tenantId,
    }
  );

  // If the user explicitly selected a zone in searchParams -> it's a zone search
  const isZoneSearch = !!searchParams?.zone;

  // Pagination params: zone search forces limit=50
  const paginationParams = {
    limit: isZoneSearch ? 50 : pageSize,
    offset: pageOffset,
    sortOrder: sortParams?.[0]?.desc ? "DESC" : "ASC",
  };

  const isupdate = Digit.SessionStorage.get("isupdate");

  const finalSearchParams = {
    ...searchParams,
    zone: searchParams.zone || loginZone,
  };

  // Use HRMS search hook
  const { isLoading: hookLoading, data, ...rest } = Digit.Hooks.hrms.useHRMSSearch(
    finalSearchParams,
    tenantId,
    paginationParams,
    isupdate
  );

  // Keep totalRecords in sync if backend provides it (optional)
  useEffect(() => {
    if (rest && rest.tableConfig && typeof rest.tableConfig.totalRecords !== "undefined") {
      setTotalRecords(rest.tableConfig.totalRecords);
    }
  }, [rest]);

  useEffect(() => {
    if (isZoneSearch) setPageSize(50);
    setPageOffset(0);
  }, [searchParams]);

  // Pagination controls
  const fetchNextPage = () => setPageOffset((prev) => prev + (isZoneSearch ? 50 : pageSize));
  const fetchPrevPage = () => setPageOffset((prev) => Math.max(0, prev - (isZoneSearch ? 50 : pageSize)));

  // Filter handler — supports deleting keys by passing { delete: ["key1"] }
  const handleFilterChange = (filterParam) => {
    let keys_to_delete = filterParam.delete;
    let _new = { ...searchParams, ...filterParam };
    if (keys_to_delete) keys_to_delete.forEach((key) => delete _new[key]);
    delete _new.delete;

    if (typeof _new.zone !== "undefined" && (_new.zone === null || _new.zone === "")) {
      delete _new.zone;
    }
    setSearchParams({ ..._new });
  };

  const handleSort = useCallback((args) => {
    if (!args || args.length === 0) return;
    setSortParams(args);
  }, []);

  const handlePageSizeChange = (e) => {
    if (!isZoneSearch) setPageSize(Number(e.target.value));
  };

  // Search UI fields
  const getSearchFields = () => {
    return [
      { label: t("HR_EMPLOYEE_ID_LABEL"), name: "codes" },
      {
        label: t("HR_MOB_NO_LABEL"),
        name: "phone",
        maxlength: 10,
        pattern: "[6-9][0-9]{9}",
        title: t("ES_SEARCH_APPLICATION_MOBILE_INVALID"),
        componentInFront: "+91",
      },
      {
        label: t("HR_ZONE_LABEL"),
        name: "zone",
        type: "select",
        options: zoneMdmsData,
      },
    ];
  };

  // Loading guard for initial data required to render
  if (isLoading) return <Loader />;

  // Render based on device
  if (data?.length !== null) {
    const isMobile = window.Digit.Utils.browser.isMobile();

    if (isMobile) {
      return (
        <MobileInbox
          businessService={businessService}
          data={data}
          isLoading={hookLoading}
          defaultSearchParams={initialStates.searchParams}
          isSearch={!isInbox}
          onFilterChange={handleFilterChange}
          searchFields={getSearchFields()}
          onSearch={handleFilterChange}
          onSort={handleSort}
          onNextPage={fetchNextPage}
          tableConfig={rest?.tableConfig}
          onPrevPage={fetchPrevPage}
          currentPage={Math.floor(pageOffset / (isZoneSearch ? 50 : pageSize))}
          pageSizeLimit={isZoneSearch ? 50 : pageSize}
          disableSort={false}
          onPageSizeChange={handlePageSizeChange}
          parentRoute={parentRoute}
          searchParams={searchParams}
          sortParams={sortParams}
          totalRecords={totalRecords}
          linkPrefix={'/digit-ui/employee/hrms/details/'}
          filterComponent={filterComponent}
        />
      );
    }

    return (
      <div>
        {isInbox && <Header>{t("HR_HOME_SEARCH_RESULTS_HEADING")}</Header>}

        <DesktopInbox
          businessService={businessService}
          data={data}
          isLoading={hookLoading}
          defaultSearchParams={initialStates.searchParams}
          isSearch={!isInbox}
          onFilterChange={handleFilterChange}
          searchFields={getSearchFields()}
          onSearch={handleFilterChange}
          onSort={handleSort}
          onNextPage={fetchNextPage}
          onPrevPage={fetchPrevPage}
          currentPage={Math.floor(pageOffset / (isZoneSearch ? 50 : pageSize))}
          pageSizeLimit={isZoneSearch ? 50 : pageSize}
          disableSort={false}
          onPageSizeChange={handlePageSizeChange}
          parentRoute={parentRoute}
          searchParams={searchParams}
          sortParams={sortParams}
          totalRecords={totalRecords}
          filterComponent={filterComponent}
        />
      </div>
    );
  }
  return null;
};

export default Inbox;
