# 운영 환경 DB 연결 확인 가이드

## 수정된 사항

### 1. Admin Service API 연결 수정
- `admin_service/src/api/axiosInstance.ts`에서 polradar.com 도메인 인식 추가
- 운영 환경에서 `/api` 경로로 nginx 프록시를 통해 백엔드 서비스 연결

### 2. 운영 환경 확인 명령어

#### 컨테이너 상태 확인
```bash
# 운영 서버에서 실행
docker-compose -f docker-compose.prod.yml ps

# 네트워크 연결 확인
docker network ls
docker network inspect factlab_backend
```

#### DB 연결 확인
```bash
# 백엔드 서비스 로그 확인
docker-compose -f docker-compose.prod.yml logs backend-service

# 데이터베이스 직접 연결 테스트
docker-compose -f docker-compose.prod.yml exec database psql -U factlab_user -d factlab -c "SELECT version();"
```

#### 관리자 화면 API 연결 확인
```bash
# nginx 로그 확인
docker-compose -f docker-compose.prod.yml logs nginx

# 브라우저에서 확인: https://polradar.com/admin
# 개발자 도구 > Network 탭에서 API 호출 확인
```

## 운영 환경 재배포

### 1. 기존 컨테이너 중지
```bash
docker-compose -f docker-compose.prod.yml down
```

### 2. 관리자 서비스 이미지 재빌드
```bash
docker-compose -f docker-compose.prod.yml build --no-cache admin-service
```

### 3. 전체 서비스 재시작
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 4. 상태 확인
```bash
# 모든 서비스 정상 실행 확인
docker-compose -f docker-compose.prod.yml ps

# 관리자 서비스 로그 확인
docker-compose -f docker-compose.prod.yml logs -f admin-service

# 백엔드 서비스 DB 연결 확인
docker-compose -f docker-compose.prod.yml logs backend-service | grep -i "database\|postgresql\|connection"
```

## 트러블슈팅

### 1. DB 연결 실패 시
- 환경변수 확인: `.env` 파일의 DB_PASSWORD 등
- 컨테이너 네트워크 확인: backend 네트워크에 database와 backend-service 모두 연결되어 있는지
- 데이터베이스 초기화 상태 확인

### 2. 관리자 화면 API 에러 시
- nginx 프록시 설정 확인: `/admin/` → `admin-service:3001/`
- CORS 설정 확인: `application-prod.yml`의 cors 설정
- JWT 토큰 확인: localStorage의 adminToken

### 3. 로그 확인 명령어
```bash
# 전체 로그 확인
docker-compose -f docker-compose.prod.yml logs

# 특정 서비스 로그 실시간 확인
docker-compose -f docker-compose.prod.yml logs -f admin-service
docker-compose -f docker-compose.prod.yml logs -f backend-service
```