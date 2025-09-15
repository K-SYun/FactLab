
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### React App (User Service - 
Port 3000)
```bash
npm start                # Start development server
npm run build           # Build for production
npm test               # Run tests
```

### Docker Services
```bash
docker-compose up       # Start all services
docker-compose down     # Stop all services
docker-compose logs     # View logs
```

## High-Level Architecture

FactLab is a Korean fact-checking news community platform with a microservices architecture:

### Service Structure
- **User Service** (Port 3000): React frontend for public users - news feed, voting, community boards
- **Admin Service** (Port 3001): React admin dashboard for content management and moderation
- **Backend Service** (Port 8080): Spring Boot API server for business logic
- **Crawler Service** (Port 3002): Python FastAPI for news collection and crawling management
- **Database**: PostgreSQL with shared schema
- **Nginx**: Reverse proxy and load balancer

### Current Implementation Status
The current codebase contains:
- React user frontend with routing (`src/App.js`, `src/pages/`, `src/components/`)
- HTML prototypes in `documents/user_html/` and `documents/admin_html/`
- Docker configuration for multi-service deployment
- PostgreSQL schema initialization

### Key Features
- Real-time news collection from Korean portals (Naver, Daum)
- AI-powered news summarization and fact-checking
- Community voting system (사실/의심 - Fact/Doubt)
- Multi-category news organization (정치, 경제, 사회, etc.)
- Community boards with various topics

### Development Principles (from project docs)

#### Backend (Spring Boot)
- Use DTO/Entity separation pattern
- Implement `@RestControllerAdvice` for error handling
- Apply strict validation with `@Valid` annotations
- Follow service layer pattern: Controller → Service → Repository
- Use `ApiResponse<T>` standard response format

#### Frontend (React)
- Use `.news-` CSS class prefixes to avoid global conflicts
- Maintain common styles in `Common.css`
- Component naming: `FactlabPageName` for pages
- Follow existing Korean UI patterns and layouts

#### CSS/Styling
- Main layout: 1280px wide, responsive design
- Use `.news-`, `.admin-` prefixes for scoped styling
- Mobile fonts: 25px titles, 15px body text
- Ad spaces: top banner (1200×90px), side ads (160px wide)

## File Structure Notes

### React Components
- Pages: `user_service/pages/Factlab*.js` - main application screens
- Components: `user_service/components/` - reusable UI elements (Header, Footer)
- Styles: `user_service/styles/` - CSS files with Common.css for shared styles

### Documentation
- Korean project specs in `documents/` directory
- HTML prototypes demonstrate exact UI layouts to follow
- Database schema in `database/init.sql/init.sql`

### Services Architecture (Planned)
```
FactLab/
├── user-service/          # React frontend (current implementation)
├── admin_service/         # Admin React app (planned)
├── backend_service/       # Spring Boot API (planned)
├── crawler_ai_service/    # Python FastAPI (planned)
└── nginx/                 # Reverse proxy config
```

## Development Notes

- The project uses Korean content and UI text throughout
- Follows Korean web design patterns with specific layout requirements
- Community boards are organized by topic with "Lab" suffix (e.g., "정치 Lab")
- News voting system uses Korean terms: "사실" (fact) vs "의심" (doubt)
- Ad placement is integral to the design and revenue model

## Database Schema

Key tables include:
- `users` - User accounts with levels and activity tracking
- `news` - Collected news articles with metadata
- `news_summary` - AI-generated summaries and analysis
- Community boards, comments, and voting tables

The schema supports the full fact-checking workflow from news collection to community engagement.


## Rules
1. 클레스 혹은 파일명 지정 시 하이픈 (-) 대신 언더스코어(_) 를 사용.

# FactLab 통합 시스템 정리

## 목차

1. 프로젝트 개요
2. 전체 시스템 구조 및 아키텍처
3. 기능 상세 설계
4. 사용자 및 관리자 화면 상세
5. 데이터베이스 설계
6. 개발 환경 및 구현 절차
7. 운영 설정 및 확장 방향

---

## 1. 프로젝트 개요

* **사이트명**: PolRadar

* **목표**:

  1. 뉴스/법안 자동화: 실시간 뉴스 및 국회 법안 데이터를 자동 수집, AI 분석을 통해 핵심 콘텐츠로 가공.
  2. 커뮤니티 활성화: AI가 생성한 콘텐츠를 기반으로 사용자 토론, 투표, 의견 교환을 유도.
  3. 뉴스 신뢰도 및 의심 포인트 추출 기능 구현
  4. 정치 큐레이션: 사용자 관심사에 맞춰 뉴스, 법안, 정치인 정보를 추천하고 비교 분석 데이터 제공.
  5. 트래픽 기반 광고 노출로 수익 창출
  6. 국내 최대 정치 및 이슈 기반 커뮤니티 플랫폼으로 성장

* **수집 대상 및 방식**:
  * 국회 법안 데이터를 자동 수집
  * 네이버/다음 뉴스 (RSS) + 매뉴 명칭(정치, 경제, 사회 등)
  * 트위터 트렌드 (API 또는 크롤링)
  * 팩트체크 데이터: 수동 연동 (CSV 등)

---

## 2. 전체 시스템 구조 및 아키텍처

