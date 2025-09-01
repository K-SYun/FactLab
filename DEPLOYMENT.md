# PolRadar 클라우드 배포 가이드

## 배포 준비 체크리스트

### 1. 환경 변수 설정
```bash
# .env.example을 복사해서 .env 파일 생성
cp .env.example .env

# .env 파일을 열어서 실제 값들로 변경
nano .env
```

**필수 설정 항목:**
- `DB_PASSWORD`: 강력한 데이터베이스 비밀번호
- `JWT_SECRET`: 최소 32자리 JWT 시크릿 키
- `REDIS_PASSWORD`: Redis 비밀번호
- `GEMINI_API_KEY`: Google Gemini API 키
- OAuth 클라이언트 ID/Secret (Google, Naver, Kakao)

### 2. 도메인 DNS 설정
- polradar.com → 서버 IP 주소
- www.polradar.com → 서버 IP 주소

### 3. 서버 방화벽 설정
```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## 배포 실행

### 간단 배포
```bash
# 배포 스크립트 실행
./deploy-production.sh
```

### SSL 인증서와 함께 배포
```bash
# SSL 인증서 자동 발급과 함께 배포
./deploy-production.sh ssl
```

### 수동 배포 단계

1. **환경 변수 확인**
```bash
# .env 파일이 존재하는지 확인
ls -la .env
```

2. **보안 설정 활성화**
```bash
# 보안 설정 파일들을 메인 파일로 복사
cp nginx/nginx-secure.conf nginx/nginx.conf
cp docker-compose-secure.yml docker-compose.yml  
cp backend_service/pom-secure.xml backend_service/pom.xml
```

3. **서비스 배포**
```bash
# 기존 컨테이너 정리
docker-compose down -v
docker system prune -f

# 새 이미지 빌드
docker-compose build --no-cache

# 서비스 시작
docker-compose up -d
```

4. **SSL 인증서 발급** (선택사항)
```bash
# Let's Encrypt 인증서 발급
docker-compose run --rm certbot
```

## 배포 후 확인사항

### 서비스 상태 확인
```bash
# 모든 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f nginx
docker-compose logs -f backend-service
docker-compose logs -f database
```

### 웹사이트 접속 테스트
- 사용자 사이트: https://polradar.com
- 관리자 사이트: https://polradar.com/admin
- API 문서: https://polradar.com/api/swagger-ui/index.html

### 기능 테스트
1. **사용자 기능**
   - 회원가입/로그인
   - 뉴스 조회
   - 댓글 작성
   - 게시판 이용

2. **관리자 기능**
   - 관리자 로그인
   - 사용자 관리
   - 뉴스 관리
   - AI 분석 기능

## 문제 해결

### 일반적인 문제들

**1. 서비스가 시작되지 않는 경우**
```bash
# 자세한 로그 확인
docker-compose logs [service-name]

# 컨테이너 재시작
docker-compose restart [service-name]
```

**2. 데이터베이스 연결 실패**
```bash
# .env 파일의 DB_PASSWORD 확인
# PostgreSQL 컨테이너 로그 확인
docker-compose logs database
```

**3. SSL 인증서 문제**
```bash
# 도메인 DNS 설정 확인
nslookup polradar.com

# nginx 설정 테스트
docker-compose exec nginx nginx -t
```

**4. 메모리 부족 오류**
```bash
# 시스템 리소스 확인
free -h
df -h

# 불필요한 Docker 이미지 정리
docker system prune -a
```

## 보안 설정 요약

- **HTTPS 강제 리다이렉트**
- **보안 헤더** (HSTS, CSP, X-Frame-Options 등)
- **Rate Limiting** (API 10req/s, 로그인 1req/s)
- **네트워크 격리** (Frontend/Backend 분리)
- **컨테이너 보안** (read-only, no-new-privileges)
- **데이터베이스 보안** (내부 네트워크만 접근)

## 모니터링

### 로그 확인
```bash
# 실시간 로그 모니터링
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f nginx
docker-compose logs -f backend-service
```

### 시스템 리소스 모니터링
```bash
# 컨테이너 리소스 사용량
docker stats

# 시스템 전체 리소스
htop
```

### Grafana/Loki 로그 집계 (설정된 경우)
- Loki: http://your-server:3100
- Grafana 대시보드 설정 가능

## 백업

### 데이터베이스 백업
```bash
# 자동 백업 (매일 실행됨)
docker-compose logs db-backup

# 수동 백업
docker-compose exec database pg_dump -U factlab_user factlab > backup.sql
```

### 전체 데이터 백업
```bash
# Docker 볼륨 백업
docker run --rm -v factlab_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres_backup.tar.gz -C /data .
```