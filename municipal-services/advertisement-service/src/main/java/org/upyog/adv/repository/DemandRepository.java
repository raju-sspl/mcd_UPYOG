package org.upyog.adv.repository;

import java.util.List;

import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.upyog.adv.config.BookingConfiguration;
import org.upyog.adv.web.models.billing.Demand;
import org.upyog.adv.web.models.billing.DemandRequest;
import org.upyog.adv.web.models.billing.DemandResponse;

import com.fasterxml.jackson.databind.ObjectMapper;

@Repository
public class DemandRepository {

	@Autowired
	private ServiceRequestRepository serviceRequestRepository;

	@Autowired
	private BookingConfiguration config;

	@Autowired
	private ObjectMapper mapper;

	/**
	 * Creates demand
	 * 
	 * @param requestInfo The RequestInfo of the calculation Request
	 * @param demands     The demands to be created
	 * @return The list of demand created
	 */
	public List<Demand> saveDemand(RequestInfo requestInfo, List<Demand> demand) {
		StringBuilder url = new StringBuilder(config.getBillingHost());
		url.append(config.getDemandCreateEndpoint());
		DemandRequest request = new DemandRequest(requestInfo, demand);
		System.out.println("Request object for fetchResult: " + request);
		System.out.println("URL for fetchResult: " + url);
		Object result = serviceRequestRepository.fetchResult(url, request);
		System.out.println("Result from fetchResult method: " + result);
		DemandResponse response = null;
		try {
			response = mapper.convertValue(result, DemandResponse.class);
			System.out.println("Demand response mapper: " + response);
		} catch (IllegalArgumentException e) {
			throw new CustomException("PARSING ERROR", "Failed to parse response of create demand");
		}
		return response.getDemands();
	}

	/**
	 * Updates the demand
	 * 
	 * @param requestInfo The RequestInfo of the calculation Request
	 * @param demands     The demands to be updated
	 * @return The list of demand updated
	 */
	public List<Demand> updateDemand(RequestInfo requestInfo, List<Demand> demands) {
		StringBuilder url = new StringBuilder(config.getBillingHost());
		url.append(config.getDemandUpdateEndpoint());
		DemandRequest request = new DemandRequest(requestInfo, demands);
		Object result = serviceRequestRepository.fetchResult(url, request);
		DemandResponse response = null;
		try {
			response = mapper.convertValue(result, DemandResponse.class);
		} catch (IllegalArgumentException e) {
			throw new CustomException("PARSING ERROR", "Failed to parse response of update demand");
		}
		return response.getDemands();

	}

}
