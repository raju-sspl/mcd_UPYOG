package org.egov.web.contract;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import org.egov.common.contract.request.RequestInfo;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class IngestionRequest {
    private RequestInfo requestInfo;
    private IngestionRequestCriteria ingestionRequestCriteria;
}


