package com.factlab.politics.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssemblyBillDto {
    
    private String billId;           // 의안ID
    private String billNo;           // 의안번호
    private String billName;         // 의안명
    private String committee;        // 소관위원회
    private String proposer;         // 제안자
    private String proposerKind;     // 제안자구분
    private LocalDate proposeDt;     // 제안일자
    private String procStage;        // 처리상태
    private String procDt;           // 처리일자
    private String billKind;         // 의안종류
    private String gbn;              // 제안구분
    private String generalResult;    // 심사결과
    private String detailLink;       // 상세링크
    
    // XML 응답에서 사용되는 실제 필드명과 매핑
    private String BILL_ID;          // 의안ID
    private String BILL_NO;          // 의안번호  
    private String BILL_NAME;        // 의안명
    private String COMMITTEE;        // 소관위원회
    private String PROPOSER;         // 제안자
    private String PROPOSER_KIND;    // 제안자구분
    private String PROPOSE_DT;       // 제안일자
    private String PROC_STAGE;       // 처리상태
    private String PROC_DT;          // 처리일자
    private String BILL_KIND;        // 의안종류
    private String GBN;              // 제안구분
    private String GENERAL_RESULT;   // 심사결과
    private String DETAIL_LINK;      // 상세링크
}