package org.egov.web.adapter.error;



import org.egov.common.contract.response.Error;
import org.egov.common.contract.response.ErrorResponse;
import org.egov.domain.exception.InvalidIngestionRequestCriteriaException;
import org.springframework.stereotype.Component;

/**
 * Adapts InvalidIngestionRequestCriteriaException into a standard ErrorResponse.
 */
@Component
public class InvalidIngestionRequestErrorAdapter implements ErrorAdapter<InvalidIngestionRequestCriteriaException> {

    @Override
    public ErrorResponse adapt(InvalidIngestionRequestCriteriaException ex) {
        Error error = new Error();
        error.setCode(500);
        error.setMessage("Invalid ingestion request");
        error.setDescription(ex.getMessage());

        ErrorResponse response = new ErrorResponse();
        response.setResponseInfo(null); // Optional: Add ResponseInfo factory if needed
        response.setError(error);
        return response;
    }
}