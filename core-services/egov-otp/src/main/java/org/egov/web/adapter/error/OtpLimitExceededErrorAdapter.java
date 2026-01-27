package org.egov.web.adapter.error;

import org.egov.common.contract.response.Error;
import org.egov.common.contract.response.ErrorField;
import org.egov.common.contract.response.ErrorResponse;
import org.springframework.http.HttpStatus;

import java.util.Collections;

public class OtpLimitExceededErrorAdapter {

    public ErrorResponse adapt() {

        ErrorField field = ErrorField.builder()
                .code("OTP_LIMIT_EXCEEDED")
                .message("You have exceeded OTP request limit. Please try again after 1 hour.")
                .field("mobileNumber")
                .build();

        Error error = Error.builder()
                .code(HttpStatus.TOO_MANY_REQUESTS.value()) // 429
                .message("OTP request limit exceeded")
                .fields(Collections.singletonList(field))
                .build();

        return new ErrorResponse(null, error);
    }
}
