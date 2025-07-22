package org.egov.web.utils;


import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.config.IngestionServiceConfig;
import org.egov.domain.model.IngestionTransaction;
import org.egov.repository.ServiceRequestRepository;
import org.egov.web.contract.IngestionRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class ThirdPartyIngestionClient {

    private final ServiceRequestRepository serviceRequestRepository;
    private final IngestionServiceConfig config;
    private final ObjectMapper objectMapper;

    @Autowired
    public ThirdPartyIngestionClient(ServiceRequestRepository serviceRequestRepository,
                                     IngestionServiceConfig config,
                                     ObjectMapper objectMapper) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.config = config;
        this.objectMapper = objectMapper;
    }

    /**
     * Calls NIC ingestion API and returns list of ingestion transactions
     */
    public List<IngestionTransaction> fetchTransactionsFromNIC(IngestionRequest request) {
        StringBuilder uri = new StringBuilder()
                .append(config.getTpNicHost())
                .append(config.getTpNicFetchEndpoint());

        Object response = serviceRequestRepository.fetchResult(uri, request);

        if (response == null) {
            log.warn("Received null response from NIC ingestion endpoint.");
            return Collections.emptyList();
        }

        Map<String, Object> responseMap = (Map<String, Object>) response;
        Object transactionData = responseMap.get("transactions");

        if (transactionData == null) {
            log.warn("NIC response does not contain 'transactions' key.");
            return Collections.emptyList();
        }

        try {
            return objectMapper.convertValue(transactionData, new TypeReference<List<IngestionTransaction>>() {});
        } catch (Exception e) {
            log.error("Failed to parse ingestion transactions from NIC response", e);
            return Collections.emptyList();
        }
    }
}