```
[사용자] ─┐
          ├─> [Nginx Reverse Proxy] ──> [User Service (3000)] ──┐
[관리자] ─┘                                                │
                                                         ▼
              ┌─────────────────────────────┐           
              │ Admin Service (3001)        │           
              └─────────────────────────────┘           
                          │                              
                          ▼                              
              ┌─────────────────────────────┐           
              │ Backend API (Spring Boot)   │           
              └─────────────────────────────┘           
                          │                              
                          ▼                              
              ┌─────────────────────────────┐           
              │ PostgreSQL Database         │           
              └─────────────────────────────┘           
                          ▲                              
                          │                              
              ┌─────────────────────────────┐           
              │ Crawler Service (3002)      │           
              └─────────────────────────────┘           
                          ▲                              
                          │                              
              ┌─────────────────────────────┐           
              │ AI Service (8001)           │──▶ Gemini │
              └─────────────────────────────┘           
```

### 서비스별 디렉토리 구조

```
FactLab/
├── docker-compose.yml
├── .env
├── nginx/
│   └── nginx.conf
├── database/
│   └── init.sql
├── user-service/
│   └── /pages, components
├── admin_service/
│   └── src/pages, components
├── backend_service/ (Java Spring Boot)
│   └── controller, service, repository, dto, entity
├── crawler_service/ (Python FastAPI)
│   ├── crawlers/ (naver.py, daum.py, trend.py)
│   ├── schedulers/ (hourly_task.py, daily_task.py)
│   └── pipelines/save_to_db.py
└── shared/, docs/
```

* 각 모듈은 Docker 컨테이너로 독립 배포
* Nginx가 리버스 프록시 역할 수행 (80, 443 포트)
* Crawler 모듈은 뉴스 수집 전담하며 FastAPI 기반 REST API 제공
* AI 분석은 별도 AI Service에서 Gemini API 활용하여 처리

---

## 3. 기능 상세 설계

### 사용자 기능

* 트렌딩 키워드 (실시간/일간/주간/월간)
* 뉴스 상세: AI 요약 + 질문 + 댓글/투표
* 인기 게시판 (점수 집계: 게시글 2점 + 댓글 1점)
* 주간/월간 베스트 콘텐츠
* 게시판 시스템: 게시글 목록, 작성, 상세 조회
* 로그인/회원가입, 마이페이지, 설정 등 사용자 시스템

### 관리자 기능

* 크롤링 상태 대시보드 (수집 시간, 결과, 실패 로그 등)
* 수집 뉴스 검토 및 승인/거부
* AI 요약 결과 수정
* 자동 질문 수정 및 신뢰도 수치 조정
* 사용자 관리: 레벨 관리, 경고/정지/차단 등 제재 기능
* 콘텐츠 관리: 게시판 생성/삭제, 광고 노출 위치 설정
* 통계 대시보드: 뉴스별 참여도, 투표 통계, 신뢰도 변화 추이 등

### 크롤러 기능 (Crawler Service)

* 뉴스 수집: 네이버, 다음 모바일에서 2시간 간격 수집
* 분산 스케줄링: 네이버(정시), 다음(20분), 구글(40분) 
* 수집 속도: 5초 간격으로 1개씩, 주기당 20개 수집
* 중복 뉴스 제거: URL 기준 중복 체크
* 크롤링 로그 및 상태 관리

### AI 분석 기능 (AI Service)

* AI 요약: 본문 100자 내 요약 (Gemini API)
* 핵심 주장 및 의심 포인트 자동 추출  
* 질문 자동 생성: "이 뉴스 진짜일까요?" + 보기 옵션 생성
* 찬반 성향 분석: 댓글/기사 내용 기준
* 뉴스 신뢰도 점수 산정: 0\~100점

---

## 4. 사용자 및 관리자 화면 상세

### 사용자 화면 구조

* 메인 페이지 (factlab\_main.html):

  * 실시간 이슈 뉴스 (각 메뉴별 6개)
  * 트렌딩 키워드
  * 인기 게시판 (1일, 주간, 월간 기준)
  * 오늘의 뉴스, 주간/월간 베스트
  * 광고:

    * 상단: 1200×90px
    * 하단: 1200×200px (Hover 시 노출)
    * 좌우: 각 160px

* 뉴스 피드 (factlab\_news\_feed.html): 카테고리별 뉴스 목록, 요약 포함

* 뉴스 상세 (factlab\_news\_detail.html): AI 요약 + 투표 + 댓글
   - ai분석 사실분석, 편향성분석 , 종합(사실+편향) 

* 게시판: list, write, detail 구성 (각 HTML 별도 존재)

* 사용자 시스템: 로그인(factlab\_login.html), 회원가입, 마이페이지, 설정 등

### 관리자 화면

* 뉴스 승인/거부 및 상태 모니터링
* 수집 로그 및 AI 결과 확인
* 사용자 관리 (신고, 정지 등)
* 대시보드: 뉴스별 통계, 신뢰도, 투표 분포
* 팩트체크 기사 매칭 및 리뷰

### 반응형 및 시각 설계

* 메인 폭: 1280px / 서브: 1000px
* 모바일 폰트: 제목 25px, 본문 15px
* 레이아웃 공통 구성: Header / Contents / Footer (반투명 배경)
* CSS 구성:

  * common.css: 공통 (헤더, 푸터, 광고)
  * main.css: 메인 전용
  * sub.css: 뉴스, 게시판 공통
