import { CardLabel, CheckBox, DatePicker, Dropdown, LabelFieldPair, Loader } from "@nudmcdgnpm/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import cleanup from "../Utils/cleanup";
import { convertEpochToDate } from "../Utils/index";

const Assignments = ({ t, config, onSelect, userType, formData }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const tenant = tenantId?.includes(".") ? tenantId.split(".")[0] : tenantId;
  const { data: data = {}, isLoading } = Digit.Hooks.hrms.useHrmsMDMS(tenantId, "egov-hrms", "HRMSRolesandDesignation") || {};
  const { data: commonData = {} } = Digit.Hooks.useCommonMDMS(tenant, "common-masters", ["ZoneDivisionMapping"]) || {};

  const [currentassignemtDate, setCurrentAssiginmentDate] = useState(null);
  const [previousZone, setPreviousZone] = useState(null); // Track previous zone
  const [assignments, setassignments] = useState(
    formData?.Assignments || [
      {
        key: 1,
        fromDate: undefined,
        toDate: undefined,
        isCurrentAssignment: false,
        department: null,
        designation: null,
        division: null,
      },
    ]
  );

  const reviseIndexKeys = () => {
    setassignments((prev) => prev.map((unit, index) => ({ ...unit, key: index })));
  };

  const handleAddUnit = () => {
    setassignments((prev) => [
      ...prev,
      {
        key: prev.length + 1,
        fromDate: undefined,
        toDate: undefined,
        isCurrentAssignment: false,
        department: null,
        designation: null,
        division: null,
      },
    ]);
  };

  const handleRemoveUnit = (unit) => {
    setassignments((prev) => prev.filter((el) => el.key !== unit.key));
    if (FormData.errors?.Assignments?.type == unit.key) {
      clearErrors("Jurisdictions");
    }
    reviseIndexKeys();
  };

  const getDivisionData = (department, assignmentKey) => {
    const mappings = commonData?.["common-masters"]?.ZoneDivisionMapping || [];
    const selectedZone = formData?.Jurisdictions?.[0]?.zone;

    if (!department || !selectedZone) return [];

    // Use department code if department is an object, otherwise use department directly
    const departmentCode = typeof department === "object" ? department.code : department;

    // Get zone code properly
    const zoneCode = typeof selectedZone === "object" ? selectedZone.code || selectedZone : selectedZone;

    const mapping = mappings.find((m) => m.zoneCode === zoneCode && m.departmentCode === departmentCode);

    return mapping
      ? mapping.divisions.map((div) => ({
          ...div,
          code: div.divisionCode || div.code,
          divisionCode: div.divisionCode || div.code,
          i18key: t("COMMON_MASTERS_DIVISION_" + (div.divisionCode || div.code)),
        }))
      : [];
  };

  useEffect(() => {
    const selectedZone = formData?.Jurisdictions?.[0]?.zone;
    const currentZoneCode = typeof selectedZone === "object" ? selectedZone.code || selectedZone : selectedZone;

    // Only reset divisions if zone actually changed (not on initial load)
    if (selectedZone && previousZone !== null && currentZoneCode !== previousZone) {
      // Zone changed - reset divisions for all assignments
      setassignments((prev) =>
        prev.map((item) => {
          if (item.department && (item.division === null || item.division === undefined)) {
            // Do not auto select even if only one division
            return { ...item, division: null };
          }
          return { ...item, division: null };
        })
      );
    } else if (selectedZone && previousZone === null) {
      setassignments((prev) =>
        prev.map((item) => {
          if (item.department && (item.division === null || item.division === undefined)) {
            // Do not auto select even if only one division
            return { ...item, division: null };
          }
          return item;
        })
      );
    }

    setPreviousZone(currentZoneCode);
  }, [formData?.Jurisdictions?.[0]?.zone]);

  useEffect(() => {
    var promises = assignments?.map((assignment) => {
      return assignment
        ? cleanup({
            id: assignment?.id,
            position: assignment?.position,
            govtOrderNumber: assignment?.govtOrderNumber,
            tenantid: assignment?.tenantid,
            auditDetails: assignment?.auditDetails,
            fromDate: assignment?.fromDate ? new Date(assignment?.fromDate).getTime() : undefined,
            toDate: assignment?.toDate ? new Date(assignment?.toDate).getTime() : undefined,
            isCurrentAssignment: assignment?.isCurrentAssignment,
            // Send only codes as strings, not objects - handle null divisions
            department: assignment?.department?.code || assignment?.department,
            designation: assignment?.designation?.code || assignment?.designation,
            division: assignment?.division?.divisionCode || assignment?.division?.code || assignment?.division || null,
          })
        : [];
    });

    Promise.all(promises).then(function (results) {
      onSelect(
        config.key,
        results.filter((value) => Object.keys(value).length !== 0)
      );
    });

    assignments.map((ele) => {
      if (ele.isCurrentAssignment) {
        setCurrentAssiginmentDate(ele.fromDate);
      }
    });
  }, [assignments]);

  let department = [];
  let designation = [];
  const [focusIndex, setFocusIndex] = useState(-1);

  function getdepartmentdata() {
    return data?.MdmsRes?.["common-masters"]?.Department.map((ele) => {
      ele["i18key"] = t("COMMON_MASTERS_DEPARTMENT_" + ele.code);
      return ele;
    });
  }
  function getdesignationdata() {
    return data?.MdmsRes?.["common-masters"]?.Designation.map((ele) => {
      ele["i18key"] = t("COMMON_MASTERS_DESIGNATION_" + ele.code);
      return ele;
    });
  }

  if (isLoading) return <Loader />;

  return (
    <div>
      {assignments?.map((assignment, index) => (
        <Assignment
          t={t}
          key={index}
          keys={index.key}
          formData={formData}
          assignment={assignment}
          setassignments={setassignments}
          index={index}
          focusIndex={focusIndex}
          setFocusIndex={setFocusIndex}
          getdepartmentdata={getdepartmentdata}
          department={department}
          designation={designation}
          getdesignationdata={getdesignationdata}
          getDivisionData={getDivisionData}
          assignments={assignments}
          handleRemoveUnit={handleRemoveUnit}
          setCurrentAssiginmentDate={setCurrentAssiginmentDate}
          currentassignemtDate={currentassignemtDate}
        />
      ))}
      <label onClick={handleAddUnit} className="link-label" style={{ width: "12rem" }}>
        {t("HR_ADD_ASSIGNMENT")}
      </label>
    </div>
  );
};

