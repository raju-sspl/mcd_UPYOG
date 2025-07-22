package org.egov.web.controller;

import org.egov.domain.service.IngestionService;
import org.egov.web.contract.IngestionRequest;
import org.egov.web.contract.IngestionResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
public class IngestionController {

    private IngestionService ingestionService;

    public IngestionController(IngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    @PostMapping("v1/fetch")
    public ResponseEntity<IngestionResponse> pullData(@RequestBody IngestionRequest request) {
        Integer processedCount = ingestionService.pullTransactions(request);
        IngestionResponse response = IngestionResponse.builder()
                .tenantId(request.getIngestionRequestCriteria().getTenantId())
                .responseGeneratedAt(LocalDateTime.now())
                .totalCount(processedCount)
                .build();

        return ResponseEntity.ok(response);
    }
}