* JS 구성도 동일하게 common.js / main.js / sub.js 분리

---

## 5. 데이터베이스 설계

| 테이블                | 주요 필드                                                    |
| ------------------ | -------------------------------------------------------- |
| users              | id, email, nickname, level, created\_at                  |
| news               | id, title, content, url, source, publish\_date, category |
| news\_summary      | news\_id, summary, claim, keywords, auto\_question       |
| fact\_check\_match | news\_id, matched\_article\_url, score                   |
| user\_votes        | id, news\_id, user\_id, vote\_type                       |
| user\_comments     | id, news\_id, user\_id, content, created\_at             |
| trending\_keywords | keyword, date, rank, category                            |
| categories         | id, name                                                 |
| logs               | timestamp, action, module                                |

* 외래키 및 인덱스 포함
* 정기 정리 작업: 30일 초과 데이터 삭제

---

## 6. 개발 환경 및 구현 절차

### 기술 스택

* 백엔드: Java Spring Boot
* 프론트엔드: React, HTML5, CSS3, JavaScript
* 크롤러/AI: Python, FastAPI, BeautifulSoup, OpenAI API
* 데이터베이스: PostgreSQL
* 인프라: Docker, Nginx, WebSocket

### 개발 순서

1. Docker 환경 설정 및 테스트
2. PostgreSQL 초기화 및 테이블 설계
3. 공통 모듈 (인증, 사용자 시스템, 표준 API 응답 등)
4. 크롤러 서비스 구현 (naver, daum, trend)
5. AI 요약 및 분석 모듈 연동
6. 관리자 화면 구현 (뉴스 승인, 모니터링, 통계 등)
7. 사용자 화면 구현 (메인, 뉴스, 게시판, 댓글 등)
8. REST API 및 WebSocket 연결
9. 정적 자원 및 광고 연동
10. 통합 테스트 및 배포

### 배포 준비 및 테스트

* 기능 테스트: 크롤링 정확성, AI 품질, UI 동작
* 성능 테스트: 부하 테스트, 캐시/DB 성능, 안정성
* 정기 작업 등록:

  * 뉴스 수집: 3시간 간격 (CRON)
  * 트렌딩 키워드: 1시간 간격
  * AI 요약: 실시간 트리거
  * 로그 정리/DB 정리: 자정

---

## 7. 운영 설정 및 확장 방향

* 기사 군집화 카드 제공: 유사 기사 묶음으로 시각화
* 댓글/투표 기반 신뢰도 변화 시각화
* 팩트체크 기관 연동 자동화 (SNU, 뉴스톱 등)
* 유튜브 뉴스 및 쇼츠 요약 연동
* Twitter/Reddit 기반 반응 요약
* 고급 기능 확장:

  * 실시간 알림 시스템 (WebSocket 기반)
  * 사용자 관심사 기반 뉴스 추천
  * 통합 검색 기능
  * 광고 수익 구조 고도화 (페이지별 광고 설정)

----

## 8. 백엔드(SPRING BOOT) 개발 기본 원칙

1) 폴더 구조 및 계층 명확화
기본 구조: controller, service, repository, dto, entity, config
기능 단위로 하위 패키지 구성 (ex: news/, user/, comment/)
com.factlab.news.controller
com.factlab.news.service
com.factlab.news.repository
com.factlab.news.dto

2) DTO, Entity 분리
Entity는 DB 매핑 용도로만 사용

Controller ↔ Service ↔ Repository 간에는 반드시 DTO 사용

3) Service는 비즈니스 로직만
Controller에는 로직 금지: Request → DTO 변환만

Repository에는 쿼리 외 로직 금지: 단순 DB 접근만

4) Exception Handling 통합
@RestControllerAdvice + @ExceptionHandler 구성

에러 코드는 ErrorCode.java Enum으로 통합 관리

5) Validation 철저 적용
모든 입력값: @Valid, @NotNull, @Size, @Email 등 사용

Controller에서는 무조건 검증만 처리

6) Response 형식 표준화
API 응답 통일: 공통 ApiResponse<T> 객체 사용
return ApiResponse.success(data);

7) Swagger 또는 SpringDoc으로 API 문서화
springdoc-Gemini 라이브러리로 자동 문서화

/swagger-ui/index.html 또는 /v3/api-docs


### 9. Admin 화면(React) 개발 기본 원칙

1) 폴더구조
admin_service/src/
├── pages/       // 각 메뉴별 화면 단위
├── components/  // 공통 UI 요소
├── hooks/       // 재사용 가능한 커스텀 훅
├── api/         // axios 기반 API 모듈
├── constants/   // 상수, ENUM, config
├── styles/      // CSS/SCSS, 공통 스타일
├── utils/       // 유틸 함수

2) 컴포넌트 네이밍
페이지 컴포넌트: NewsDashboardPage, UserListPage

공통 컴포넌트: SidebarMenu, StatCard, StatusTag

3) 스타일 관리
공통 스타일은 AdminCommon.css에만 정의
각 페이지 스타일은 News.css, User.css 등으로 분리
전역 클래스명 금지 → .admin- 접두사 사용 권장
.admin-container, .admin-sidebar, .admin-header

