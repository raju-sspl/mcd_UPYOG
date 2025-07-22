package org.egov.web.contract;


import lombok.*;

import java.time.LocalDateTime;


/**
 * Standard response wrapper after pulling ingestion data.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IngestionResponse {
    private String tenantId;                      // For clarity
    private LocalDateTime responseGeneratedAt;    // For audit/timestamping
    private int totalCount;
}
