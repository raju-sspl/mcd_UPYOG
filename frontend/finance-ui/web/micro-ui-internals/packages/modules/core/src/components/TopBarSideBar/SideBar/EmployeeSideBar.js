import React, { useRef, useEffect, useState } from "react";
import { Loader, SearchIcon } from "@mcd89/finance-ui-react-components";
import { useTranslation } from "react-i18next";
import Sidebar from "./SideBar";


const checkMatch = (path = "", searchCriteria = "") => path.toLowerCase().includes(searchCriteria.toLowerCase());


const EmployeeSideBar = () => {
 const sidebarRef = useRef(null);
 const { isLoading, data } = Digit.Hooks.useAccessControl();
 const [search, setSearch] = useState("");
 const { t } = useTranslation();
 const [subNav, setSubNav] = useState(false);


 useEffect(() => {
   if (isLoading) {
     return <Loader />;
   }
   sidebarRef.current.style.cursor = "pointer";
   collapseNav();
 }, [isLoading]);


 const expandNav = () => {
   sidebarRef.current.style.width = "260px";
   setSubNav(true);
 };


 const collapseNav = () => {
   sidebarRef.current.style.width = "60px";
   sidebarRef.current.style.overflow = "hidden";
   setSubNav(false);
 };


 function mergeObjects(obj1, obj2) {
   for (const key in obj2) {
     if (obj2.hasOwnProperty(key)) {
       if (typeof obj2[key] === "object" && !Array.isArray(obj2[key])) {
         if (!obj1[key]) {
           obj1[key] = {};
         }
         if (obj2[key].item) {
           // If it's a leaf node with an item, merge with existing or create new
           if (!obj1[key].item) {
             obj1[key] = obj2[key];
           }
         } else {
           // For non-leaf nodes, recursively merge
           mergeObjects(obj1[key], obj2[key]);
         }
       } else if (!obj1[key]) {
         obj1[key] = obj2[key];
       }
     }
   }
 }


 const configEmployeeSideBar = {};
 data?.actions
   ?.filter((e) => e.url === "url")
   ?.forEach((item) => {
     let index = item?.path?.split(".")?.[0] || "";
     if (search === "" && item.path !== "") {
       const keys = item.path.split(".");
       let hierarchicalMap = {};
       let current = hierarchicalMap;


       // Build nested structure
       for (let i = 0; i < keys.length; i++) {
         const key = keys[i];
         if (i === keys.length - 1) {
           // Last key - set the item
           current[key] = { item };
         } else {
           // Create nested object if it doesn't exist
           if (!current[key]) {
             current[key] = {};
           }
           current = current[key];
         }
       }


       mergeObjects(configEmployeeSideBar, hierarchicalMap);
     } else if (
       checkMatch(t(`ACTION_TEST_${index?.toUpperCase()?.replace(/[ -]/g, "_")}`), search) ||
       checkMatch(t(Digit.Utils.locale.getTransformedLocale(`ACTION_TEST_${item?.displayName}`)), search)
     ) {
       const keys = item.path.split(".");
       let hierarchicalMap = {};
       let current = hierarchicalMap;


       // Build nested structure for search results
       for (let i = 0; i < keys.length; i++) {
         const key = keys[i];
         if (i === keys.length - 1) {
           current[key] = { item };
         } else {
           if (!current[key]) {
             current[key] = {};
           }
           current = current[key];
         }
       }


       mergeObjects(configEmployeeSideBar, hierarchicalMap);
     }
   });


 const splitKeyValue = (configEmployeeSideBar) => {
   const objectArray = Object.entries(configEmployeeSideBar);
   console.log("Before sorting: ", configEmployeeSideBar);


   // Sort alphabetically
   objectArray.sort((a, b) => {
     if (a[0] < b[0]) { return -1; }
     if (a[0] > b[0]) { return 1; }
     return 0;
   });


   const sortedObject = Object.fromEntries(objectArray);
   console.log("After sorting: ", sortedObject);


   return <Sidebar data={sortedObject} />;
 };


 if (isLoading) {
   return <Loader />;
 }


 if (!configEmployeeSideBar || Object.keys(configEmployeeSideBar).length === 0) {
   return "";
 }


 const renderSearch = () => {
   return (
     <div className="">
       <div className="sidebar-link">
         {subNav ? (
           <div className="actions search-icon-wrapper">
             <input
               className="employee-search-input nav-bar"
               type="text"
               placeholder={t(`ACTION_TEST_SEARCH`)}
               name="search"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
             <SearchIcon className="search-icon" />
           </div>
         ) : (
           <div className="actions search-icon-wrapper-new">
             <SearchIcon className="search-icon" />
           </div>
         )}
       </div>
     </div>
   );
 };


 return (
   <div className="sidebar" ref={sidebarRef} onMouseOver={expandNav} onMouseLeave={collapseNav}>
     {renderSearch()}
     {splitKeyValue(configEmployeeSideBar)}
   </div>
 );
};


export default EmployeeSideBar;