4) API 통신 모듈화
axios 인스턴스: /api/axiosInstance.js
API 분리: /api/news.js, /api/user.js
에러/로딩 처리 공통화

5) 권한 및 인증 처리
로그인 시 JWT 저장 (localStorage or secure cookie)
Axios Interceptor로 자동 헤더 주입
관리권한 없는 경우 접근 차단 (<PrivateRoute />)

6) 입력/검증 UI 일관화
모든 입력: <Input>, <Select>, <DatePicker> 등 공통 UI 컴포넌트 사용

Validation은 Yup + React Hook Form 또는 Zod 등 라이브러리 기반

10. 공통원칙.
| 구분  | 적용 원칙                                                          |
| --- | ----------------------------------------------------------        |
| 네이밍 | 명확한 기능 기반, 메뉴명 포함 (`news-user-controller`, `admin-header`) |
| 스타일 | `.admin-`, `.news-` 접두사로 전역 클래스 충돌 방지                      |
| 구조  | 기능 단위로 폴더/클래스/컴포넌트 분리                                     |
| 응답  | API 응답 형식 통일 (`{ success, data, error }`)                     |
| 보안  | 인증/인가 철저 (JWT, Role 체크)                                      |
| 문서화 | Swagger 또는 Storybook, README 등 주석/문서 필수화                   |


----

### 11. 사용자화면 (Html) > react 변환 원칙

1. 모든 전역/중복 클래스명 금지, .news- 네임스페이스만 사용
2. 공통(헤더/푸터/버튼 등)은 Common.css에서만 관리
3. 레이아웃/디자인/사이즈/구조는 원본과 100% 동일하게 유지
4. .container, .main-content, .sidebar, .page-header 등은 
   .news-container, .news-main-content, .news-sidebar, .news-page-header 등 메뉴명을 붙여서 변경
5. 버튼, 폰트, 링크 등 공통 스타일은 Common.css에만 남기고 News.css에서는 오버라이드 금지



### 12 크롤링 스케줄 환경설정 추가/수정
1. 주기 : 2시간 간격.
2. 내부 요청 간격. 5초에 1개씩 크롤링. 1주기에 20개씩 수집. 
3. 네이버모바일(정치, 경제 등 tab화면), 다음모바일(정치, 기후환경 등 tab) 크롤링.(pc에서 하지 않음.)
3. 분산 : 20분 간격으로 실행  (예: 네이버 2:00, 다음: 2:20, 구글: 2:40)
4. 비동기 처리: 크롤링으로 뉴스 저장 후 관리자에서 뉴스 선택해서 ai 분석 후 저장.

전체: ai 분석완료 된 전체뉴스 건수 / 크롤링 된 뉴스의 개수는 여기서 보이면 안됨.
승인대기: ai 분석완료 된 전체뉴스 중 승인 대기건수
승인됨: 승인대기건 중 승인되어 사용자화면에 보이고 있는 뉴스 
거부됨: ai 분석완료 된 뉴스 중 분석이 잘못되어 거부된 건 > 이건 ai. 다시 분석 필요.

## 관리자 절차
클롤링한 뉴스를 하나의 큐 형식으로 아래와같은 프로세스를 통해 사용자에게 제공.
1. 크롤링으로 뉴스 수집 > 수집한 뉴스는 AI요약관리에 노출됨 (정기 스케줄에 의해 수집)
2. AI뉴스분석에서 관리자가 수집한 뉴스 선택 , [ai분석] 버튼클릭 > 클릭 해야 AI 사용해서 뉴스 분석 > 분석 완료된 뉴스는 '뉴스관리' 메뉴에 노출 (분석되지 않은 뉴스는 나타나지 않음, 분석 이후에는 이 메뉴에서 뉴스 사라짐.)
3. '뉴스관리'에 있는 분석완료된 뉴스는 승인버튼 클릭 / 이때 내용 않맞을 경우 '거부' 후 '재분석' 하거나 뉴스삭제.
4. 승인된 뉴스가 사용자화면 메인, 각 분야별 화면에 노출됨.

5. 크롤링버튼 클릭 시 실제로 크롤링으로 뉴스를 수집해야해. 근데 그런 기능이 없는거 같아. 
그리고. 수동으로 뉴스를 수집하기 위해 크롤링 버튼을 개발했지만, 원래는 배치를 통해서 정기적으로 수집할거야. 
일단 목업데이터 삭제.해봐 내가 크롤링 버튼 눌러서 실제로 뉴스 수집 하는지 테스트할께.

6. ai 분석은 현재 gemini 로 하고 있어. 소스 체크해. 더불어서 open ai 소스는 모두 삭제해.
7. ai 분석 후 db에 저장해.
8. contest 는 뉴스의 내용이어야 하는데 왜 url이 저장되어 있지? 내용은 어디에 저장하지? 확인해

뉴스는 한 페이지에 100개씩 페이징 처리, 
화면 아래에 페이지 수 표시.
맨 처음 | < 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | > | 맨 끝 



  # 1. 모든 컨테이너 중지 및 삭제
  docker-compose down

  # 2. 캐시 없이 전체 이미지 재빌드
  docker-compose build --no-cache

  # 3. 서비스 재시작
  docker-compose up -d

  # 또는 한번에:
  docker-compose down && docker-compose build --no-cache && docker-compose up -d

  더 강력한 정리가 필요하면:

  # 1. 모든 것 중지 및 삭제
  docker-compose down

  # 2. 사용하지 않는 이미지/네트워크/볼륨 정리
  docker system prune -f

  # 3. 전체 재빌드 및 실행
  docker-compose build --no-cache
  docker-compose up -d

