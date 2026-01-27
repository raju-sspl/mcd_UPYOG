package org.egov.web.error;

import org.egov.web.contract.Error;
import org.egov.web.contract.ErrorField;
import org.egov.web.contract.ErrorResponse;
import org.springframework.http.HttpStatus;

import java.util.ArrayList;
import java.util.List;

public class OtpAlreadySentErrorAdapter implements ErrorAdapter<Void> {

    private static final String OTP_ALREADY_SENT_CODE = "OTP.ALREADY_SENT";
    private static final String OTP_ALREADY_SENT_MESSAGE = "OTP already sent. Please wait for 3 minutes.";
    private static final String OTP_ALREADY_SENT_FIELD = "otp.mobileNumber";
    private static final String MESSAGE = "OTP request failed due to previous OTP request";

    @Override
    public ErrorResponse adapt(Void model) {
        final Error error = getError();
        return new ErrorResponse(null, error);
    }

    // Modify the adapt method to be overloaded with no arguments
    public ErrorResponse adapt() {
        return adapt(null);  // You can delegate to the existing adapt method, passing null
    }

    private Error getError() {
        List<ErrorField> errorFields = getErrorFields();
        return Error.builder()
                .code(HttpStatus.BAD_REQUEST.value())  // 400 Bad Request
                .message(MESSAGE)
                .fields(errorFields)
                .build();
    }

    private List<ErrorField> getErrorFields() {
        List<ErrorField> errorFields = new ArrayList<>();
        final ErrorField otpAlreadySentErrorField = ErrorField.builder()
                .code(OTP_ALREADY_SENT_CODE)
                .message(OTP_ALREADY_SENT_MESSAGE)
                .field(OTP_ALREADY_SENT_FIELD)
                .build();
        errorFields.add(otpAlreadySentErrorField);
        return errorFields;
    }
}
