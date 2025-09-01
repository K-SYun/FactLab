# FactLab AI 분석 워크플로우

## 📋 전체 워크플로우 개요

```
1. 뉴스 크롤링 → 2. AI 분석 → 3. 관리자 검토 → 4. 승인/거부 → 5. 사용자 노출
   (PENDING)     (PROCESSING)   (REVIEW_PENDING)   (APPROVED/REJECTED)
```

## 🔄 상세 워크플로우

### 1단계: 뉴스 수집 (PENDING)
- **역할**: Crawler AI Service
- **동작**: Naver/Daum 뉴스 RSS 수집
- **상태**: `PENDING`
- **주기**: 3시간마다 자동 실행 (06:00-24:00)

```bash
POST /crawler/crawl/news?category=politics
POST /crawler/crawl/all  # 전체 카테고리
```

### 2단계: AI 분석 (PROCESSING → REVIEW_PENDING)
- **역할**: Crawler AI Service + Backend API
- **동작**: 
  1. OpenAI API로 뉴스 요약/분석
  2. 키워드 추출 및 신뢰도 점수 계산
  3. 분석 완료 후 Backend API 콜백 호출
- **상태 변화**: `PENDING` → `PROCESSING` → `REVIEW_PENDING`

```bash
# AI 분석 실행
POST /crawler/ai/analyze
Content: title=뉴스제목&content=뉴스내용&news_id=123

# 자동 콜백 (내부 호출)
POST /api/news/123/analysis-complete
```

### 3단계: 관리자 검토 (REVIEW_PENDING)
- **역할**: Admin Service + Backend API
- **동작**: 관리자가 AI 분석 결과 검토 후 승인/거부 결정
- **상태**: `REVIEW_PENDING` (검토 대기)

```bash
# 검토 대기 뉴스 목록
GET /api/admin/news/review-pending?page=0&size=20

# 통계 확인
GET /api/admin/news/statistics
```

### 4단계: 승인/거부 처리 (APPROVED/REJECTED)
- **역할**: Admin Service + Backend API  
- **동작**: 관리자 결정에 따른 최종 상태 업데이트
- **상태 변화**: `REVIEW_PENDING` → `APPROVED` 또는 `REJECTED`

```bash
# 개별 승인/거부
POST /api/news/123/approve
POST /api/news/123/reject

# 일괄 승인/거부  
POST /api/news/bulk/approve
POST /api/news/bulk/reject
```

### 5단계: 사용자 노출 (APPROVED)
- **역할**: User Service + Backend API
- **동작**: 승인된 뉴스만 사용자에게 노출
- **상태**: `APPROVED`

```bash
# 승인된 뉴스만 조회
GET /api/news/approved?category=정치&page=0&size=20
```

## 🏷️ 뉴스 상태 정의

| 상태 | 설명 | 다음 단계 |
|------|------|-----------|
| `PENDING` | 크롤링 완료, AI 분석 대기 | PROCESSING |
| `PROCESSING` | AI 분석 진행 중 | REVIEW_PENDING |
| `REVIEW_PENDING` | AI 분석 완료, 관리자 검토 대기 | APPROVED/REJECTED |
| `APPROVED` | 관리자 승인 완료, 사용자 노출 | - |
| `REJECTED` | 관리자 거부, 비노출 | - |

## 🔧 관리자 액션

### 검토 대기 뉴스 확인
```bash
GET /api/admin/news/review-pending
# Response: AI 분석이 완료된 뉴스 목록 (우선순위 높음)
```

### 뉴스 승인
```bash
POST /api/news/{newsId}/approve
# 뉴스를 승인하여 사용자에게 노출
```

### 뉴스 거부
```bash
POST /api/news/{newsId}/reject
# 뉴스를 거부하여 비노출 처리
```

### 일괄 처리
```bash
POST /api/news/bulk/approve
Body: {"newsIds": [1, 2, 3, 4, 5]}

POST /api/news/pending/approve-all
# 모든 대기 중인 뉴스 일괄 승인
```

## 📊 관리자 대시보드 데이터

### 뉴스 통계
```json
{
  "total": 1500,
  "pending": 50,           // 크롤링 완료, AI 분석 대기
  "processing": 10,        // AI 분석 진행 중
  "reviewPending": 25,     // AI 분석 완료, 관리자 검토 대기
  "approved": 1200,        // 승인 완료
  "rejected": 215,         // 거부 처리
  "approvalRate": 80.0,    // 승인율
  "awaitingReview": 75     // 검토 대기 총합 (pending + reviewPending)
}
```

### 소스별 통계
```json
[
  {"source": "네이버 뉴스", "count": 1520, "percentage": 45.2},
  {"source": "다음 뉴스", "count": 980, "percentage": 29.1},
  {"source": "한국경제", "count": 567, "percentage": 16.8},
  {"source": "기타", "count": 298, "percentage": 8.9}
]
```

## 🧪 워크플로우 테스트

### 전체 워크플로우 테스트
```bash
./test-workflow.sh
```

### 개별 단계 테스트
```bash
# 1. 뉴스 수집
curl -X POST http://localhost/crawler/crawl/news?category=politics

# 2. AI 분석 (뉴스 ID 필요)
curl -X POST http://localhost/crawler/ai/analyze \
  -d "title=테스트&content=내용&news_id=123"

# 3. 검토 대기 목록 확인
curl http://localhost/api/admin/news/review-pending

# 4. 승인 처리
curl -X POST http://localhost/api/news/123/approve

# 5. 사용자 노출 확인
curl http://localhost/api/news/approved
```

## ⚠️ 주의사항

1. **AI 분석 순서**: PENDING → PROCESSING → REVIEW_PENDING 순서 준수
2. **관리자 우선순위**: REVIEW_PENDING 뉴스를 PENDING보다 먼저 처리
3. **상태 동기화**: AI 분석 완료 시 반드시 Backend API 콜백 호출
4. **에러 처리**: 각 단계에서 실패 시 적절한 로그 기록 및 복구 방안
5. **OpenAI API**: 키 설정 필수, 토큰 사용량 모니터링 권장

## 🚀 자동화 스케줄링

- **뉴스 수집**: 매 2시간 
- **AI 분석**: 뉴스 수집 완료 즉시 자동 실행  
- **관리자 알림**: REVIEW_PENDING 상태 뉴스 발생 시 알림 (구현 예정)
- **일괄 승인**: 관리자 판단에 따른 수동 실행

이제 AI 분석이 완료되면 자동으로 관리자 검토 대기 상태(`REVIEW_PENDING`)로 전환되며, 관리자 화면에서 우선적으로 표시됩니다.
