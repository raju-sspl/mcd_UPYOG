package org.egov.persistence.repository;

import lombok.extern.slf4j.Slf4j;
import org.egov.domain.exception.OtpNumberNotPresentException;
import org.egov.domain.model.OtpRequest;
import org.egov.persistence.contract.OtpResponse;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class OtpRepository {

	private final String otpCreateUrl;
	private RestTemplate restTemplate;

	public OtpRepository(RestTemplate restTemplate,
			@Value("${otp.host}") String otpHost,
			@Value("${otp.create.url}") String otpCreateUrl) {
		this.restTemplate = restTemplate;
		this.otpCreateUrl = otpHost + otpCreateUrl;
	}

//    public String fetchOtp(OtpRequest otpRequest) {
//        final org.egov.persistence.contract.OtpRequest request =
//                new org.egov.persistence.contract.OtpRequest(otpRequest);
//        try {
//            final OtpResponse otpResponse =
//                    restTemplate.postForObject(otpCreateUrl, request, OtpResponse.class);
//            if (isOtpNumberAbsent(otpResponse)) {
//                throw new OtpNumberNotPresentException();
//            }
//            return otpResponse.getOtpNumber();
//        } catch (Exception e) {
//            log.error("Exception while fetching OTP: ", e);
//            throw new OtpNumberNotPresentException();
//        }
//    }

	public String fetchOtp(OtpRequest otpRequest) {

	    final org.egov.persistence.contract.OtpRequest request =
	            new org.egov.persistence.contract.OtpRequest(otpRequest);

	    try {
	        OtpResponse otpResponse =
	                restTemplate.postForObject(otpCreateUrl, request, OtpResponse.class);

	        if (isOtpNumberAbsent(otpResponse)) {
	            throw new OtpNumberNotPresentException();
	        }

	        return otpResponse.getOtpNumber();

	    } catch (HttpClientErrorException.BadRequest ex) {

	        // Expected business rejection from egov-otp
	        log.warn("OTP request rejected by OTP service");

	        String responseBody = ex.getResponseBodyAsString();

	        // Defaults (safe fallback)
	        String errorCode = "OTP_ALREADY_SENT";
	        String errorMessage = "OTP already sent. Please wait for 3 minutes.";

	        // Detect actual business error returned by egov-otp
	        if (responseBody != null && responseBody.contains("OTP_LIMIT_EXCEEDED")) {
	            errorCode = "OTP_LIMIT_EXCEEDED";
	            errorMessage =
	                    "You have exceeded OTP request limit. Please try again after 1 hour.";
	        }

	        throw new CustomException(errorCode, errorMessage);

	    } catch (Exception ex) {

	        // Genuine system failure
	        log.error("Unexpected error while fetching OTP", ex);
	        throw new OtpNumberNotPresentException();
	    }
	}

	private boolean isOtpNumberAbsent(OtpResponse otpResponse) {
		return otpResponse == null || otpResponse.isOtpNumberAbsent();
	}
}
