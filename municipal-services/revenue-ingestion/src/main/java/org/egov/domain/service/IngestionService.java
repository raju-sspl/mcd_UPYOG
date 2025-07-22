package org.egov.domain.service;


import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.config.IngestionServiceConfig;
import org.egov.domain.model.IngestionTransaction;
import org.egov.kafka.Producer;
import org.egov.repository.ServiceRequestRepository;
import org.egov.web.contract.IngestionPullResponse;
import org.egov.web.contract.IngestionRequest;
import org.egov.web.contract.IngestionRequestCriteria;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;


@Slf4j
@Service
public class IngestionService {

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private IngestionServiceConfig config;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private Producer producer;

    public Integer pullTransactions(IngestionRequest ingestionRequest) {
        IngestionRequestCriteria criteria = ingestionRequest.getIngestionRequestCriteria();
        criteria.validate();

        StringBuilder uri = new StringBuilder(config.getTpNicHost())
                .append(config.getTpNicFetchEndpoint());

        Object response = serviceRequestRepository.fetchResult(uri, ingestionRequest);
        IngestionPullResponse pullResponse = objectMapper.convertValue(response, IngestionPullResponse.class);

        if (pullResponse == null || pullResponse.getTransactions() == null) {
            return 0;
        }

        List<IngestionTransaction> transactions = pullResponse.getTransactions();
        log.info("Fetched Response from NIC total count is: {}", transactions.size());

        for (IngestionTransaction txn : transactions) {
            producer.push(config.getSaveRevenueIngestionTopic(), txn);
            log.info("Record Pushed: {}", txn.toString());
        }

        return transactions.size();
    }
}