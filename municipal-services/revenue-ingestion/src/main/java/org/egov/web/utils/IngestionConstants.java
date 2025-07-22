package org.egov.web.utils;

public class IngestionConstants {

    //Constants For MDMS
    public static final String MODULE_NAME = "FinanceModule";
    public static final String ASSET_BusinessService = "Finance";
    public static final String ASSET_MODULE_CODE = "Finance";
    // mdms path codes
    public static final String MODULE_JSONPATH_CODE = "$.MdmsRes.FinanceModule";
    public static final String COMMON_MASTER_JSONPATH_CODE = "$.MdmsRes.common-masters";
    public static final String JSONPATH_TEMPLATE = "$.MdmsRes.%s.%s[?(@.serviceCode=='%s')]";

    public static final String COMMON_MASTERS_MODULE = "common-masters";
    public static final String NOTIFICATION_LOCALE = "en_IN";


    // mdms master names
    public static final String FINANCE_GL_CODE_MAPPING = "GLCodeMapping";

    // Asset Status
    public static final String STATUS_INITIATED = "INITIATED";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";
    public static final String STATUS_CANCELLED = "CANCELLED";

    public static final String INGESTION_TOPIC = "save-revenue-transactions";
    public static final String DATE_FORMAT = "dd-MM-yyyy HH:mm:ss";
}
