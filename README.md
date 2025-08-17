# FactLab - Korean Fact-Checking News Community Platform

FactLab은 한국의 뉴스 커뮤니티 플랫폼으로, 실시간 뉴스 수집, AI 분석, 커뮤니티 참여를 통한 신뢰도 평가 시스템을 제공합니다.

## 🏗️ 시스템 아키텍처

```
[사용자/관리자] → [Nginx:80] → [User Service:3000 | Admin Service:3001]
                                      ↓
                              [Backend API:8080] ← [Crawler AI:3002]
                                      ↓
                              [PostgreSQL:5433]
```

### 서비스 구성
- **User Service** (Port 3000): React 사용자 프론트엔드
- **Admin Service** (Port 3001): React 관리자 대시보드  
- **Backend Service** (Port 8080): Spring Boot API 서버
- **Crawler AI Service** (Port 3002): Python FastAPI 뉴스 수집 및 AI 분석
- **Database**: PostgreSQL 데이터베이스
- **Nginx**: 리버스 프록시 및 로드 밸런서

## 🚀 Quick Start

### 1. 환경 설정
```bash
# 환경 변수 파일 생성
cp .env.example .env

# OpenAI API 키 설정 (필수)
# .env 파일에서 AI_API_KEY 값 설정
```

### 2. Docker 컨테이너 실행
```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

### 3. 서비스 접속
- **사용자 사이트**: http://localhost
- **관리자 사이트**: http://localhost/admin  
- **API 문서**: http://localhost/api/swagger-ui.html
- **크롤러 API**: http://localhost/crawler/docs
- **헬스체크**: http://localhost/health

## 🛠️ 개발 환경 설정

### 개별 서비스 실행

#### User Service (React)
```bash
npm install
npm start  # http://localhost:3000
```

#### Admin Service (React)  
```bash
cd admin_service
npm install
npm start  # http://localhost:3001
```

#### Backend Service (Spring Boot)
```bash
cd backend_service
mvn spring-boot:run  # http://localhost:8080
```

#### Crawler AI Service (Python)
```bash
cd crawler
pip install -r requirements.txt
uvicorn main:app --reload --port 3002  # http://localhost:3002
```

#### Database (PostgreSQL)
```bash
# Docker로 PostgreSQL만 실행
docker run -d --name factlab-db \
  -e POSTGRES_DB=factlab \
  -e POSTGRES_USER=factlab_user \
  -e POSTGRES_PASSWORD=password \
  -p 5433:5432 \
  -v ./database/init.sql:/docker-entrypoint-initdb.d/init.sql \
  postgres:13
```

## 📋 API 엔드포인트

### Backend API (/api)
- `GET /api/news` - 뉴스 목록 조회
- `GET /api/news/{id}` - 뉴스 상세 조회  
- `POST /api/news` - 뉴스 생성
- `GET /api/admin/dashboard` - 관리자 대시보드 데이터

### Crawler AI API (/crawler)
- `POST /crawler/crawl/news` - 특정 카테고리 뉴스 수집
- `POST /crawler/crawl/all` - 전체 카테고리 뉴스 수집
- `POST /crawler/ai/analyze` - 텍스트 AI 분석
- `GET /crawler/db/stats` - 데이터베이스 통계

## 🗃️ 데이터베이스 스키마

### 주요 테이블
- `users` - 사용자 계정 및 레벨 관리
- `news` - 수집된 뉴스 기사
- `news_summary` - AI 생성 요약 및 분석
- `ai_analysis_tasks` - AI 분석 작업 관리
- 커뮤니티 관련 테이블 (게시판, 댓글, 투표 등)

### 카테고리
정치, 경제, 사회, IT/과학, 세계, 기후환경, 연예, 스포츠

## 🔧 주요 기능

### 사용자 기능
- 실시간 뉴스 피드 (카테고리별)
- AI 요약 및 신뢰도 분석 결과 조회
- 뉴스별 투표 (사실/의심) 및 댓글
- 커뮤니티 게시판 참여
- 트렌딩 키워드 및 인기 콘텐츠

### 관리자 기능  
- 크롤링 상태 모니터링
- 수집 뉴스 승인/거부 관리
- AI 분석 결과 검토 및 수정
- 사용자 관리 및 제재 기능
- 통계 대시보드

### 크롤러/AI 기능
- 네이버/다음 뉴스 자동 수집 (2시간 간격)
- OpenAI 기반 뉴스 요약 및 분석
- 신뢰도 점수 산정 (0-100점)
- 핵심 주장 및 의심 포인트 추출
- 자동 질문 생성

## 🔒 보안 설정

### JWT 인증
- Spring Security 기반 JWT 토큰 인증
- 토큰 만료 시간: 24시간 (설정 가능)

### API 보안
- CORS 정책 설정
- Rate Limiting (Nginx 레벨)
- SQL Injection 방지 (JPA/Hibernate)

## 🚦 모니터링 및 로깅

### 헬스체크
```bash
# 전체 시스템 상태
curl http://localhost/health

# 개별 서비스 상태  
curl http://localhost/api/health
curl http://localhost/crawler/health
```

### 로그 확인
```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend-service
docker-compose logs -f crawler-ai-service
```

## 📈 확장 계획

### Phase 1 (현재)
- 기본 뉴스 수집 및 AI 분석
- 사용자 커뮤니티 기능
- 관리자 도구

### Phase 2 (계획)
- 유튜브 뉴스 연동
- 고급 팩트체킹 기능
- 실시간 알림 시스템
- 사용자 맞춤 추천

### Phase 3 (장기)
- 메타버스 토론 공간
- 블록체인 기반 신뢰도 시스템
- 다국어 지원

## 🤝 기여 가이드

### 개발 원칙
1. **Backend**: DTO/Entity 분리, @Valid 검증, ApiResponse 표준 응답
2. **Frontend**: .news- CSS 접두사 사용, 컴포넌트 기반 개발
3. **API**: REST 표준 준수, Swagger 문서화 필수
4. **보안**: 모든 입력 검증, SQL Injection 방지

### 코드 스타일
- Java: Spring Boot 표준
- JavaScript/React: ES6+ 표준  
- Python: PEP 8 표준
- CSS: BEM 방법론

## 📞 지원

문제 발생 시:
1. Docker 로그 확인: `docker-compose logs -f`
2. 개별 서비스 상태 확인: `curl http://localhost/health`
3. 데이터베이스 연결 테스트: `curl http://localhost/crawler/db/test`

---

© 2024 FactLab. 한국의 신뢰할 수 있는 뉴스 커뮤니티 플랫폼을 지향합니다.

# FactLab
# FactLab
# FactLab
