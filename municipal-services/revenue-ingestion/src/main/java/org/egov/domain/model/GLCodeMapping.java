package org.egov.domain.model;

// File: org/egov/integration/model/mdms/GLCodeMapping.java

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GLCodeMapping {
    private String serviceCode;
    private String componentCode;
    private String componentName;
    private String debitGL;
    private String creditGL;
}