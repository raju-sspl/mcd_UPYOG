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
      path: "",
      menuItems: [],
      activeMenu: null, // Currently active top-level menu
      filteredActions: null,
      mobileSearchVisible: false,
      hoveredItems: {}, // Track hovered items at each level
      menuHistory: [], // History of menu navigation for breadcrumbs
      currentMenuItems: null, // Current menu items being displayed
      persistentMenuPath: null, // New state to track persistent menu
      lastNavigationPath: null, // Track last navigation path
    }
    this.menuContainerRef = React.createRef()
    this.hoverTimeouts = {} // For managing hover delays
  }

  componentDidMount() {
    this.initialMenuUpdate()
    document.addEventListener("mousedown", this.handleClickOutside)

    // Initialize menu structure
    const savedMenuPath = localStorageGet("persistentMenuPath")
        if (savedMenuPath && this.props.actionListArr) {
          this.restoreMenuState(savedMenuPath)
        } else if (this.props.actionListArr) {
          this.setState({
            currentMenuItems: this.getTopLevelMenuItems(this.props.actionListArr),
          })
        }
  }

   // Restore menu state from path
    restoreMenuState = (path) => {
      const pathParts = path.split('.')
      let currentPath = ''
      let menuHistory = []
      let currentItems = this.getTopLevelMenuItems(this.props.actionListArr)
      
      for (let i = 0; i < pathParts.length; i++) {
        currentPath = currentPath ? `${currentPath}.${pathParts[i]}` : pathParts[i]
        const menuItem = currentItems.find(item => item.path === currentPath)
        if (menuItem) {
          menuHistory.push(menuItem)
          currentItems = this.getSubmenuItems(currentPath)
        }
      }
  
      this.setState({
        persistentMenuPath: path,
        activeMenu: menuHistory[menuHistory.length - 1],
        menuHistory,
        currentMenuItems: currentItems,
      })
    }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside)
    // Clear any pending timeouts
    Object.values(this.hoverTimeouts).forEach((timeout) => clearTimeout(timeout))
  }

   handleClickOutside = (event) => {
    if (this.menuContainerRef.current && !this.menuContainerRef.current.contains(event.target)) {
      // Don't reset if we have a persistent menu
      if (!this.state.persistentMenuPath) {
        this.resetMenuState()
      } else {
        // Just clear hover states
        this.setState({ hoveredItems: {} })
      }
    }
  }

 resetMenuState = () => {
    // Only reset if we don't have a persistent menu
    if (!this.state.persistentMenuPath) {
      this.setState({
        activeMenu: null,
        hoveredItems: {},
        menuHistory: [],
        currentMenuItems: this.getTopLevelMenuItems(this.props.actionListArr),
      })
    }
  }

  // Get top-level menu items
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
            hasChildren: false, // Will be updated below
          }
        }
      }
    })

    // Check which top-level items have children
    Object.keys(topLevelPaths).forEach((key) => {
      const path = topLevelPaths[key].path
      topLevelPaths[key].hasChildren = actionList.some(
        (action) => action.path && action.path.startsWith(path + ".") && action.path !== path
      )
    })

    return Object.values(topLevelPaths)
  }

  // Check if a menu item has children
  hasChildren = (path) => {
    return this.props.actionListArr.some(
      (action) => action.path && action.path.startsWith(path + ".") && action.path !== path
    )
  }

  // Get submenu items for a given path
  getSubmenuItems = (path) => {
    const { actionListArr } = this.props
    if (!actionListArr) return []

    const submenuItems = []
    const pathPrefix = path + "."

    // Find direct children of this path
    actionListArr.forEach((action) => {
      if (action.path && action.path.startsWith(pathPrefix)) {
        const remainingPath = action.path.substring(pathPrefix.length)
        const parts = remainingPath.split(".")

        if (parts.length === 1) {
          // This is a direct child
          const hasChildren = actionListArr.some(
            (a) => a.path && a.path.startsWith(action.path + ".") && a.path !== action.path
          )

          submenuItems.push({
            name: action.displayName,
            path: action.path,
            displayName: action.displayName,
            navigationURL: action.navigationURL,
            url: action.url,
            leftIcon: action.leftIcon,
            hasChildren,
          })
        } else if (parts.length > 1) {
          // This is a grandchild or deeper, we need to create a submenu item
          const firstPart = parts[0]
          const childPath = path + "." + firstPart

          // Check if we already added this submenu
          if (!submenuItems.some((item) => item.path === childPath)) {
            submenuItems.push({
              name: firstPart,
              path: childPath,
              displayName: firstPart,
              leftIcon: action.leftIcon,
              hasChildren: true, // By definition, it has at least one child
            })
          }
        }
      }
    })

    return orderBy(submenuItems, (item) => item.name.toLowerCase())
  }

  fetchLocales = () => {
    var storedModuleList = []
    if (getStoredModulesList() !== null) {
      storedModuleList = JSON.parse(getStoredModulesList())
    }
    if (storedModuleList.includes(getModuleName()) === false) {
      storedModuleList.includes(getModuleName())
      var newList = JSON.stringify(storedModuleList)
      setStoredModulesList(newList)
      setModule(getModuleName())
      const tenantId = getTenantId()
      this.props.fetchLocalizationLabel(getLocale(), tenantId, tenantId)
    }
  }

  initialMenuUpdate() {
    let pathParam = {}
    const menuPath = fetchFromLocalStorage("menuPath")
    pathParam = {
      path: "",
      parentMenu: true,
    }
    const url = get(window, "location.pathname").split("/").pop()
    if (url !== "inbox" && menuPath) {
      const menupathArray = menuPath && menuPath.split(".")
      if (menupathArray && menupathArray.length > 1) {
        menupathArray.pop()
        pathParam = {
          path: menupathArray.join("."),
          parentMenu: false,
        }
      }
    }
    const { actionListArr } = this.props

    if (actionListArr) {
      this.menuChange(pathParam)
    }
  }

   componentWillReceiveProps(nextProps) {
    if (nextProps && nextProps.activeRoutePath !== "null" && nextProps.activeRoutePath != this.props.activeRoutePath) {
      this.fetchLocales()
      this.initialMenuUpdate()
      this.setState({
        searchText: "",
      })

      // Restore menu state if we have a persistent path
      if (this.state.persistentMenuPath && nextProps.actionListArr) {
        this.restoreMenuState(this.state.persistentMenuPath)
      }
    }

    if (nextProps && nextProps.actionListArr != this.props.actionListArr) {
      this.initialMenuUpdate()

      if (nextProps.actionListArr) {
        if (this.state.persistentMenuPath) {
          this.restoreMenuState(this.state.persistentMenuPath)
        } else {
          this.setState({
            currentMenuItems: this.getTopLevelMenuItems(nextProps.actionListArr),
          })
        }
      }
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

  // Handle mouse enter on menu item
  handleMenuItemMouseEnter = (item, level) => {
    // Clear any existing timeout for this level
    if (this.hoverTimeouts[level]) {
      clearTimeout(this.hoverTimeouts[level])
    }

    // Set a small delay to prevent flickering
    this.hoverTimeouts[level] = setTimeout(() => {
      const hoveredItems = { ...this.state.hoveredItems }

      // Clear hover state for deeper levels
      for (let i = level + 1; i < 10; i++) {
        delete hoveredItems[i]
      }

      hoveredItems[level] = item.path

      this.setState({ hoveredItems })
    }, 50)
  }

  // Handle mouse leave on menu item
  handleMenuItemMouseLeave = (level) => {
    // Clear any existing timeout for this level
    if (this.hoverTimeouts[level]) {
      clearTimeout(this.hoverTimeouts[level])
    }

    // Set a small delay before clearing hover state
    this.hoverTimeouts[level] = setTimeout(() => {
      const hoveredItems = { ...this.state.hoveredItems }
      delete hoveredItems[level]
      this.setState({ hoveredItems })
    }, 100)
  }

  // Handle click on first level menu item
  handleFirstLevelClick = (item) => {
    // If this item doesn't have children, treat it as a navigation item
    if (!item.hasChildren) {
      if (item.navigationURL) {
        // Handle navigation URL
        if (item.navigationURL === "tradelicence/apply") {
          this.props.setRequiredDocumentFlag()
        }

        const url = item.navigationURL.startsWith("/") ? item.navigationURL : `/${item.navigationURL}`
        document.title = item.displayName || item.name
        
        if (item.navigationURL.includes("digit-ui")) {
          window.location.href = item.navigationURL
          return
        } else {
          this.props.updateActiveRoute(item.path, item.displayName || item.name)
          this.props.toggleDrawer && this.props.toggleDrawer()
        }
      } else if (item.url) {
        // Handle external URL
        localStorageSet("menuPath", item.path)
        document.title = item.displayName || item.name
        window.open(item.url, "_blank")
      }
      return
    }

    // Get submenu items for this menu
    const submenuItems = this.getSubmenuItems(item.path)

   
    // Set persistent menu path for top-level menus
    if (item.path.split('.').length === 1) { // Only for top-level menus
      localStorageSet("persistentMenuPath", item.path)
      this.setState({ persistentMenuPath: item.path })
    }

    this.setState({
      activeMenu: item,
      currentMenuItems: submenuItems,
      menuHistory: [item],
      hoveredItems: {},
    })
  }

  // Handle click on submenu item
  handleSubmenuClick = (item) => {
    const { updateActiveRoute, toggleDrawer } = this.props

    // If this is a navigation item
      if (item.navigationURL && item.navigationURL !== "newTab") {
      // Save the current menu path before navigation
      if (this.state.persistentMenuPath) {
        localStorageSet("persistentMenuPath", this.state.persistentMenuPath)
      }

      document.title = item.displayName || item.name
      if (item.navigationURL && item.navigationURL.includes("digit-ui")) {
        window.location.href = item.navigationURL
        return
      } else {
        updateActiveRoute(item.path, item.displayName || item.name)
      }
      toggleDrawer && toggleDrawer()
      this.resetMenuState()

      if (window.location.href.indexOf(item.navigationURL) > 0 && item.navigationURL.startsWith("integration")) {
        window.location.reload()
      }

       if (!this.state.persistentMenuPath) {
        this.resetMenuState()
      } else {
        this.setState({ hoveredItems: {} })
      }

       this.setState({ lastNavigationPath: item.path })
    }
    // If this is an external link
    else if (item.url) {
      localStorageSet("menuPath", item.path)
      document.title = item.displayName || item.name
      window.open(item.url, "_blank")
    }
    // If this is a menu with children
    else if (item.hasChildren) {
      // Get submenu items for this menu
      const submenuItems = this.getSubmenuItems(item.path)

       if (this.state.persistentMenuPath && item.path.startsWith(this.state.persistentMenuPath)) {
              localStorageSet("persistentMenuPath", item.path)
              this.setState({ persistentMenuPath: item.path })
            }
      
            this.setState((prevState) => ({
              currentMenuItems: submenuItems,
              menuHistory: [...prevState.menuHistory, item],
              hoveredItems: {},
            }))
          }
  }

  // Navigate back to previous menu
  navigateBack = () => {
      this.setState((prevState) => {
        const menuHistory = [...prevState.menuHistory]
        menuHistory.pop()
  
        if (menuHistory.length === 0) {
          // Clear persistent state when going back to top level
          localStorageSet("persistentMenuPath", null)
          return {
            activeMenu: null,
            persistentMenuPath: null,
            menuHistory: [],
            currentMenuItems: this.getTopLevelMenuItems(this.props.actionListArr),
            hoveredItems: {},
          }
        } else {
          const previousMenu = menuHistory[menuHistory.length - 1]
          const submenuItems = this.getSubmenuItems(previousMenu.path)
  
          // Update persistent menu path if we're in a persistent menu
          if (this.state.persistentMenuPath) {
            const newPersistentPath = previousMenu.path
            localStorageSet("persistentMenuPath", newPersistentPath)
            return {
              activeMenu: previousMenu,
              persistentMenuPath: newPersistentPath,
              menuHistory,
              currentMenuItems: submenuItems,
              hoveredItems: {},
            }
          }
  
          return {
            activeMenu: previousMenu,
            menuHistory,
            currentMenuItems: submenuItems,
            hoveredItems: {},
          }
        }
      })
    }

  // Navigate to home/top level
navigateHome = () => {
    // Clear persistent menu when going home
    localStorageSet("persistentMenuPath", null)
    this.setState({
      activeMenu: null,
      persistentMenuPath: null,
      menuHistory: [],
      currentMenuItems: this.getTopLevelMenuItems(this.props.actionListArr),
      hoveredItems: {},
    })
  }
  renderBreadcrumbs = () => {
    const { menuHistory } = this.state
    if (menuHistory.length === 0) return null

    return (
      <div className="menu-breadcrumbs">
        {/* <button className="breadcrumb-home" onClick={this.navigateHome} title="Home">
          <Icon name="home" />
        </button> */}
        {menuHistory.map((item, index) => (
          <React.Fragment key={index}>
            <span className="breadcrumb-separator">/</span>
            <button
              className="breadcrumb-item"
              onClick={() => {
                if (index < menuHistory.length - 1) {
                  // Navigate to this breadcrumb level
                  const newHistory = menuHistory.slice(0, index + 1)
                  const currentItem = newHistory[newHistory.length - 1]
                  const submenuItems = this.getSubmenuItems(currentItem.path)

                  this.setState({
                    menuHistory: newHistory,
                    currentMenuItems: submenuItems,
                    hoveredItems: {},
                  })
                }
              }}
            >
              {item.displayName || item.name}
            </button>
          </React.Fragment>
        ))}
      </div>
    )
  }

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

  renderMenuItem = (item, index, level = 0) => {
    const { hoveredItems } = this.state
    const isHovered = hoveredItems[level] === item.path

    // For first level menu items
    if (level === 0) {
      return (
        <li className="nav-item" key={index}>
          <div
            className="nav-link"
            onClick={() => this.handleFirstLevelClick(item)}
            onMouseEnter={() => this.handleMenuItemMouseEnter(item, level)}
            onMouseLeave={() => this.handleMenuItemMouseLeave(level)}
          >
            {this.renderLeftIcon(item.leftIcon, item)}
            <Label
              label={item.displayName ? `ACTION_TEST_${item.displayName.toUpperCase().replace(/[.:-\s/]/g, "_")}` : ""}
            />
            {item.hasChildren && <span className="menu-arrow">▶</span>}
          </div>
        </li>
      )
    }

    // For submenu items
    const hasChildren = item.hasChildren

    // If this is a navigation URL
    if (item.navigationURL && item.navigationURL !== "newTab") {
      const url = item.navigationURL.startsWith("/") ? item.navigationURL : `/${item.navigationURL}`

      return (
        <li
          className="nav-item"
          key={index}
          onMouseEnter={() => this.handleMenuItemMouseEnter(item, level)}
          onMouseLeave={() => this.handleMenuItemMouseLeave(level)}
        >
          <Link
            className="nav-link"
            to={url}
            onClick={(e) => {
              if (item.navigationURL === "tradelicence/apply") {
                this.props.setRequiredDocumentFlag()
              }

              document.title = item.displayName || item.name
              if (item.navigationURL && item.navigationURL.includes("digit-ui")) {
                window.location.href = item.navigationURL
                e.preventDefault()
                return
              } else {
                this.props.updateActiveRoute(item.path, item.displayName || item.name)
              }
              this.props.toggleDrawer && this.props.toggleDrawer()
            }}
          >
            {this.renderLeftIcon(item.leftIcon, item)}
            <Label
              label={item.displayName ? `ACTION_TEST_${item.displayName.toUpperCase().replace(/[.:-\s/]/g, "_")}` : ""}
            />
          </Link>
        </li>
      )
    }
    // If this is an external URL
    else if (item.url) {
      return (
        <li
          className="nav-item"
          key={index}
          onMouseEnter={() => this.handleMenuItemMouseEnter(item, level)}
          onMouseLeave={() => this.handleMenuItemMouseLeave(level)}
        >
          <a
            className="nav-link"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              localStorageSet("menuPath", item.path)
              document.title = item.displayName || item.name
            }}
          >
            {this.renderLeftIcon(item.leftIcon, item)}
            <Label
              label={item.displayName ? `ACTION_TEST_${item.displayName.toUpperCase().replace(/[.:-\s/]/g, "_")}` : ""}
            />
          </a>
        </li>
      )
    }
    // If this is a menu with children
    else if (hasChildren) {
      return (
        <li
          className="nav-item"
          key={index}
          onMouseEnter={() => this.handleMenuItemMouseEnter(item, level)}
          onMouseLeave={() => this.handleMenuItemMouseLeave(level)}
        >
          <div 
            className="nav-link"
            // Only handle click for first level items, not for cascading submenus
            onClick={level === 0 ? () => this.handleSubmenuClick(item) : null}
          >
            {this.renderLeftIcon(item.leftIcon, item)}
            <Label
              label={item.displayName ? `ACTION_TEST_${item.displayName.toUpperCase().replace(/[.:-\s/]/g, "_")}` : ""}
            />
            <span className="menu-arrow">▶</span>
          </div>

          {/* Render cascading submenu on hover */}
          {isHovered && hasChildren && (
            <ul className="submenu hover-submenu">
              {this.getSubmenuItems(item.path).map((subItem, subIndex) =>
                this.renderMenuItem(subItem, subIndex, level + 1),
              )}
            </ul>
          )}
        </li>
      )
    }

    return null
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
                      } else {
                        this.props.updateActiveRoute(action.path, action.displayName)
                      }
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
    const { searchText, filteredActions, mobileSearchVisible, menuHistory, currentMenuItems, activeMenu } = this.state

    if (!actionListArr) return null

    return (
      <div className="sidebar card py-2 mb-4" ref={this.menuContainerRef}>
        {/* Mobile search toggle button */}
        <div className="mobile-search-toggle" onClick={this.toggleMobileSearch}>
          <Icon name="search" />
        </div>

        {/* Mobile search field */}
        {mobileSearchVisible && (
          <div className="mobile-search-container">
            <TextFieldIcon
              className="menu-label-style1"
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

        {/* Desktop search field */}
        {!activeMenu && !mobileSearchVisible && (
          <div
            className="menu-search-container"
            onClick={() => {
              this.props.toggleDrawer && this.props.toggleDrawer()
            }}
          >
            <TextFieldIcon
              className="menu-label-style1"
              value={searchText}
              hintText={<Label label="PT_SEARCH_BUTTON" className="menuStyle" />}
              iconStyle={styles.inputIconStyle}
              inputStyle={styles.inputStyle}
              textFieldStyle={styles.textFieldStyle}
              iconPosition="before"
              onChange={this.handleChange}
            />
          </div>
        )}

        {/* Breadcrumbs */}
        {/* {menuHistory.length > 0 && this.renderBreadcrumbs()} */}

        {/* Search results */}
        {filteredActions && this.renderSearchResults()}

        {/* Menu content */}
        {!filteredActions && (
          <React.Fragment>
            {/* Header with back button and title in one row */}
            {activeMenu && (
              <div className="menu-header">
                <button className="back-button" onClick={this.navigateBack}>
                  <Icon className="back-icon" name="arrow-back" action="navigation" />
                </button>
                <div className="menu-title">
                  <Label
                    className="menuStyle"
                    label={
                      activeMenu.displayName
                        ? `ACTION_TEST_${activeMenu.displayName.toUpperCase().replace(/[.:-\s/]/g, "_")}`
                        : ""
                    }
                  />
                </div>
              </div>
            )}

            {/* Menu items */}
            <ul className="nav flex-column main-menu">
              {currentMenuItems &&
                currentMenuItems.map((item, index) => this.renderMenuItem(item, index, menuHistory.length))}
            </ul>
          </React.Fragment>
        )}
      </div>
    )
  }

  changeLevel = (path) => {
    const { setRoute } = this.props

    if (!path) {
      const pathParam = {
        path: "",
        parentMenu: true,
      }
      this.menuChange(pathParam)
      setRoute("/")
    } else {
      const splitArray = split(path, ".")
      var x = splitArray.slice(0, splitArray.length - 1).join(".")
      if (x != "" && splitArray.length > 1) {
        const pathParam = {
          path: x,
          parentMenu: false,
        }
        this.menuChange(pathParam)
      } else {
        const pathParam = {
          path: "",
          parentMenu: true,
        }
        this.menuChange(pathParam)
      }
    }
  }

  changeRoute = (route) => {
    const { setRoute } = this.props
    setRoute(route)
  }

  menuChange = (pathParam) => {
    const path = pathParam.path
    const { actionListArr } = this.props
    const actionList = actionListArr
    const menuItems = []
    for (var i = 0; i < (actionList && actionList.length); i++) {
      if (actionList[i].path !== "") {
        if (path && !path.parentMenu && actionList[i].path.startsWith(path + ".")) {
          const splitArray = actionList[i].path.split(path + ".")[1].split(".")
          const leftIconArray = actionList[i].leftIcon.split(".")
          const leftIcon =
            leftIconArray &&
            (leftIconArray.length > path.split(".").length
              ? leftIconArray[path.split(".").length]
              : leftIconArray.length >= 1
                ? leftIconArray[leftIconArray.length - 1]
                : null)
          this.addMenuItems(path, splitArray, menuItems, i, leftIcon)
        } else if (pathParam && pathParam.parentMenu && actionList[i].navigationURL) {
          const splitArray = actionList[i].path.split(".")
          const leftIconArray = actionList[i].leftIcon.split(".")
          const leftIcon = leftIconArray && leftIconArray.length >= 1 ? leftIconArray[0] : null
          this.addMenuItems(path, splitArray, menuItems, i, leftIcon)
        }
      }
    }
  }

  addMenuItems = (path, splitArray, menuItems, index, leftIcon) => {
    const { actionListArr } = this.props
    const actionList = actionListArr
    if (splitArray.length > 1) {
      if (!some(menuItems, { name: splitArray[0] })) {
        menuItems.push({
          path: path != "" ? path + "." + splitArray[0] : "",
          name: splitArray[0],
          url: "",
          queryParams: actionList[index].queryParams,
          orderNumber: actionList[index].orderNumber,
          navigationURL: actionList[index].navigationURL,
          leftIcon,
        })
      }
    } else {
      menuItems.push({
        path: path != "" ? path + "." + splitArray[0] : "",
        name: actionList[index].displayName,
        url: actionList[index].url,
        queryParams: actionList[index].queryParams,
        orderNumber: actionList[index].orderNumber,
        navigationURL: actionList[index].navigationURL,
        leftIcon,
      })
    }
    menuItems = orderBy(menuItems, ["orderNumber"], ["asc"])
    this.setState({
      menuItems,
      path,
    })
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