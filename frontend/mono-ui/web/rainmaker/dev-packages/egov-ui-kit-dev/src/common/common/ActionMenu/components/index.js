"use client";

import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Icon, TextFieldIcon } from "components";
import { prepareFinalObject } from "egov-ui-framework/ui-redux/screen-configuration/actions";
import { fetchLocalizationLabel } from "egov-ui-kit/redux/app/actions";
import { getModuleName } from "egov-ui-kit/utils/commons";
import {
  getLocale,
  getStoredModulesList,
  getTenantId,
  localStorageGet,
  localStorageSet,
  setStoredModulesList,
  setModule,
} from "egov-ui-kit/utils/localStorageUtils";
import TranslationNode from "egov-ui-kit/utils/translationNode";
import "./index.css";

const styles = {
  inputStyle: {
    color: window.innerWidth > 768 ? "#ecf0f1" : "#2c3e50",
    bottom: "5px",
    height: "auto",
    paddingLeft: "5px",
    textIndent: "5px",
    marginTop: 0,
  },
  fibreIconStyle: {
    height: "21px",
    width: "21px",
    margin: 0,
    position: "relative",
    color: "#ecf0f1",
  },
  inputIconStyle: {
    margin: "0",
    bottom: "15px",
    top: "auto",
    right: "6px",
    color: "#ecf0f1",
  },
  textFieldStyle: {
    height: "auto",
    textIndent: "15px",
    color: "#ecf0f1",
  },
};

