"use client"

import { Icon, TextFieldIcon } from "components"
import { prepareFinalObject } from "egov-ui-framework/ui-redux/screen-configuration/actions"
import { fetchLocalizationLabel } from "egov-ui-kit/redux/app/actions"
import { fetchFromLocalStorage, getModuleName } from "egov-ui-kit/utils/commons"
import {
  getLocale,
  getStoredModulesList,
  getTenantId,
  localStorageGet,
  localStorageSet,
  setModule,
  setStoredModulesList,
} from "egov-ui-kit/utils/localStorageUtils"
import Label from "egov-ui-kit/utils/translationNode"
import { orderBy, some, split } from "lodash"
import get from "lodash/get"
import React, { Component } from "react"
import { connect } from "react-redux"
import { Link } from "react-router-dom"
import "./index.css"

const styles = {
  // Styles are preserved from the original component
  inputStyle: {
    color: "#ecf0f1 !important",
    marginTop: "0px",
    marginLeft: "-10px",
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
  inputStyle: {
    color: window.innerWidth > 768 ? "#ecf0f1" : "#2c3e50",
    bottom: "5px",
    height: "auto",
    paddingLeft: "5px",
    textIndent: "5px",
    marginTop: 0,
  },
}

class ActionMenuComp extends Component {
  constructor(props) {
    super(props)
    this.state = {
      searchText: "",
      filteredActions: null,
      mobileSearchVisible: false,
      expandedItems: {},
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.activeRoutePath !== "null" && this.props.activeRoutePath !== prevProps.activeRoutePath) {
      this.fetchLocales()
      this.setState({ searchText: "" })
    }
  }

  getTopLevelMenuItems = (actionList) => {
    if (!actionList) return []
    const topLevelPaths = {}
    actionList.forEach((action) => {
      if (action.path) {
        const firstLevel = action.path.split(".")[0]
        if (!topLevelPaths[firstLevel]) {
          topLevelPaths[firstLevel] = {
            name: firstLevel,
            path: firstLevel,
            displayName: firstLevel,
            leftIcon: action.leftIcon ? action.leftIcon.split(".")[0] : null,
          }
        }
      }
    })
    return Object.values(topLevelPaths)
  }

  hasChildren = (path) => {
    return this.props.actionListArr.some(
      (action) => action.path && action.path.startsWith(path + ".") && action.path !== path
    )
  }

  getSubmenuItems = (path) => {
    const { actionListArr } = this.props
    if (!actionListArr) return []
    const submenuItems = []
    const pathPrefix = path + "."
    actionListArr.forEach((action) => {
      if (action.path && action.path.startsWith(pathPrefix)) {
        const remainingPath = action.path.substring(pathPrefix.length)
        const parts = remainingPath.split(".")
        if (parts.length === 1) {
          submenuItems.push({
            name: action.displayName,
            path: action.path,
            displayName: action.displayName,
            navigationURL: action.navigationURL,
            url: action.url,
            leftIcon: action.leftIcon,
          })
        } else if (parts.length > 1) {
          const firstPart = parts[0]
          const childPath = path + "." + firstPart
          if (!submenuItems.some((item) => item.path === childPath)) {
            submenuItems.push({
              name: firstPart,
              path: childPath,
              displayName: firstPart,
              leftIcon: action.leftIcon,
            })
          }
        }
      }
    })
    return submenuItems
  }

  fetchLocales = () => {
    const storedModuleList = getStoredModulesList() ? JSON.parse(getStoredModulesList()) : []
    if (!storedModuleList.includes(getModuleName())) {
      storedModuleList.push(getModuleName())
      setStoredModulesList(JSON.stringify(storedModuleList))
      setModule(getModuleName())
      const tenantId = getTenantId()
      this.props.fetchLocalizationLabel(getLocale(), tenantId, tenantId)
    }
  }

  handleChange = (e) => {
    const searchText = e.target.value
    this.setState({ searchText })
    if (searchText.length > 0) {
      const filtered = this.props.actionListArr.filter(
        (action) => action.displayName && action.displayName.toLowerCase().includes(searchText.toLowerCase())
      )
      this.setState({ filteredActions: filtered })
    } else {
      this.setState({ filteredActions: null })
    }
  }

  toggleMobileSearch = () => {
    this.setState((prevState) => ({
      mobileSearchVisible: !prevState.mobileSearchVisible,
      searchText: prevState.mobileSearchVisible ? "" : prevState.searchText,
      filteredActions: prevState.mobileSearchVisible ? null : prevState.filteredActions,
    }))
  }

  // Handles toggling for a multi-level accordion.
  handleToggleItem = (itemPath) => {
    this.setState((prevState) => {
      const currentExpanded = { ...prevState.expandedItems };
      const isCurrentlyExpanded = !!currentExpanded[itemPath];
      
      const pathParts = itemPath.split('.');

      // Case 1: The clicked item is currently expanded.
      // Action: Collapse this item and all its children.
      if (isCurrentlyExpanded) {
        const newExpanded = {};
        for (const key in currentExpanded) {
          // Keep an item only if its path does NOT start with the clicked item's path.
          if (!key.startsWith(itemPath)) {
            newExpanded[key] = true;
          }
        }
        return { expandedItems: newExpanded };
      }
      
      // Case 2: The clicked item is not expanded.
      // Action: Expand it, keeping ancestors open but closing siblings.
      else {
        const newExpanded = {};
        
        // If it's a top-level item, it becomes the only expanded item.
        if (pathParts.length === 1) {
          newExpanded[itemPath] = true;
        } 
        // If it's a sub-item:
        else {
          // Keep all ancestors of the clicked item expanded.
          // An ancestor's path is a prefix of the clicked item's path.
          for (const key in currentExpanded) {
            if (itemPath.startsWith(key)) {
              newExpanded[key] = true;
            }
          }
          // And, of course, expand the clicked item itself.
          newExpanded[itemPath] = true;
        }
        
        return { expandedItems: newExpanded };
      }
    });
  };

  renderLeftIcon(leftIcon, item) {
    if (!leftIcon) return null
    const iconParts = typeof leftIcon === "string" ? leftIcon.split(":") : []
    if (iconParts.length >= 2) {
      return (
        <Icon
          name={iconParts[1]}
          action={iconParts[0]}
          style={styles.fibreIconStyle}
          className={`iconClassHover left-icon-color material-icons custom-style-for-${item.name}`}
        />
      )
    }
    return null
  }

  renderAccordionItem = (item, level = 0) => {
    const { expandedItems } = this.state
    const isExpanded = !!expandedItems[item.path]
    const hasChildren = this.hasChildren(item.path)
    const itemStyle = { paddingLeft: `${15 + level * 20}px` }
    const label = item.displayName ? `ACTION_TEST_${item.displayName.toUpperCase().replace(/[.:-\s/]/g, "_")}` : ""

    if (item.navigationURL && item.navigationURL !== "newTab") {
      const url = item.navigationURL.startsWith("/") ? item.navigationURL : `/${item.navigationURL}`
      return (
        <li className="nav-item" key={item.path}>
          <Link
            className="nav-link"
            style={itemStyle}
            to={url}
            onClick={(e) => {
              if (item.navigationURL === "tradelicence/apply") this.props.setRequiredDocumentFlag()
              document.title = item.displayName || item.name
              if (item.navigationURL && item.navigationURL.includes("digit-ui")) {
                window.location.href = item.navigationURL
                e.preventDefault()
                return
              }
              this.props.updateActiveRoute(item.path, item.displayName || item.name)
              this.props.toggleDrawer && this.props.toggleDrawer()
            }}
          >
            {this.renderLeftIcon(item.leftIcon, item)}
            <Label label={label} />
          </Link>
        </li>
      )
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
              localStorageSet("menuPath", item.path)
              document.title = item.displayName || item.name
            }}
          >
            {this.renderLeftIcon(item.leftIcon, item)}
            <Label label={label} />
          </a>
        </li>
      )
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
              <Label label={label} />
              <span className={`menu-arrow ${isExpanded ? "expanded" : ""}`}>▶</span>
            </div>
          </li>
          {isExpanded && (
            <ul className="nav flex-column submenu-accordion" style={{ padding: 0, margin: 0, listStyle: "none" }}>
              {this.getSubmenuItems(item.path).map((subItem) => this.renderAccordionItem(subItem, level + 1))}
            </ul>
          )}
        </React.Fragment>
      )
    }

    return (
      <li className="nav-item" key={item.path}>
        <div className="nav-link disabled" style={itemStyle}>
          {this.renderLeftIcon(item.leftIcon, item)}
          <Label label={label} />
        </div>
      </li>
    )
  }

  renderSearchResults = () => {
    const { filteredActions, searchText } = this.state
    if (!filteredActions || searchText.length === 0) return null
    return (
      <div className="search-results-container">
        <ul className="nav flex-column">
          {filteredActions.map((action, index) => {
            if (action.navigationURL) {
              const url = action.navigationURL.startsWith("/") ? action.navigationURL : `/${action.navigationURL}`
              return (
                <li className="nav-item" key={index}>
                  <Link
                    className="nav-link"
                    to={url}
                    onClick={(e) => {
                      document.title = action.displayName
                      if (action.navigationURL && action.navigationURL.includes("digit-ui")) {
                        window.location.href = action.navigationURL
                        e.preventDefault()
                        return
                      }
                      this.props.updateActiveRoute(action.path, action.displayName)
                      this.props.toggleDrawer && this.props.toggleDrawer()
                    }}
                  >
                    {this.renderLeftIcon(action.leftIcon, action)}
                    <Label
                      label={
                        action.displayName
                          ? `ACTION_TEST_${action.displayName.toUpperCase().replace(/[.:-\s/]/g, "_")}`
                          : ""
                      }
                    />
                  </Link>
                </li>
              )
            }
            return null
          })}
        </ul>
      </div>
    )
  }

  render() {
    const { actionListArr } = this.props
    const { searchText, filteredActions, mobileSearchVisible } = this.state

    if (!actionListArr) return null

    const topLevelItems = this.getTopLevelMenuItems(actionListArr)

    return (
      <div className="sidebar card py-2 mb-4"  style={{overflow:'auto'}}>
        <div className="mobile-search-toggle" onClick={this.toggleMobileSearch}>
          <Icon name="search" />
        </div>

        {mobileSearchVisible && (
          <div className="mobile-search-container">
            <TextFieldIcon
              value={searchText}
              hintText={<Label label="PT_SEARCH_BUTTON" className="menuStyle" />}
              iconStyle={styles.inputIconStyle}
              inputStyle={{ ...styles.inputStyle, color: "black" }}
              textFieldStyle={styles.textFieldStyle}
              iconPosition="before"
              onChange={this.handleChange}
              autoFocus
            />
          </div>
        )}

        {!mobileSearchVisible && (
          <div
            className="menu-search-container"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 10 }}
          >
            <TextFieldIcon
              value={searchText}
              hintText={<Label label="PT_SEARCH_BUTTON" className="menuStyle" />}
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
              {topLevelItems.map((item) => this.renderAccordionItem(item, 0))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  changeRoute = (route) => {
    this.props.setRoute(route)
  }
}

const mapDispatchToProps = (dispatch) => ({
  handleToggle: (showMenu) => dispatch({ type: "MENU_TOGGLE", showMenu }),
  setRoute: (route) => dispatch({ type: "SET_ROUTE", route }),
  fetchLocalizationLabel: (locale, moduleName, tenantId) =>
    dispatch(fetchLocalizationLabel(locale, moduleName, tenantId)),
  setRequiredDocumentFlag: () => dispatch(prepareFinalObject("isRequiredDocuments", true)),
})

export default connect(null, mapDispatchToProps)(ActionMenuComp)