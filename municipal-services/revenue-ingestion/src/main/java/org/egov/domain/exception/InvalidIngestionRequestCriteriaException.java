package org.egov.domain.exception;

/**
 * Custom exception thrown when ingestion request criteria is invalid.
 */
public class InvalidIngestionRequestCriteriaException extends RuntimeException {

    public InvalidIngestionRequestCriteriaException(String message) {
        super(message);
    }
} // All model classes
