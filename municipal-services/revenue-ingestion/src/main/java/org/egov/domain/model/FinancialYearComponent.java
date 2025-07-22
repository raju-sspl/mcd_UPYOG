package org.egov.domain.model;

import javax.persistence.*;
import lombok.*;

import java.util.Map;

/**
 * Represents an individual revenue component in a financial year.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialYearComponent {

//    private Double tax;
//    private Double educationCess;
//    private Double penalty;
//    private Double interest;
//    private Double exemption;
//    private Double rebate;
//    private Double totalAmount;
//    private Double finalAmount;
//    private String rebateDescription;

//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    private String code;            // e.g., propertyTax, penalty, interest
//    private String name;            // Optional human-readable label
//    private Double amount;          // Component amount
//    private String description;     // Optional description or rebate reason

    private Map<String, Object> values;
}