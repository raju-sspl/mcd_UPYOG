package org.egov.web.utils;


import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.domain.model.GLCodeMapping;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class GLCodeMappingService {

    @Autowired
    private MdmsUtil mdmsUtil;

    private final Map<String, Map<String, GLCodeMapping>> cache = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public GLCodeMappingService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void loadMappings() {
        try {
            RequestInfo requestInfo = RequestInfo.builder().authToken("xyz").build();
            List<GLCodeMapping> glMappings = mdmsUtil.fetchGLCodeMapping("pg.mcd", "PTR", requestInfo);

            log.info("Loaded {} GL mappings from MDMS", objectMapper.writeValueAsString(glMappings));
            for (GLCodeMapping entry : glMappings) {
                String service = entry.getServiceCode();
                String component = entry.getComponentCode();

                cache
                        .computeIfAbsent(service, k -> new HashMap<>())
                        .put(component, entry);
            }

            log.info("Loaded {} GL mappings from MDMS", cache.size());

        } catch (Exception e) {
            log.error("Failed to load GL mappings from MDMS", e);
        }
    }

    public String getDebitGL(String serviceCode, String componentCode) {
        return Optional.ofNullable(cache.get(serviceCode))
                .map(map -> map.get(componentCode))
                .map(GLCodeMapping::getDebitGL)
                .orElse("4100000");
    }

    public String getCreditGL(String serviceCode, String componentCode) {
        return Optional.ofNullable(cache.get(serviceCode))
                .map(map -> map.get(componentCode))
                .map(GLCodeMapping::getCreditGL)
                .orElse("4201001");
    }

    public String getComponentName(String serviceCode, String componentCode) {
        return Optional.ofNullable(cache.get(serviceCode))
                .map(map -> map.get(componentCode))
                .map(GLCodeMapping::getComponentName)
                .orElse("UNKNOWN_COMPONENT");
    }
} // GLCodeMappingService