# 메인 실시간 이슈 뉴스 수정.
  1. 분석 완료된건 각 분류(정치, 경제 등) 에 최신순으로 출력
  2. 메인뉴스 수정 : 관리자 > 뉴스관리 > 승인된 뉴스 중에서 지정한 뉴스만 실시간 이슈에 노출. (노출 갯수는 제한없음. 노출 수서는 지정)
  3. 뉴스관리도 AI뉴스분석 과 동일하게 Tab으로 뉴스 정렬.

  
# 게시판 수정.
1. 전 게시판 공통: http://localhost:3000/notice 여기에 등록된 글중 카테고리 [게시판공지] 글은 각 게시판 상단에 표시
2. BEST: 글쓰기 삭제 
 - 베스트 게시판은 각 게시판(갤러리 제외)에서 게시판관리에 설정값에 해당하면 자동으로 등록되는 시스템이야.
 - 제목 앞에 게시판명 추가 (이 글이 어느게시판 글인지 알 수 있게.)
3. 모든 게시판(BEST제외)
 - 제목 앞에 글번호 추가.
 - 게시판 글 상세보기 화면이 없음.
 - 글쓰기 화면: 디자인이 이상해. / 게시판 선택: 현재 내 게시판 자동입력(수정가능)
 - 에디터는 CKEditor 

 게시판전체 소스 확인. 개발완료되었다고 말하기전에 테스트확인해.
 1. BEST: 글쓰기 삭제 (미 개발)
 2. 글 등록시 저장안되고 목록에 않보임.
 

 ## 7. 운영 설정 및 확장 방향

* 기사 군집화 카드 제공: 유사 기사 묶음으로 시각화
* 댓글/투표 기반 신뢰도 변화 시각화
* 팩트체크 기관 연동 자동화 (SNU, 뉴스톱 등)
* 유튜브 뉴스 및 쇼츠 요약 연동
* Twitter/Reddit 기반 반응 요약
* 고급 기능 확장:

  * 실시간 알림 시스템 (WebSocket 기반)
  * 사용자 관심사 기반 뉴스 추천
  * 통합 검색 기능
  * 광고 수익 구조 고도화 (페이지별 광고 설정)

----

## 8. 백엔드(SPRING BOOT) 개발 기본 원칙

1) 폴더 구조 및 계층 명확화
기본 구조: controller, service, repository, dto, entity, config
기능 단위로 하위 패키지 구성 (ex: news/, user/, comment/)
com.factlab.news.controller
com.factlab.news.service
com.factlab.news.repository
com.factlab.news.dto

2) DTO, Entity 분리
Entity는 DB 매핑 용도로만 사용

Controller ↔ Service ↔ Repository 간에는 반드시 DTO 사용

3) Service는 비즈니스 로직만
Controller에는 로직 금지: Request → DTO 변환만

Repository에는 쿼리 외 로직 금지: 단순 DB 접근만

4) Exception Handling 통합
@RestControllerAdvice + @ExceptionHandler 구성

에러 코드는 ErrorCode.java Enum으로 통합 관리

5) Validation 철저 적용
모든 입력값: @Valid, @NotNull, @Size, @Email 등 사용

Controller에서는 무조건 검증만 처리

6) Response 형식 표준화
API 응답 통일: 공통 ApiResponse<T> 객체 사용
return ApiResponse.success(data);

7) Swagger 또는 SpringDoc으로 API 문서화
springdoc-gemini 라이브러리로 자동 문서화

/swagger-ui/index.html 또는 /v3/api-docs


### 9. Admin 화면(React) 개발 기본 원칙

1) 폴더구조
admin_service/src/
├── pages/       // 각 메뉴별 화면 단위
├── components/  // 공통 UI 요소
├── hooks/       // 재사용 가능한 커스텀 훅
├── api/         // axios 기반 API 모듈
├── constants/   // 상수, ENUM, config
├── styles/      // CSS/SCSS, 공통 스타일
├── utils/       // 유틸 함수

2) 컴포넌트 네이밍
페이지 컴포넌트: NewsDashboardPage, UserListPage

공통 컴포넌트: SidebarMenu, StatCard, StatusTag

3) 스타일 관리
공통 스타일은 AdminCommon.css에만 정의

각 페이지 스타일은 News.css, User.css 등으로 분리

전역 클래스명 금지 → .admin- 접두사 사용 권장
.admin-container, .admin-sidebar, .admin-header

4) API 통신 모듈화
axios 인스턴스: /api/axiosInstance.js

API 분리: /api/news.js, /api/user.js

에러/로딩 처리 공통화

5) 권한 및 인증 처리
로그인 시 JWT 저장 (localStorage or secure cookie)

Axios Interceptor로 자동 헤더 주입

관리권한 없는 경우 접근 차단 (<PrivateRoute />)

6) 입력/검증 UI 일관화
모든 입력: <Input>, <Select>, <DatePicker> 등 공통 UI 컴포넌트 사용

