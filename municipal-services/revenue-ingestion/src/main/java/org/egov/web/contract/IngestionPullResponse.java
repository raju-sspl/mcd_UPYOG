package org.egov.web.contract;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.domain.model.IngestionTransaction;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IngestionPullResponse {

    private String tenantId;                    // e.g., pg.citya
    private String date;                        // Response generation or pull date (e.g., yyyy-MM-dd)
    private Integer count;                      // Number of transactions returned
    private Long nextIdentifier;               // For pagination / next batch fetch
    private List<IngestionTransaction> transactions; // Actual payload list
}