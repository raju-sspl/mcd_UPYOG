package org.egov.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;
import org.egov.tracer.config.TracerConfiguration;
import org.egov.web.utils.IngestionConstants;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

import javax.annotation.PostConstruct;
import java.text.SimpleDateFormat;
import java.util.Locale;
import java.util.TimeZone;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Configuration
@Import({TracerConfiguration.class})
public class IngestionServiceConfig {

    @Value("${app.timezone}")
    private String timeZone;

    // MDMS Related Configurations
    @Value("${egov.mdms.host}")
    private String mdmsHost;

    @Value("${egov.mdms.search.endpoint}")
    private String mdmsEndPoint;

    // Persister Config
    @Value("${persister.save.revenue.topic}")
    private String saveRevenueIngestionTopic;

    @Value("${employee.allowed.search.params}")
    private String allowedEmployeeSearchParameters;

    @Value("${workflow.context.path}")
    private String wfHost;

    @Value("${workflow.transition.path}")
    private String wfTransitionPath;

    @Value("${workflow.businessservice.search.path}")
    private String wfBusinessServiceSearchPath;

    @Value("${workflow.process.path}")
    private String wfProcessPath;

    @Value("${tp.nic.host}")
    private String tpNicHost;

    @Value("${tp.nic.fetch.endpoint}")
    private String tpNicFetchEndpoint;


    @PostConstruct
    public void initialize() {
        TimeZone.setDefault(TimeZone.getTimeZone(timeZone));
    }


    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        objectMapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        objectMapper.setTimeZone(TimeZone.getTimeZone(timeZone));
        objectMapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        return objectMapper;
    }

    @Bean
    public MappingJackson2HttpMessageConverter jacksonConverter(ObjectMapper objectMapper) {
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setObjectMapper(objectMapper);
        objectMapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        objectMapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);
        objectMapper.setDateFormat(new SimpleDateFormat(IngestionConstants.DATE_FORMAT, Locale.ENGLISH));
        objectMapper.setTimeZone(TimeZone.getTimeZone(timeZone));
        return converter;
    }

}