Validation은 Yup + React Hook Form 또는 Zod 등 라이브러리 기반

10. 공통원칙.
| 구분  | 적용 원칙                                                      |
| --- | ---------------------------------------------------------- |
| 네이밍 | 명확한 기능 기반, 메뉴명 포함 (`news-user-controller`, `admin-header`) |
| 스타일 | `.admin-`, `.news-` 접두사로 전역 클래스 충돌 방지                      |
| 구조  | 기능 단위로 폴더/클래스/컴포넌트 분리                                      |
| 응답  | API 응답 형식 통일 (`{ success, data, error }`)                  |
| 보안  | 인증/인가 철저 (JWT, Role 체크)                                    |
| 문서화 | Swagger 또는 Storybook, README 등 주석/문서 필수화                   |


----

### 11. 사용자화면 (Html) > react 변환 원칙

1. 모든 전역/중복 클래스명 금지, .news- 네임스페이스만 사용
2. 공통(헤더/푸터/버튼 등)은 Common.css에서만 관리
3. 레이아웃/디자인/사이즈/구조는 원본과 100% 동일하게 유지
4. .container, .main-content, .sidebar, .page-header 등은 
   .news-container, .news-main-content, .news-sidebar, .news-page-header 등 메뉴명을 붙여서 변경
5. 버튼, 폰트, 링크 등 공통 스타일은 Common.css에만 남기고 News.css에서는 오버라이드 금지


뉴스 댓글/덧글 시스템
1. 로그인 사용자만 작성 / 미 로그인 시 로그인 팝업 열림.
2. 작성한 글은 db에 저장해야해.
3. 사용자가 작성한 글은 마이페이지-작성한댓글에 보여야 해. 
4. 개발 완료되면 목업 데이터는 삭제해.

# 게시판 보안처리 ()

# 게시판.
1. BEST 게시판은 관리자에서 설정한 옵션(조회수 ≥ 100 , 추천수 ≥ 10) 받은 글만 자동등록. /글쓰기 삭제.
2. BEST 게시판에 등록되는 게시글은 갤러리 하위 글은 제외.
3. 모든 작성되는 글의 첨부파일은 jpg,img만 허용
4. 일단 성인 게시판은 주석처리.(나중에 공개)

# 회원가입
1. 메일로 회원가입 이때 회원가입 시 입력한 메일로 인증번호 발송 - 인증번호(인증번호는 30분 사용) 입력 시 회원가입 완료. 
2. 구글, 네이버, 카카오톡 메일로 회원가입 가능.

 # OAuth 인증
  GET  /api/auth/google/login-url     → 구글 OAuth URL 생성
  GET  /api/auth/naver/login-url      → 네이버 OAuth URL 생성
  GET  /api/auth/kakao/login-url      → 카카오 OAuth URL 생성
  GET  /api/auth/google/callback      → 구글 OAuth 콜백 처리
  GET  /api/auth/naver/callback       → 네이버 OAuth 콜백 처리
  GET  /api/auth/kakao/callback       → 카카오 OAuth 콜백 처리
  POST /api/auth/social/login         → 직접 소셜 로그인 처리

  # 소셜 계정 관리
  GET  /api/user/social-accounts/{userId}              → 연결된 소셜 계정 목록
  GET  /api/user/social-accounts/{userId}/{provider}   → 특정 소셜 계정 조회
  DELETE /api/user/social-accounts/{userId}/{provider} → 소셜 계정 연결 해제
  POST /api/user/social-accounts/{userId}/{provider}/sync-profile → 프로필 동기화
  GET  /api/user/social-accounts/{userId}/status       → 소셜 계정 연결 상태





# 공지사항
사용자 수정
 전체 : 모든 사용자 게시판 상단에 고정되어 사용자가 확인할 수 있음.(현재 일부만 보임.)
 중요(관리자에서 특정 사용자 게시판 지정) : 지정한 게시판 상단에 고정되어 출력. (신규기능)
 푸터에 있는 공지사항 게시판에 출력 : 관리자에서 등록한 모든 공지사항이 등록됨.

 관리자 수정
 중요 선택 시 전체 게시판 중 노출되는 게시판을 선택기능(체크박스로 선택) 추가.
 등록 팝업 사이즈 확대.


## 신규 추가. 25.08.28
# 법안감시 플랫폼+정치 큐레이션 커뮤니티.

# 서비스 목표
 현재 회기의 법안을 수집. 
 그거  ai 분석해서. 사용자에게 공개하고, 의견을 모아서
 법안 발안한 국회의원에게 전달해서 폐기되지 않고 처리되도록 하는게 주요 목표야.    

1. 데이터 수집 (Ingestion Layer)
뉴스 크롤링 모듈 (기존 유지)
구글/네이버/다음 기사 전문 수집
국회 데이터 크롤링 모듈 (신규 추가)
국회 의안정보시스템 API/크롤링 → 법안, 발의자, 소속 정당, 심의 단계, 표결 결과 저장
정치인/정당 데이터 모듈 (신규 추가)
선관위/공식 사이트 크롤링 → 공약집, 주요 활동, SNS 데이터 수집

2. 데이터베이스 (DB Layer, PostgreSQL)
뉴스 테이블 (기존)
 - 기사 원문, 출처, 키워드, AI 분석 결과
