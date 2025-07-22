package org.egov.web.adapter.error;
import org.egov.domain.exception.InvalidIngestionRequestCriteriaException;
import org.egov.common.contract.response.ErrorResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @Autowired
    private InvalidIngestionRequestErrorAdapter adapter;

    @ExceptionHandler(InvalidIngestionRequestCriteriaException.class)
    public ResponseEntity<ErrorResponse> handleInvalidIngestionException(
            InvalidIngestionRequestCriteriaException ex) {
        ErrorResponse errorResponse = adapter.adapt(ex);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
}