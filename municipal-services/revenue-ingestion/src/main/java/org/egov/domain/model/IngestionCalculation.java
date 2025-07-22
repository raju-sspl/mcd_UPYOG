package org.egov.domain.model;


import javax.persistence.*;
import lombok.*;
import java.util.List;

/**
 * Represents a single financial year object for a transaction.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IngestionCalculation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String financialYear;
    private String collectionPeriod;
    private String periodFrom;
    private String periodTo;
    private String propertyOwnershipType;
    private Double totalAmount;
    private Double finalAmount;

    private List<FinancialYearComponent> components;  // Financial year components
}
