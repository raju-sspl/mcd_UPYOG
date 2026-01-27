package org.egov.web.adapter.error;

import org.egov.common.contract.response.Error;
import org.egov.common.contract.response.ErrorField;
import org.egov.common.contract.response.ErrorResponse;
import org.springframework.http.HttpStatus;

import java.util.Collections;

public class OtpAlreadySentErrorAdapter {

    public ErrorResponse adapt() {

        ErrorField field = ErrorField.builder()
                .code("OTP_ALREADY_SENT")
                .message("OTP already sent. Please wait for 3 minutes.")
                .field("mobileNumber")
                .build();

        Error error = Error.builder()
                .code(HttpStatus.BAD_REQUEST.value()) // 400
                .message("OTP request blocked")
                .fields(Collections.singletonList(field))
                .build();

        return new ErrorResponse(null, error);
    }
}