법안 테이블 (신규)
 - 법안ID, 제목, 요약, 발의일, 발의자, 진행상태, 표결결과
정치인/정당 테이블 (신규)
 - 정치인 프로필, 정당 소속, 공약, 활동
커뮤니티 테이블 (기존 확장)
 - 게시글/댓글/추천/토론방 → 특정 법안·정치인과 연동

3. AI 분석 레이어
뉴스 분석 AI (기존)
 - 기사 요약, 긍부정 분석, 허위정보 가능성 탐지
법안 요약 AI (신규)
 - 법안 텍스트를 일반 시민 눈높이에 맞게 자동 요약 (예: “이 법안은 ○○ 혜택 확대를 목적으로 합니다”)
정책 비교 AI (신규)
 - 정당별 공약/법안 비교표 생성
정치 큐레이션 AI (신규)
 - 사용자 관심사 기반 맞춤형 뉴스/법안 추천

4. 백엔드 API (Spring Boot)
기존 - 뉴스 API (목록, 상세, 분석 결과 제공)
    - 관리자 승인 API
추가
 - 법안 API (법안 목록, 상세, 진행상태, 요약)
 - 정치인 API (프로필, 공약, 뉴스 연동)
 - 커뮤니티 API (법안·뉴스·정치인별 토론방 연결)
 - 추천 API (AI 기반 뉴스·법안 큐레이션)

5. 프론트엔드 (React)
기존 화면 : 뉴스 목록, 상세 기사, 분석 결과
신규 화면
 1) 법안 모니터링 대시보드
 - 최신 발의 법안, 상태(계류, 심의, 통과/폐기)
 - 요약 & AI 분석 (찬반 논점 자동 정리)
 2) 정치인/정당 페이지
 - 프로필 + 최근 발의 법안 + 공약 + 뉴스 연동
 3) 정책 비교 페이지
 - “정당별 공약/법안 비교” 표
 4) 커뮤니티 페이지 확장
 - 법안별 토론방 / 뉴스별 토론방
 - 추천/반대 투표 기능

6. 관리자 모듈
기존: 뉴스 승인
추가: 법안/정치인 데이터 검수, AI 요약 결과 수정

# 구조
[크롤링/수집] ─▶ [DB 저장(PostgreSQL)] ─▶ [AI 분석] ─▶ [백엔드 API(Spring)]
    │                         │                     │
    ├─ 뉴스                    ├─ 법안/정치인           ├─ 요약/비교/추천
    │                         │                     │
    ▼                         ▼                     ▼
[뉴스화면]              [법안 대시보드]       [정책비교/추천]
    │                         │                     │
    └──────▶ [커뮤니티(토론방,투표,댓글)]


# 전체 구조 확장.

 [데이터 수집 계층]
  - 뉴스 크롤러 (Naver/Daum) ₩: 개발
  - 법안 크롤러 (국회 의안정보시스템) 
  - 정치인/정당 데이터 수집 
      |
      ▼
[데이터베이스 (PostgreSQL)]
  - 뉴스, 법안, 정치인, 커뮤니티 데이터 저장
      |
      ▼
[AI 분석 계층 (Gemini API 활용)]
  - 뉴스 분석 AI (요약, 신뢰도, 키워드 추출)
  - 법안 분석 AI (핵심 요약, 쟁점 분석, 영향 예측)
  - 정책 비교 AI (정당/정치인별 공약 및 법안 비교)
      |
      ▼
[백엔드 API (Spring Boot)]
  - 각 서비스에 필요한 데이터 제공 (뉴스, 법안, 커뮤니티 API 등)
      |
      ▼
[프론트엔드 (React)]
  - 사용자 서비스 (뉴스 피드, 법안 대시보드, 커뮤니티)
  - 관리자 서비스 (콘텐츠 검수, 사용자 관리, 통계)

[사용자 상호작용]
 ├─ 찬반 투표 - 업데이트
 ├─ 댓글/토론 - 업데이트
 └─ 구독(정당/정치인/법안) - 신규

# 법안 카테고리
1. 전체 법안은 데이터베이스에 저장하되, 사용자화면은 ‘필터링된 뷰’만 노출
 → 모든 법안은 관리자가 백엔드에서 관리/분석, 사용자에게는 ‘관심도 높은 법안’만 제공.
 → 법안 중 중요하다고 생각되는 법안을 선택하여 사용자화면에 노출.
 - 전체: 수집한 모든 법안- 여기서 법안  선택하여 ai 분석               
 - 승인대기: ai분석 완료한 법안이 여기서 보이고 승인하면 사용자        
 - 승인: 화면에 출력, 이때 어느 영역에 출력될지 선택해야해.   
 - 거부: ai 분석이 잘못되어 거부된 법안이 여기서 보이고 다시 ai분석해서 승인대기로 이동.

2. 카테고리 분류 기반 제공
 - 정치/행정
 - 경제/산업
 - 노동/복지
 - 교육/문화
 - 환경/에너지
 - 디지털/AI/데이터

