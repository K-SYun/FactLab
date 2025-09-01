package com.factlab.politics.service;

import com.factlab.politics.config.AssemblyApiConfig;
import com.factlab.politics.dto.AssemblyBillDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.JAXBException;
import jakarta.xml.bind.Unmarshaller;
import jakarta.xml.bind.annotation.*;
import java.io.StringReader;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssemblyApiService {
    
    private final AssemblyApiConfig apiConfig;
    private final WebClient.Builder webClientBuilder;
    
    /**
     * 공공데이터포털 국회 의안정보시스템 Open API에서 22대 국회의 모든 법안 목록을 가져옵니다
     */
    public List<AssemblyBillDto> fetchBillList(int pageNo, int numOfRows) {
        try {
            // 22대 국회의 모든 법안 가져오기 (Open API 페이지네이션으로 전체 수집)
            String url = UriComponentsBuilder.fromHttpUrl(apiConfig.getBillInfoUrl())
                    .queryParam("serviceKey", apiConfig.getKey())
                    .queryParam("pageNo", pageNo)
                    .queryParam("numOfRows", numOfRows) // Open API 페이지네이션 파라미터
                    .queryParam("age", "22") // 22대 국회 전체
                    .build()
                    .toString();
            
            log.info("공공데이터포털 22대 국회 의안정보 Open API 호출 (페이지: {}, 건수: {}건): {}", pageNo, numOfRows, url);
            
            WebClient webClient = webClientBuilder.build();
            String xmlResponse = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
            
            if (xmlResponse == null) {
                log.error("API 응답이 null입니다");
                return new ArrayList<>();
            }
            
            log.debug("API 응답: {}", xmlResponse);
            
            return parseXmlResponse(xmlResponse);
            
        } catch (Exception e) {
            log.error("공공데이터포털 국회 의안정보시스템 Open API 호출 실패: ", e);
            return new ArrayList<>();
        }
    }
    
    /**
     * XML 응답을 파싱하여 AssemblyBillDto 리스트로 변환
     */
    private List<AssemblyBillDto> parseXmlResponse(String xmlResponse) {
        try {
            JAXBContext context = JAXBContext.newInstance(BillResponse.class);
            Unmarshaller unmarshaller = context.createUnmarshaller();
            
            BillResponse response = (BillResponse) unmarshaller.unmarshal(new StringReader(xmlResponse));
            
            List<AssemblyBillDto> billList = new ArrayList<>();
            
            if (response.getBody() != null && response.getBody().getItems() != null) {
                for (BillItem item : response.getBody().getItems().getItemList()) {
                    AssemblyBillDto dto = new AssemblyBillDto();
                    dto.setBillId(item.getBillId());
                    dto.setBillNo(item.getBillNo());
                    dto.setBillName(item.getBillName());
                    dto.setCommittee(item.getCommittee());
                    dto.setProposer(item.getProposer());
                    dto.setProposerKind(item.getProposerKind());
                    
                    // 날짜 파싱
                    if (item.getProposeDt() != null) {
                        try {
                            dto.setProposeDt(LocalDate.parse(item.getProposeDt(), DateTimeFormatter.ofPattern("yyyy-MM-dd")));
                        } catch (Exception e) {
                            log.warn("날짜 파싱 실패: {}", item.getProposeDt());
                        }
                    }
                    
                    dto.setProcStage(item.getProcStage());
                    dto.setProcDt(item.getProcDt());
                    dto.setBillKind(item.getBillKind());
                    dto.setGbn(item.getGbn());
                    dto.setGeneralResult(item.getGeneralResult());
                    dto.setDetailLink(item.getDetailLink());
                    
                    billList.add(dto);
                }
            }
            
            log.info("Open API에서 파싱된 법안 수: {}", billList.size());
            return billList;
            
        } catch (JAXBException e) {
            log.error("Open API XML 응답 파싱 실패: ", e);
            return new ArrayList<>();
        }
    }
    
    // XML 응답 매핑을 위한 내부 클래스들
    @XmlRootElement(name = "response")
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class BillResponse {
        @XmlElement(name = "header")
        private Header header;
        
        @XmlElement(name = "body")
        private Body body;
        
        public Header getHeader() { return header; }
        public Body getBody() { return body; }
    }
    
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class Header {
        @XmlElement(name = "resultCode")
        private String resultCode;
        
        @XmlElement(name = "resultMsg")
        private String resultMsg;
        
        public String getResultCode() { return resultCode; }
        public String getResultMsg() { return resultMsg; }
    }
    
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class Body {
        @XmlElement(name = "items")
        private Items items;
        
        @XmlElement(name = "numOfRows")
        private int numOfRows;
        
        @XmlElement(name = "pageNo")
        private int pageNo;
        
        @XmlElement(name = "totalCount")
        private int totalCount;
        
        public Items getItems() { return items; }
        public List<BillItem> getItemList() { return items != null ? items.getItemList() : new ArrayList<>(); }
    }
    
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class Items {
        @XmlElement(name = "item")
        private List<BillItem> itemList;
        
        public List<BillItem> getItemList() { return itemList != null ? itemList : new ArrayList<>(); }
    }
    
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class BillItem {
        @XmlElement(name = "BILL_ID")
        private String billId;
        
        @XmlElement(name = "BILL_NO")
        private String billNo;
        
        @XmlElement(name = "BILL_NAME")
        private String billName;
        
        @XmlElement(name = "COMMITTEE")
        private String committee;
        
        @XmlElement(name = "PROPOSER")
        private String proposer;
        
        @XmlElement(name = "PROPOSER_KIND")
        private String proposerKind;
        
        @XmlElement(name = "PROPOSE_DT")
        private String proposeDt;
        
        @XmlElement(name = "PROC_STAGE")
        private String procStage;
        
        @XmlElement(name = "PROC_DT")
        private String procDt;
        
        @XmlElement(name = "BILL_KIND")
        private String billKind;
        
        @XmlElement(name = "GBN")
        private String gbn;
        
        @XmlElement(name = "GENERAL_RESULT")
        private String generalResult;
        
        @XmlElement(name = "DETAIL_LINK")
        private String detailLink;
        
        // Getters
        public String getBillId() { return billId; }
        public String getBillNo() { return billNo; }
        public String getBillName() { return billName; }
        public String getCommittee() { return committee; }
        public String getProposer() { return proposer; }
        public String getProposerKind() { return proposerKind; }
        public String getProposeDt() { return proposeDt; }
        public String getProcStage() { return procStage; }
        public String getProcDt() { return procDt; }
        public String getBillKind() { return billKind; }
        public String getGbn() { return gbn; }
        public String getGeneralResult() { return generalResult; }
        public String getDetailLink() { return detailLink; }
    }
}