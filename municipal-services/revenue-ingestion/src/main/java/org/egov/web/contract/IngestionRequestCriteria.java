package org.egov.web.contract;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import org.egov.domain.exception.InvalidIngestionRequestCriteriaException;
//import org.egov.domain.exception.InvalidIngestionRequestCriteriaException;

import static org.springframework.util.StringUtils.isEmpty;

@Getter
@AllArgsConstructor
@EqualsAndHashCode
public class IngestionRequestCriteria {

    private String uuid;
    private String tenantId;         // e.g., pg.citya — required for ULB scope
    private String serviceCode;      // e.g., PTR
    private String fromDate;
    private String toDate;
    private Long lastProcessedId;
    private Integer batchSize;       // Max records to pull

    public void validate() {
        if (isIdAbsent() || isTenantIdAbsent()) {
           throw new InvalidIngestionRequestCriteriaException(this.toString());
           // throw new IllegalArgumentException("IngestionRequestCriteria is required");
        }
    }

    public boolean isIdAbsent() {
        return isEmpty(uuid);
    }

    public boolean isTenantIdAbsent() {
        return isEmpty(tenantId);
    }

    public boolean isFromDate() {
        return isEmpty(fromDate);
    }

    public boolean isToDate() {
        return isEmpty(toDate);
    }

    @Override
    public String toString() {
        return "IngestionRequestCriteria{" +
                "uuid='" + uuid + '\'' +
                ", tenantId='" + tenantId + '\'' +
                ", serviceCode='" + serviceCode + '\'' +
                ", lastProcessedId=" + lastProcessedId +
                ", fromDate=" + fromDate +
                ", toDate=" + toDate +
                ", batchSize=" + batchSize +
                '}';
    }
}
