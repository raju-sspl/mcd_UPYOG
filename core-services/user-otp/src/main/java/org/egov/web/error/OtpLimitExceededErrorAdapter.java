package org.egov.web.error;

import org.egov.web.contract.Error;
import org.egov.web.contract.ErrorField;
import org.egov.web.contract.ErrorResponse;
import org.springframework.http.HttpStatus;

import java.util.ArrayList;
import java.util.List;

public class OtpLimitExceededErrorAdapter implements ErrorAdapter<Void> {

    private static final String OTP_LIMIT_EXCEEDED_CODE = "OTP_LIMIT_EXCEEDED";
    private static final String OTP_LIMIT_EXCEEDED_MESSAGE =
            "You have exceeded OTP request limit. Please try again after 1 hour.";
    private static final String OTP_LIMIT_EXCEEDED_FIELD = "otp.mobileNumber";
    private static final String MESSAGE = "OTP request limit exceeded";

    @Override
    public ErrorResponse adapt(Void model) {
        final Error error = getError();
        return new ErrorResponse(null, error);
    }

    public ErrorResponse adapt() {
        return adapt(null);
    }

    private Error getError() {
        List<ErrorField> errorFields = getErrorFields();
        return Error.builder()
                .code(HttpStatus.TOO_MANY_REQUESTS.value()) // 429
                .message(MESSAGE)
                .fields(errorFields)
                .build();
    }

    private List<ErrorField> getErrorFields() {
        List<ErrorField> errorFields = new ArrayList<>();

        ErrorField field = ErrorField.builder()
                .code(OTP_LIMIT_EXCEEDED_CODE)
                .message(OTP_LIMIT_EXCEEDED_MESSAGE)
                .field(OTP_LIMIT_EXCEEDED_FIELD)
                .build();

        errorFields.add(field);
        return errorFields;
    }
}
