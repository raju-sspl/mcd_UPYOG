package org.egov.web.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.config.IngestionServiceConfig;
import org.egov.domain.model.GLCodeMapping;
import org.egov.mdms.model.MasterDetail;
import org.egov.mdms.model.MdmsCriteria;
import org.egov.mdms.model.MdmsCriteriaReq;
import org.egov.mdms.model.ModuleDetail;
import org.egov.repository.ServiceRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
public class MdmsUtil {


    private final IngestionServiceConfig config;

    @Autowired
    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public MdmsUtil(IngestionServiceConfig config,
                    ServiceRequestRepository serviceRequestRepository,
                    ObjectMapper objectMapper) {
        this.config = config;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
    }


    public List<GLCodeMapping> fetchGLCodeMapping(String tenantId, String serviceCode, RequestInfo requestInfo) throws JsonProcessingException {

        log.info("Fetching GLCodeMapping from MDMS response for tenant: {}", tenantId);

        MasterDetail masterDetail = MasterDetail.builder()
                .name(IngestionConstants.FINANCE_GL_CODE_MAPPING)
                .build();

        ModuleDetail moduleDetail = ModuleDetail.builder()
                .moduleName(IngestionConstants.MODULE_NAME)
                .masterDetails(Collections.singletonList(masterDetail))
                .build();

        MdmsCriteria mdmsCriteria = MdmsCriteria.builder()
                //.tenantId(tenantId.contains(".") ? tenantId.split("\\.")[0] : tenantId)
                .tenantId(tenantId)
                .moduleDetails(Collections.singletonList(moduleDetail))
                .build();

        MdmsCriteriaReq mdmsRequest = MdmsCriteriaReq.builder()
                .mdmsCriteria(mdmsCriteria)
                .requestInfo(requestInfo)
                .build();

        Object response = serviceRequestRepository.fetchResult(getMdmsSearchUrl(), mdmsRequest);
        log.info("Raw MDMS Response: {}", objectMapper.writeValueAsString(response));
        try {
            String jsonPath = String.format(
                    IngestionConstants.JSONPATH_TEMPLATE,
                    IngestionConstants.MODULE_NAME,
                    IngestionConstants.FINANCE_GL_CODE_MAPPING,
                    serviceCode
            );

            List<Map<String, Object>> result = JsonPath.read(response, jsonPath);

            return result.stream()
                    .map(map -> objectMapper.convertValue(map, GLCodeMapping.class))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error parsing GLCodeMapping from MDMS response", e);
            return Collections.emptyList();
        }
    }

    /**
     * makes mdms call with the given criteria and reutrn mdms data
     *
     * @param requestInfo
     * @param tenantId
     * @return
     */
    public Object mDMSCall(RequestInfo requestInfo, String tenantId) {
        MdmsCriteriaReq mdmsCriteriaReq = getMDMSRequest(requestInfo, tenantId);
        Object result = serviceRequestRepository.fetchResult(getMdmsSearchUrl(), mdmsCriteriaReq);
        return result;
    }


    /**
     * Returns the URL for MDMS search end point
     *
     * @return URL for MDMS search end point
     */
    public StringBuilder getMdmsSearchUrl() {
        return new StringBuilder().append(config.getMdmsHost()).append(config.getMdmsEndPoint());
    }

    /**
     * prepares the mdms request object
     *
     * @param requestInfo
     * @param tenantId
     * @return
     */
    public MdmsCriteriaReq getMDMSRequest(RequestInfo requestInfo, String tenantId) {
        List<ModuleDetail> moduleRequest = getModuleRequest();

        List<ModuleDetail> moduleDetails = new LinkedList<>();
        moduleDetails.addAll(moduleRequest);

        MdmsCriteria mdmsCriteria = MdmsCriteria.builder().moduleDetails(moduleDetails).tenantId(tenantId).build();

        MdmsCriteriaReq mdmsCriteriaReq = MdmsCriteriaReq.builder().mdmsCriteria(mdmsCriteria).requestInfo(requestInfo)
                .build();
        return mdmsCriteriaReq;
    }

    /**
     * Creates request to search ApplicationType and etc from MDMS
     *
     * @return request to search ApplicationType and etc from MDMS
     */
    public List<ModuleDetail> getModuleRequest() {

        // master details for BPA module
        List<MasterDetail> assetMasterDtls = new ArrayList<>();

        // filter to only get code field from master data
        final String filterCode = "$.[?(@.active==true)].code";

        assetMasterDtls.add(MasterDetail.builder().name(IngestionConstants.FINANCE_GL_CODE_MAPPING).filter(filterCode).build());
        ModuleDetail bpaModuleDtls = ModuleDetail.builder().masterDetails(assetMasterDtls)
                .moduleName(IngestionConstants.MODULE_NAME).build();

        return Collections.singletonList(bpaModuleDtls);

    }

}