# FactLab 운영 반영 절차

## 목차
1. [환경 분리 전략](#환경-분리-전략)
2. [개발 환경 구성](#개발-환경-구성)
3. [운영 환경 구성](#운영-환경-구성)
4. [배포 절차](#배포-절차)
5. [환경별 차이점](#환경별-차이점)

---

## 환경 분리 전략

### 환경 구분
- **개발환경(dev)**: 로컬 개발 및 테스트용
- **운영환경(prod)**: 실제 서비스 운영용

### 파일 구조
```
FactLab/
├── docker-compose.dev.yml     # 개발환경 설정
├── docker-compose.prod.yml    # 운영환경 설정
├── .env.dev                   # 개발환경 환경변수
├── .env.prod                  # 운영환경 환경변수
├── configs/
│   ├── nginx-dev.conf         # 개발환경 Nginx 설정
│   └── nginx-prod.conf        # 운영환경 Nginx 설정
└── database/
    ├── init-dev.sql          # 개발환경 초기 데이터
    └── init-prod.sql         # 운영환경 초기 데이터
```

---

## 개발 환경 구성

### 특징
- 🔥 **핫 리로드**: 코드 수정 시 즉시 반영
- 🐛 **디버깅**: SQL 로그, 상세 로그 활성화
- 🌐 **외부 접근**: 모든 포트 외부 노출
- 📚 **Swagger**: API 문서 자동 생성
- 🧪 **목업 데이터**: 개발/테스트용 샘플 데이터

### 포트 구성
```
User Service:     3000
Admin Service:    3001
Crawler Service:  3002
Backend API:      8080
Database:         5432
```

### 실행 명령어
```bash
# 개발 환경 시작
docker-compose -f docker-compose.dev.yml up -d

# 로그 확인
docker-compose -f docker-compose.dev.yml logs -f

# 개발 환경 중지
docker-compose -f docker-compose.dev.yml down
```

---

## 운영 환경 구성

### 특징
- 🔒 **보안**: 내부 네트워크, 최소 포트만 노출
- ⚡ **성능**: 최적화된 설정
- 📊 **모니터링**: 로그 수집, 메트릭 수집
- 🛡️ **보안**: HTTPS 강제, 보안 헤더 설정
- 📈 **확장성**: 로드 밸런싱, 캐싱 적용

### 포트 구성
```
Nginx:           80, 443 (외부 노출)
내부 서비스:      모든 포트 내부망에서만 접근
```

### 실행 명령어
```bash
# 운영 환경 시작
docker-compose -f docker-compose.prod.yml up -d

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f

# 운영 환경 중지
docker-compose -f docker-compose.prod.yml down
```

---

## 배포 절차

### 1단계: 개발 환경에서 개발 및 테스트
```bash
# 1. 개발 환경 실행
docker-compose -f docker-compose.dev.yml up -d

# 2. 기능 개발 및 테스트

# 3. 코드 커밋
git add .
git commit -m "feat: 새로운 기능 개발"
git push origin main
```

### 2단계: 운영 환경 준비
```bash
# 1. 환경변수 설정
cp .env.dev .env.prod
# .env.prod 파일에서 운영용 설정으로 수정

# 2. 운영용 설정 파일 확인
# - docker-compose.prod.yml
# - configs/nginx-prod.conf
# - database/init-prod.sql
```

### 3단계: 운영 환경 배포
```bash
# 1. 기존 운영 환경 중지 (무중단 배포 시 건너뛰기)
docker-compose -f docker-compose.prod.yml down

# 2. 최신 코드 반영
git pull origin main

# 3. 이미지 재빌드
docker-compose -f docker-compose.prod.yml build --no-cache

# 4. 운영 환경 시작
docker-compose -f docker-compose.prod.yml up -d

# 5. 헬스체크
curl http://localhost/health
```

### 4단계: 배포 검증
```bash
# 1. 서비스 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 2. 로그 확인
docker-compose -f docker-compose.prod.yml logs --tail=100

# 3. 기능 테스트
# - 사용자 페이지 접근 확인
# - 관리자 페이지 접근 확인
# - API 응답 확인
```

---

## 환경별 차이점

| 구분 | 개발환경 | 운영환경 |
|------|----------|----------|
| **포트 노출** | 모든 포트 외부 노출 | Nginx(80,443)만 노출 |
| **로그 레벨** | DEBUG | INFO/ERROR |
| **핫 리로드** | 활성화 | 비활성화 |
| **Swagger** | 활성화 | 비활성화 |
| **HTTPS** | 옵션 | 강제 |
| **캐싱** | 최소화 | 최적화 |
| **DB 연결** | 개발용 DB | 운영용 DB |
| **목업 데이터** | 포함 | 제외 |

---

## 주의사항

### 보안
- 운영환경에서는 절대 DEBUG 모드 비활성화
- 데이터베이스 비밀번호 등 민감 정보는 환경변수로 관리
- .env.prod 파일은 절대 Git에 커밋하지 않음

### 성능
- 운영환경에서는 이미지 최적화 및 압축 활성화
- 불필요한 로그 출력 최소화
- 데이터베이스 인덱스 최적화

### 모니터링
- 운영환경에서는 반드시 로그 수집 시스템 구성
- 서비스 헬스체크 엔드포인트 구현
- 장애 알림 시스템 구성

---

## 롤백 절차

### 긴급 롤백
```bash
# 1. 이전 버전으로 롤백
git checkout <이전_커밋_해시>

# 2. 운영 환경 재배포
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### 데이터베이스 롤백
```bash
# 1. 백업에서 복원
docker exec factlab_postgres psql -U factlab -d factlab_db < backup.sql

# 2. 서비스 재시작
docker-compose -f docker-compose.prod.yml restart
```