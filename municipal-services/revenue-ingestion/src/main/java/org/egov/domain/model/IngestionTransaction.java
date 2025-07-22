package org.egov.domain.model;


import lombok.*;


import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a single revenue transaction ingested from an external source (e.g., NIC).
 * It supports status tracking, voucher processing, and reconciliation.
 */
@Entity
@Table(name = "integration_transactions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"applicationTransactionId"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IngestionTransaction {

    @Id
    @GeneratedValue
    private UUID id;  // Primary key

    private String serviceName;              // e.g., PROPERTY_TAX
    private String serviceCode;              // e.g., PTR
    private String applicationTransactionId; // Unique transaction reference from source (e.g., NIC)

    private String tenantId;                 // e.g., pg.citya
    private String zoneCode;                 // Optional zone info
    private String department;               // e.g., DEPT_25
    private String narration;                // Voucher narration
    private Double orderAmount;              // Total order amount paid
    private String transactionStatus;        // e.g., SUCCESS, PENDING, FAILED
    private LocalDateTime transactionInitiatedOn; // Time transaction started
    private LocalDateTime transactionModifiedOn;  // Time of last update
    private String paymentAggregrator;       // e.g., HDFC, Razorpay

    @Lob
    @Column(columnDefinition = "jsonb")
    private String rawPayload;               // Full transaction details from source

    private String status;                   // RECEIVED, PROCESSED, FAILED
    private LocalDateTime createdAt;         // When inserted into DB
    private LocalDateTime processedAt;       // When voucher was processed
    private String voucherReference;         // Finance voucher reference
    private String errorMessage;             // In case of failure
    private int retryCount;                  // Retry attempts (default = 0)
}