function Assignment({
  t,
  assignment,
  assignments,
  setassignments,
  index,
  focusIndex,
  setFocusIndex,
  getdepartmentdata,
  department,
  formData,
  handleRemoveUnit,
  designation,
  getdesignationdata,
  getDivisionData,
  setCurrentAssiginmentDate,
  currentassignemtDate,
}) {
  const selectDepartment = (value) => {
    const availableDivisions = getDivisionData(value, assignment.key);
    const autoDivision = availableDivisions.length === 1 ? availableDivisions[0] : null;

    setassignments((pre) =>
      pre.map((item) => {
        if (item.key === assignment.key) {
          // ❌ remove auto-selection of division
          return { ...item, department: value, division: null };
        }
        return item;
      })
    );
  };

  const selectDesignation = (value) => {
    setassignments((pre) => pre.map((item) => (item.key === assignment.key ? { ...item, designation: value } : item)));
  };

  const selectDivision = (value) => {
    setassignments((pre) => pre.map((item) => (item.key === assignment.key ? { ...item, division: value } : item)));
  };
  const onAssignmentChange = (value) => {
    setassignments((pre) =>
      pre.map((item) => (item.key === assignment.key ? { ...item, isCurrentAssignment: value } : { ...item, isCurrentAssignment: false }))
    );
    if (value) {
      setassignments((pre) =>
        pre.map((item) =>
          item.key === assignment.key
            ? {
                ...item,
                toDate: null,
              }
            : item
        )
      );
      assignments.map((ele) => {
        if (ele.key == assignment.key) {
          setCurrentAssiginmentDate(ele.fromDate);
        }
      });
    } else {
      setCurrentAssiginmentDate(null);
    }
  };
  const onIsHODchange = (value) => {
    setassignments((pre) => pre.map((item) => (item.key === assignment.key ? { ...item, isHOD: value } : item)));
  };

  const ValidateDatePickers = (value) => {
    assignments;
  };
  return (
    <div key={index + 1} style={{ marginBottom: "16px" }}>
      <div style={{ border: "1px solid #E3E3E3", padding: "16px", marginTop: "8px" }}>
        <LabelFieldPair>
          <div className="label-field-pair" style={{ width: "100%" }}>
            <h2 className="card-label card-label-smaller" style={{ color: "#505A5F" }}>
              {t("HR_ASSIGNMENT")} {index + 1}
            </h2>
          </div>
          {assignments.length > 1 && !assignment?.id && !assignment?.isCurrentAssignment ? (
            <div onClick={() => handleRemoveUnit(assignment)} style={{ marginBottom: "16px", padding: "5px", cursor: "pointer", textAlign: "right" }}>
              X
            </div>
          ) : null}
        </LabelFieldPair>

        <LabelFieldPair>
          <CardLabel className={assignment?.id ? "card-label-smaller disabled" : "card-label-smaller"}>
            {" "}
            {`${t("HR_ASMT_FROM_DATE_LABEL")} * `}{" "}
          </CardLabel>
          <div className="field">
            <DatePicker
              type="date"
              name="fromDate"
              max={currentassignemtDate ? currentassignemtDate : convertEpochToDate(new Date())}
              min={formData?.SelectDateofEmployment?.dateOfAppointment}
              disabled={assignment?.id ? true : false}
              onChange={(e) => {
                setassignments((pre) => pre.map((item) => (item.key === assignment.key ? { ...item, fromDate: e } : item)));
                setFocusIndex(index);
              }}
              date={assignment?.fromDate}
              autoFocus={focusIndex === index}
            />
          </div>
        </LabelFieldPair>
        <LabelFieldPair>
          <CardLabel className={assignment?.isCurrentAssignment ? "card-label-smaller disabled" : "card-label-smaller"}>
            {t("HR_ASMT_TO_DATE_LABEL")}
            {assignment?.isCurrentAssignment ? "" : " * "}{" "}
          </CardLabel>
          <div className="field">
            <DatePicker
              type="date"
              name="toDate"
              min={assignment?.fromDate}
              max={currentassignemtDate ? currentassignemtDate : convertEpochToDate(new Date())}
              disabled={assignment?.isCurrentAssignment}
              onChange={(e) => {
                setassignments((pre) => pre.map((item) => (item.key === assignment.key ? { ...item, toDate: e } : item)));
                setFocusIndex(index);
              }}
              date={assignment?.toDate}
              autoFocus={focusIndex === index}
            />
          </div>
        </LabelFieldPair>

        <LabelFieldPair>
          <CardLabel className="card-label-smaller" style={{ color: "white" }}>
            .
          </CardLabel>
          <div className="field">
            <CheckBox
              onChange={(e) => onAssignmentChange(e.target.checked)}
              checked={assignment?.isCurrentAssignment}
              label={t("HR_CURRENTLY_ASSIGNED_HERE_SWITCH_LABEL")}
            />
          </div>
        </LabelFieldPair>
        <LabelFieldPair>
          <CardLabel className="card-label-smaller">{`${t("HR_DEPT_LABEL")} * `}</CardLabel>
          <Dropdown
            className="form-field"
            selected={assignment?.department}
            disable={false}
            optionKey={"i18key"}
            option={getdepartmentdata(department) || []}
            select={selectDepartment}
            t={t}
          />
        </LabelFieldPair>

        <LabelFieldPair>
          <CardLabel className="card-label-smaller">{`${t("HR_DIVS_LABEL")} `}</CardLabel>
          <Dropdown
            className="form-field"
            selected={assignment?.division}
            disable={!assignment?.department}
            optionKey={"i18key"}
            option={getDivisionData(assignment?.department, assignment.key)}
            select={selectDivision}
            t={t}
          />
        </LabelFieldPair>

        <LabelFieldPair>
          <CardLabel className="card-label-smaller">{`${t("HR_DESG_LABEL")} * `}</CardLabel>
          <Dropdown
            className="form-field"
            selected={assignment?.designation}
            disable={false}
            option={getdesignationdata(designation) || []}
            select={selectDesignation}
            optionKey={"i18key"}
            t={t}
          />
        </LabelFieldPair>
      </div>
    </div>
  );
}

export default Assignments;