class ActionMenuComp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchText: "",
      filteredActions: null,
      mobileSearchVisible: false,
      expandedItems: {},
    };
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.activeRoutePath !== "null" &&
      this.props.activeRoutePath !== prevProps.activeRoutePath
    ) {
      this.fetchLocales();
      this.setState({ searchText: "" });
    }
  }

  getTopLevelMenuItems = (actionList) => {
    if (!actionList) return [];
    const topLevelPaths = {};
    actionList.forEach((action) => {
      if (action.path) {
        const firstLevel = action.path.split(".")[0];
        if (!topLevelPaths[firstLevel]) {
          topLevelPaths[firstLevel] = {
            name: firstLevel,
            path: firstLevel,
            displayName: firstLevel,
            leftIcon: action.leftIcon ? action.leftIcon.split(".")[0] : null,
          };
        }
      }
    });
    return Object.values(topLevelPaths);
  };

  hasChildren = (path) => {
    return this.props.actionListArr.some(
      (action) =>
        action.path && action.path.startsWith(path + ".") && action.path !== path
    );
  };

  getSubmenuItems = (path) => {
    const { actionListArr } = this.props;
    if (!actionListArr) return [];

    const submenuItems = [];
    const pathPrefix = path + ".";
    actionListArr.forEach((action) => {
      if (action.path && action.path.startsWith(pathPrefix)) {
        const remainingPath = action.path.substring(pathPrefix.length);
        const parts = remainingPath.split(".");
        if (parts.length === 1) {
          submenuItems.push({
            name: action.displayName,
            path: action.path,
            displayName: action.displayName,
            navigationURL: action.navigationURL,
            url: action.url,
            leftIcon: action.leftIcon,
          });
        } else if (parts.length > 1) {
          const firstPart = parts[0];
          const childPath = path + "." + firstPart;
          if (!submenuItems.some((item) => item.path === childPath)) {
            submenuItems.push({
              name: firstPart,
              path: childPath,
              displayName: firstPart,
              leftIcon: action.leftIcon,
            });
          }
        }
      }
    });
    // Keep Dashboard first, Inboxes second, everything else as-is
    submenuItems.sort((a, b) => {
      // Always keep Dashboard on top
      if (a.name === "Dashboard") return -1;
      if (b.name === "Dashboard") return 1;

      // Keep Inboxes second
      if (a.name === "Inboxes") return -1;
      if (b.name === "Inboxes") return 1;
      return 0;
    });

    return submenuItems;
  };

  fetchLocales = () => {
    const storedModuleList = getStoredModulesList()
      ? JSON.parse(getStoredModulesList())
      : [];
    if (!storedModuleList.includes(getModuleName())) {
      storedModuleList.push(getModuleName());
      setStoredModulesList(JSON.stringify(storedModuleList));
      setModule(getModuleName());
      const tenantId = getTenantId();
      this.props.fetchLocalizationLabel(getLocale(), tenantId, tenantId);
    }
  };

  handleChange = (e) => {
    const searchText = e.target.value;
    this.setState({ searchText });
    if (searchText.length > 0) {
      const filtered = this.props.actionListArr.filter(
        (action) =>
          action.displayName &&
          action.displayName.toLowerCase().includes(searchText.toLowerCase())
      );
      this.setState({ filteredActions: filtered });
    } else {
      this.setState({ filteredActions: null });
    }
  };

  toggleMobileSearch = () => {
    this.setState((prevState) => ({
      mobileSearchVisible: !prevState.mobileSearchVisible,
      searchText: prevState.mobileSearchVisible ? "" : prevState.searchText,
      filteredActions: prevState.mobileSearchVisible
        ? null
        : prevState.filteredActions,
    }));
  };

  handleToggleItem = (itemPath) => {
    this.setState((prevState) => {
      const currentExpanded = { ...prevState.expandedItems };
      const isCurrentlyExpanded = !!currentExpanded[itemPath];
      const pathParts = itemPath.split(".");

      if (isCurrentlyExpanded) {
        const newExpanded = {};
        for (const key in currentExpanded) {
          if (!key.startsWith(itemPath)) {
            newExpanded[key] = true;
          }
        }
        return { expandedItems: newExpanded };
      } else {
        const newExpanded = {};
        if (pathParts.length === 1) {
          newExpanded[itemPath] = true;
        } else {
          for (const key in currentExpanded) {
            if (itemPath.startsWith(key)) {
              newExpanded[key] = true;
            }
          }
          newExpanded[itemPath] = true;
        }
        return { expandedItems: newExpanded };
      }
    });
  };

  renderAccordionItem = (item, level = 0) => {
    const { expandedItems } = this.state;
    const isExpanded = !!expandedItems[item.path];
    const hasChildren = this.hasChildren(item.path);
    const itemStyle = { paddingLeft: `${15 + level * 20}px` };
    const label = item.displayName
      ? `ACTION_TEST_${item.displayName
          .toUpperCase()
          .replace(/[.:-\s/]/g, "_")}`
      : "";

    if (item.navigationURL && item.navigationURL !== "newTab") {
      const url = item.navigationURL.startsWith("/")
        ? item.navigationURL
        : "/" + item.navigationURL;
      return (
        <li className="nav-item" key={item.path}>
          <Link
            className="nav-link"
            style={itemStyle}
            to={url}
            onClick={(e) => {
              if (item.navigationURL === "tradelicence/apply")
                this.props.setRequiredDocumentFlag();
              document.title = item.displayName || item.name;
              if (item.navigationURL.includes("digit-ui")) {
                window.location.href = item.navigationURL;
                e.preventDefault();
                return;
              }
              this.props.updateActiveRoute(item.path, item.displayName || item.name);
              this.props.toggleDrawer && this.props.toggleDrawer();
            }}
          >
            {this.renderLeftIcon(item.leftIcon, item)}
            <TranslationNode label={label} className="whiteColor" />
          </Link>
        </li>
      );
    }

    if (item.url) {
      return (
        <li className="nav-item" key={item.path}>
          <a
            className="nav-link"
            style={itemStyle}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              localStorageSet("menuPath", item.path);
              document.title = item.displayName || item.name;
            }}
          >
            {this.renderLeftIcon(item.leftIcon, item)}
            <TranslationNode label={label} className="whiteColor" />
          </a>
        </li>
      );
    }

    if (hasChildren) {
      return (
        <React.Fragment key={item.path}>
          <li className="nav-item">
            <div
              className={`nav-link accordion-toggle ${isExpanded ? "expanded" : ""}`}
              style={itemStyle}
              onClick={() => this.handleToggleItem(item.path)}
            >
              {this.renderLeftIcon(item.leftIcon, item)}
              <TranslationNode label={label} className="whiteColor" />
              <span className={`menu-arrow ${isExpanded ? "expanded" : ""}`}>
                ▶
              </span>
            </div>
          </li>
          <ul
            className={`nav flex-column submenu-accordion ${isExpanded ? "open" : ""}`}
            style={{ padding: 0, margin: 0, listStyle: "none" }}
          >
            {this.getSubmenuItems(item.path).map((subItem) =>
              this.renderAccordionItem(subItem, level + 1)
            )}
          </ul>
        </React.Fragment>
      );
    }

    return (
      <li className="nav-item" key={item.path}>
        <div className="nav-link disabled" style={itemStyle}>
          {this.renderLeftIcon(item.leftIcon, item)}
          <TranslationNode label={label} className="whiteColor" />
        </div>
      </li>
    );
  };

  renderSearchResults = () => {
    const { filteredActions, searchText } = this.state;
    if (!filteredActions || searchText.length === 0) return null;
    return (
      <div className="search-results-container">
        <ul className="nav flex-column">
          {filteredActions.map((action, index) =>
            action.navigationURL ? (
              <li className="nav-item" key={index}>
                <Link
                  className="nav-link"
                  to={
                    action.navigationURL.startsWith("/")
                      ? action.navigationURL
                      : "/" + action.navigationURL
                  }
                  onClick={(e) => {
                    document.title = action.displayName;
                    if (action.navigationURL.includes("digit-ui")) {
                      window.location.href = action.navigationURL;
                      e.preventDefault();
                      return;
                    }
                    this.props.updateActiveRoute(action.path, action.displayName);
                    this.props.toggleDrawer && this.props.toggleDrawer();
                  }}
                >
                  {this.renderLeftIcon(action.leftIcon, action)}
                  <TranslationNode
                    label={
                      action.displayName
                        ? `ACTION_TEST_${action.displayName
                            .toUpperCase()
                            .replace(/[.:-\s/]/g, "_")}`
                        : ""
                    }
                    className="whiteColor"
                  />
                </Link>
              </li>
            ) : null
          )}
        </ul>
      </div>
    );
  };

  renderLeftIcon(leftIcon, item) {
    if (!leftIcon) return null;
    const iconParts = typeof leftIcon === "string" ? leftIcon.split(":") : [];
    if (iconParts.length >= 2) {
      return (
        <Icon
          name={iconParts[1]}
          action={iconParts[0]}
          style={styles.fibreIconStyle}
          className={`iconClassHover left-icon-color material-icons custom-style-for-${item.name}`}
        />
      );
    }
    return null;
  }

  render() {
    const { actionListArr } = this.props;
    const { searchText, filteredActions, mobileSearchVisible } = this.state;

    if (!actionListArr) return null;

    const topLevelItems = this.getTopLevelMenuItems(actionListArr);
    const allowedMenus = ["Finance"];
    const filteredTopLevelItems = topLevelItems.filter((item) => allowedMenus.includes(item.displayName));

    return (
      <div className="sidebar card py-2 mb-4" style={{ overflow: "auto" }}>
        <div className="mobile-search-toggle" onClick={this.toggleMobileSearch}>
          <Icon name="search" />
        </div>
        {mobileSearchVisible ? (
          <div className="mobile-search-container">
            <TextFieldIcon
              value={searchText}
              hintText={<TranslationNode label="PT_SEARCH_BUTTON" className="whiteColor" />}
              iconStyle={styles.inputIconStyle}
              inputStyle={{ ...styles.inputStyle, color: "black" }}
              textFieldStyle={styles.textFieldStyle}
              iconPosition="before"
              onChange={this.handleChange}
              autoFocus
            />
          </div>
        ) : (
          <div
            className="menu-search-container"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingRight: 10,
            }}
          >
            <TextFieldIcon
              value={searchText}
              hintText={<TranslationNode label="PT_SEARCH_BUTTON" className="whiteColor" />}
              iconStyle={styles.inputIconStyle}
              inputStyle={styles.inputStyle}
              textFieldStyle={{ ...styles.textFieldStyle, flex: 1 }}
              iconPosition="before"
              onChange={this.handleChange}
            />
            <Icon
              action="action"
              name="home"
              className="material-icons"
              style={{ fontSize: 24, color: "white", cursor: "pointer", marginLeft: 10 }}
              title="Go to Home"
              onClick={() => (window.location.href = "/digit-ui/employee")}
            />
          </div>
        )}

        <div className="menu-scroll-container">
          {filteredActions ? (
            this.renderSearchResults()
          ) : (
            <ul className="nav flex-column main-menu accordion-menu">
              {this.getSubmenuItems("Finance").map((child) =>
                this.renderAccordionItem(child, 0)
              )}
            </ul>
          )}
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  handleToggle: (showMenu) => dispatch({ type: "MENU_TOGGLE", showMenu }),
  setRoute: (route) => dispatch({ type: "SET_ROUTE", route }),
  fetchLocalizationLabel: (locale, moduleName, tenantId) =>
    dispatch(fetchLocalizationLabel(locale, moduleName, tenantId)),
  setRequiredDocumentFlag: () =>
    dispatch(prepareFinalObject("isRequiredDocuments", true)),
});

export default connect(null, mapDispatchToProps)(ActionMenuComp);