3. 우선순위 선정 기준 (백엔드/AI 분석 단계 후 승인하여 반영)
 - 관리자 화면에서 ai분석 완료된 법안을 지정하여 사용자 화면에 우선 노출
 노출방식:
 - 이슈성가 많은 법안: 언론·커뮤니티에서 언급량 높은 법안
 - 영향도 높은 법안: 국민 생활·산업 구조에 직접적 영향
 - 사람들은 모르지만 중요한 법안
 투표방식:
 - 사실분석 : 완전 사실, 부분적으로 사실, 조금 의심스럽다, 완전 의심, 모르겠다.
 - 편향분석 : 우편향(보수 우파), 일부 우편향, 일부 좌편형, 좌편향(진보 좌파), 잘 모르겟다.
 - 종합분석 : 신뢰보도(완전사실+중립), 신뢰+편향(신뢰+우편향)ㅇㅌ, 신뢰+편향(신뢰+좌편향), 신뢰/편향 문제있음, 모르겠음. 
 
 # 사용자 화면 구성.
1. 법안 메인 (한눈에 보는 국회 상황)
 - 현재 계류 총 법안 수 및 최근 통과된 법안 명 및 갯수
 - 이슈성가 많은 법안: 언론에서 중요하다고 이야기 하고 있는 법안 목록 5~10개 -> 클릭 시 상세화면 연결
 - 영향도 높은 법안: 사이트(polradar) 에서 중요하다고 생각되는 법안 5~10개(실생활에 밀접한 법안을 ai가 추출)
 - 사람들은 모르지만 중요한 법안
 - 핵심 이슈 TOP 5 키워드 (AI 추출)

 2. 법안 목록화면
 - 법안분류 : 주제별 카테고리
   경제/산업
   노동/복지
   정치/선거제도
   사회/교육
   환경/에너지
   디지털/AI/과학기술
 - 인기순 / 논란순 / 통과 가능성 높은 법안순 (AI 분석 기반)
 2-1. 상세화면
 - 클릭 시 상세화면으로 연결 : ai 법안 요약 
 - 링크:실제 법안이 있는 시스템링크.

3. 법안 카드 뷰 (선택 집중)
각 법안은 카드 형태로 표시:
제목 / 발의자(정당) / 발의일
요약 3줄 (AI 요약)
찬성/반대 여론 지표 (커뮤니티 투표 + 외부 여론조사 반영)
예상 처리 가능성 (AI 예측: 예, 불투명, 낮음)
[상세 보기] 버튼 → 전문 요약 + 관련 기사 + 토론방 연결

4. 맞춤형 대시보드 (개인화 - 로그인 후 오른쪽 상단에 노출)
관심 분야 선택 (예: 환경 + 노동)
팔로우 의원 / 정당 (해당 인물이 발의한 법안 자동 노출)
이슈 알림 ON/OFF (내 관심 키워드와 관련된 법안 발의 시 알림)

5. 법안 토론방 - 커뮤니티 참여 연계
법안별 토론방 (찬반 토론 + 투표)
“이 법안 주목하기” 기능 → 사용자들이 모으면 ‘핫이슈’ 탭에 자동 노출
AI 토론 요약: 토론 내용을 요약해서 중립적 포인트 제공

6. 공지사항
관리자에서 글 등록 하면 기본은 http://localhost:3000/notice 여기에 출력.
근데  boardId 즉 관리자에서  공지사항에 글을 등록할 때 카테고리를 선택해
전체, 이벤트, 업데이트 : 모든 사용자 게시판(http://localhost:3000/board/)에 출력
중요 : 관리자에서 지정한 특정 게시판(http://localhost:3000/board/)아래에 있는 에
      업데이트 만 사용자 게시판에 나오지 않는거야.

7. 정당 매뉴 추가
 - 참고: https://www.data.go.kr/iim/api/selectAPIAcountView.do
 - 하위 메뉴 : 더불어민주당 , 국민의힘 , 조국혁신당 , 개혁신당 
 - 각 정당 서브메인 구성
 - 각 정당별 국회의원 정보

(1) 정당 화면
정당 개요 (로고, 설립일, 대표자, 이념, 웹사이트 링크)
주요 정치인 목록 (썸네일 + 이름 + 직책)
최근 발의 법안 / 주요 정책
정당 관련 최신 뉴스

(2) 정치인 화면
프로필 (사진, 학력, 경력, 지역구, 정당)
소속 정당 로고 및 링크
최근 발언/뉴스 타임라인
발의한 법안 목록
공약 및 정책 (카테고리별 보기)
SNS/공식 사이트 연결

(3) 비교/검색 기능
정치인 비교: 공약, 학력, 경력, 정당을 나란히 비교
정당 비교: 정책 기조, 주요 공약, 대표 정치인
검색 필터: 이름, 정당, 지역구, 정책 카테고리


 향후 개발 프로세스:
  1. 개발: docker-compose -f docker-compose.dev.yml
  2. 테스트: 별도 테스트 환경 구성
  3. 운영: docker-compose -f docker-compose.prod.yml

개발 환경 (docker-compose.dev.yml)
  - 🔥 핫 리로드: 코드 수정시 즉시 반영
  - 🐛 디버깅: SQL 로그, 상세 로그 활성화
  - 🌐 외부 접근: 모든 포트 외부 노출
  - 📚 Swagger: API 문서 자동 생성

운영 환경 (docker-compose.prod.yml)
  - 🔒 보안: 내부 네트워크, 최소 포트만 노출
  - ⚡ 성능: 최적화된 설정
  - 📊 모니터링: 로그 수집, 메트릭 수집