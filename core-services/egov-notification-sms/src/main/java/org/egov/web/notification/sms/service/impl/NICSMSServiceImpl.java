package org.egov.web.notification.sms.service.impl;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.annotation.PostConstruct;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;

import org.egov.web.notification.sms.config.SMSProperties;
import org.egov.web.notification.sms.models.Sms;
import org.egov.web.notification.sms.service.BaseSMSService;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@ConditionalOnProperty(value = "sms.provider.class", matchIfMissing = true, havingValue = "NIC")
public class NICSMSServiceImpl extends BaseSMSService {

	@Autowired
	private SMSProperties smsProperties;

	private SSLContext sslContext;

	@PostConstruct
	private void postConstruct() {
		log.info("postConstruct() start");
		try {
			sslContext = SSLContext.getInstance("TLSv1.2");
			if (smsProperties.isVerifyCertificate()) {
				log.info("checking certificate");
				/*
				 * KeyStore trustStore = KeyStore.getInstance(KeyStore.getDefaultType()); //File
				 * file = new File(System.getenv("JAVA_HOME")+"/lib/security/cacerts"); File
				 * file = ResourceUtils.getFile("classpath:smsgwsmsgovin.cer"); InputStream is =
				 * new FileInputStream(file); trustStore.load(is, "changeit".toCharArray());
				 * TrustManagerFactory trustFactory = TrustManagerFactory
				 * .getInstance(TrustManagerFactory.getDefaultAlgorithm());
				 * trustFactory.init(trustStore);
				 * 
				 * TrustManager[] trustManagers = trustFactory.getTrustManagers();
				 * sslContext.init(null, trustManagers, null);
				 */

				try (InputStream is = getClass().getClassLoader().getResourceAsStream("smsgwsmsgovin.cer")) {
					CertificateFactory certFactory = CertificateFactory.getInstance("X.509");
					X509Certificate caCert = (X509Certificate) certFactory.generateCertificate(is);

					KeyStore trustStore = KeyStore.getInstance(KeyStore.getDefaultType());
					trustStore.load(null);
					trustStore.setCertificateEntry("caCert", caCert);

					TrustManagerFactory trustFactory = TrustManagerFactory
							.getInstance(TrustManagerFactory.getDefaultAlgorithm());
					trustFactory.init(trustStore);

					TrustManager[] trustManagers = trustFactory.getTrustManagers();
					sslContext.init(null, trustManagers, null);
				} catch (KeyManagementException | IllegalStateException | CertificateException | KeyStoreException | IOException e) {
					log.error("Not able to load SMS certificate from the specified path {}", e.getMessage());
				}
			} else {
				log.info("not checking certificate");
				TrustManager tm = new X509TrustManager() {
					@Override
					public void checkClientTrusted(java.security.cert.X509Certificate[] chain, String authType)
							throws java.security.cert.CertificateException {
					}

					@Override
					public void checkServerTrusted(java.security.cert.X509Certificate[] chain, String authType)
							throws java.security.cert.CertificateException {
					}

					@Override
					public java.security.cert.X509Certificate[] getAcceptedIssuers() {
						return null;
					}
				};
				sslContext.init(null, new TrustManager[] { tm }, null);
			}
			SSLContext.setDefault(sslContext);

		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	protected void submitToExternalSmsService(Sms sms) {
	    log.info("submitToExternalSmsService() start");
	    try {
	        // === Prepare basic auth credentials ===
	        String username = smsProperties.getUsername();
	        String password = smsProperties.getPassword();
	        String auth = username + ":" + password;
	        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
	        String authHeaderValue = "Basic " + encodedAuth;

	        // === Build JSON Payload ===
	        String mobileNumber = "91" + sms.getMobileNumber();
	        String message = sms.getMessage();

	        // Extract OTP (assuming OTP is a 6-digit number within the message)
	        String otp = "";
	        Matcher matcher = Pattern.compile("\\b\\d{4,8}\\b").matcher(message);
	        if (matcher.find()) {
	            otp = matcher.group();
	        }

	        JSONObject recipient = new JSONObject();
	        recipient.put("mobiles", mobileNumber);
	        recipient.put("otp", otp);
	        recipient.put("app", "Double Accounting");
	        recipient.put("min", "3");

	        JSONObject payload = new JSONObject();
	        payload.put("recipients", new JSONArray().put(recipient));

	        log.info("SMS Request Payload: " + payload.toString());

	        // === Send POST Request ===
	        URL url = new URL(smsProperties.getUrl());
	        HttpsURLConnection conn = (HttpsURLConnection) url.openConnection();
	        conn.setSSLSocketFactory(sslContext.getSocketFactory());
	        conn.setRequestMethod("POST");
	        conn.setRequestProperty("Authorization", authHeaderValue);
	        conn.setRequestProperty("Content-Type", "application/json");
	        conn.setDoOutput(true);

	        try (OutputStream os = conn.getOutputStream()) {
	            byte[] input = payload.toString().getBytes(StandardCharsets.UTF_8);
	            os.write(input, 0, input.length);
	        }

	        int responseCode = conn.getResponseCode();
	        log.info("SMS API Response Code: " + responseCode);

	        BufferedReader br = new BufferedReader(new InputStreamReader(
	                responseCode >= 200 && responseCode < 300
	                        ? conn.getInputStream()
	                        : conn.getErrorStream()
	        ));

	        StringBuilder response = new StringBuilder();
	        String responseLine;
	        while ((responseLine = br.readLine()) != null) {
	            response.append(responseLine.trim());
	        }

	        log.info("SMS API Response: " + response.toString());

	        conn.disconnect();

	    } catch (Exception e) {
	        log.error("Error occurred while sending SMS to: " + sms.getMobileNumber(), e);
	    }
	}


	private boolean textIsInEnglish(String text) {
		ArrayList<Character.UnicodeBlock> english = new ArrayList<>();
		english.add(Character.UnicodeBlock.BASIC_LATIN);
		english.add(Character.UnicodeBlock.LATIN_1_SUPPLEMENT);
		english.add(Character.UnicodeBlock.LATIN_EXTENDED_A);
		english.add(Character.UnicodeBlock.GENERAL_PUNCTUATION);
		for (char currentChar : text.toCharArray()) {
			Character.UnicodeBlock unicodeBlock = Character.UnicodeBlock.of(currentChar);
			if (!english.contains(unicodeBlock)) {
				return false;
			}
		}
		return true;
	}

}