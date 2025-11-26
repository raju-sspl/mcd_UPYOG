import { ActionBar, CloseSvg, DatePicker, Label, LinkLabel, SubmitBar, TextInput, Dropdown } from "@nudmcdgnpm/digit-ui-react-components";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

const SearchApplication = ({
  onSearch,
  type,
  onClose,
  searchFields,
  searchParams,
  isInboxPage,
  defaultSearchParams,
  loggedInZoneCode,
  loggedInZoneName
}) => {
  const { t } = useTranslation();
  const { register, handleSubmit, reset, watch, control, setValue } = useForm({
    defaultValues: searchParams,
  });
  const mobileView = innerWidth <= 640;

  // ✅ Check if user is HQ
  const isHQUser = !loggedInZoneCode || loggedInZoneCode === "HQ" || loggedInZoneCode === "";

  // ✅ Auto-set zone for non-HQ users
  useEffect(() => {
    if (!isHQUser && loggedInZoneCode) {
      setValue("zone", { code: loggedInZoneCode, name: loggedInZoneName || loggedInZoneCode });
    }
  }, [loggedInZoneCode, loggedInZoneName, isHQUser, setValue]);

  const onSubmitInput = (data) => {
    if (!data.mobileNumber) {
      delete data.mobileNumber;
    }
    data.delete = [];
    searchFields.forEach((field) => {
      if (!data[field.name]) data.delete.push(field.name);
    });

    if (data.zone) {
      data.zone = data.zone.code;
    }

    onSearch(data);
    if (type === "mobile") {
      onClose();
    }
  };

  function clearSearch() {
    const resetValues = searchFields.reduce((acc, field) => {
      // ✅ For non-HQ users, keep zone value even on clear
      if (field?.name === "zone" && !isHQUser) {
        return {
          ...acc,
          [field?.name]: { code: loggedInZoneCode, name: loggedInZoneName || loggedInZoneCode }
        };
      }
      return { ...acc, [field?.name]: "" };
    }, {});

    reset(resetValues);
    const _newParams = { ...searchParams };
    _newParams.delete = [];
    searchFields.forEach((e) => {
      // ✅ Don't clear zone for non-HQ users
      if (e?.name === "zone" && !isHQUser) {
        return;
      }
      _newParams.delete.push(e?.name);
    });

    // ✅ Keep zone in search params for non-HQ users
    if (!isHQUser) {
      _newParams.zone = loggedInZoneCode;
    }

    onSearch({ ..._newParams });
  }

  const clearAll = (mobileView) => {
    const mobileViewStyles = mobileView ? { margin: 0 } : {};
    return (
      <LinkLabel style={{ display: "inline", ...mobileViewStyles }} onClick={clearSearch}>
        {t("HR_COMMON_CLEAR_SEARCH")}
      </LinkLabel>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmitInput)}>
      <React.Fragment>
        <div className="search-container" style={{ width: "auto", marginLeft: isInboxPage ? "24px" : "revert" }}>
          <div className="search-complaint-container">
            {(type === "mobile" || mobileView) && (
              <div className="complaint-header" style={{ display: 'flex', justifyContent: "space-between" }}>
                <h2>{t("ES_COMMON_SEARCH_BY")}</h2>
                <span onClick={onClose}>
                  <CloseSvg />
                </span>
              </div>
            )}
            <div className="complaint-input-container" style={{ width: "100%" }}>
              {searchFields
                ?.filter((e) => true)
                ?.map((input, index) => {
                  // ✅ Check if this is the zone field
                  const isZoneField = input.name === "zone";

                  return (
                    <div key={input.name} className="input-fields">
                      <span className={"mobile-input"}>
                        <Label>{input.label}</Label>
                        {input.type !== "date" && input.type !== "select" ? (
                          <div className="field-container">
                            {input?.componentInFront ? (
                              <span
                                className="citizen-card-input citizen-card-input--front"
                                style={{ flex: "none" }}
                              >
                                {input?.componentInFront}
                              </span>
                            ) : null}
                            <TextInput {...input} inputRef={register} watch={watch} shouldUpdate={true} />
                          </div>
                        ) : input.type === "select" ? (
                          // ✅ Special handling for zone field
                          isZoneField && !isHQUser ? (
                            // Non-HQ users: Show disabled text input
                            <React.Fragment>
                              <input
                                type="text"
                                value={loggedInZoneName || loggedInZoneCode}
                                disabled={true}
                                className="employee-card-input"
                                style={{
                                  backgroundColor: "#f5f5f5",
                                  cursor: "not-allowed",
                                  color: "#666",
                                  border: "1px solid #d3d3d3",
                                  padding: "8px 12px",
                                  borderRadius: "4px",
                                  width: "100%",
                                  boxSizing: "border-box"
                                }}
                              />
                              <Controller
                                name={input.name}
                                control={control}
                                defaultValue={{ code: loggedInZoneCode, name: loggedInZoneName || loggedInZoneCode }}
                                render={() => null}
                              />
                            </React.Fragment>
                          ) : (
                            // HQ users or other select fields: Show dropdown
                            <Controller
                              name={input.name}
                              control={control}
                              defaultValue={null}
                              render={(props) => {
                                return (
                                  <Dropdown
                                    selected={props.value}
                                    select={(selectedValue) => {
                                      props.onChange(selectedValue);
                                    }}
                                    option={input.options}
                                    optionKey="name"
                                    t={t}
                                  />
                                );
                              }}
                            />
                          )
                        ) : (
                          <Controller
                            render={(props) => <DatePicker date={props.value} onChange={props.onChange} />}
                            name={input.name}
                            control={control}
                            defaultValue={null}
                          />
                        )}{" "}
                      </span>
                    </div>
                  );
                })}
            </div>
            <div className="inbox-action-container">
              {type === "desktop" && !mobileView && (
                <span style={{ paddingTop: "9px" }} className="clear-search">
                  {clearAll()}
                </span>
              )}
              {type === "desktop" && !mobileView && (
                <SubmitBar
                  style={{ marginTop: "unset" }}
                  className="submit-bar-search"
                  label={t("ES_COMMON_SEARCH")}
                  submit
                />
              )}
            </div>
          </div>
        </div>
        {(type === "mobile" || mobileView) && (
          <ActionBar className="clear-search-container">
            <button className="clear-search" style={{ flex: 1 }}>
              {clearAll(mobileView)}
            </button>
            <SubmitBar label={t("HR_COMMON_SEARCH")} style={{ flex: 1 }} submit={true} />
          </ActionBar>
        )}
      </React.Fragment>
    </form>
  );
};

export default SearchApplication;