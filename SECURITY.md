# 🔐 FactLab 클라우드 보안 가이드

## 🚨 배포 전 필수 보안 체크리스트

### 1. 환경 변수 설정 (❗ 필수)
```bash
# .env 파일 생성 (절대 GitHub에 커밋하지 말 것)
cp .env.example .env

# 반드시 변경해야 할 값들:
DB_PASSWORD=         # 최소 16자, 특수문자 포함
REDIS_PASSWORD=      # 최소 16자, 특수문자 포함  
JWT_SECRET=         # 최소 32바이트, 랜덤 생성
GEMINI_API_KEY=     # Google AI Studio에서 발급
```

#### 🔑 안전한 패스워드 생성
```bash
# 데이터베이스 패스워드 생성 (32자)
openssl rand -base64 32

# JWT Secret 생성 (64바이트)
openssl rand -base64 64

# Redis 패스워드 생성
openssl rand -hex 16
```

### 2. SSL/TLS 인증서 설정 (❗ 필수)
```bash
# Let's Encrypt 인증서 발급
chmod +x nginx/ssl-setup.sh
sudo ./nginx/ssl-setup.sh

# 인증서 자동 갱신 확인
sudo crontab -l | grep certbot
```

### 3. 방화벽 설정 (❗ 필수)
```bash
# UFW 방화벽 활성화
sudo ufw enable

# 필요한 포트만 개방
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (HTTPS 리다이렉트용)
sudo ufw allow 443/tcp   # HTTPS

# 불필요한 포트 차단 확인
sudo ufw status numbered
```

### 4. Docker 보안 설정
```bash
# Docker 데몬 보안 강화
sudo systemctl edit docker

# 다음 내용 추가:
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd --icc=false --userland-proxy=false --live-restore

sudo systemctl daemon-reload
sudo systemctl restart docker
```

---

## 🛡️ 보안 강화 구성

### 네트워크 보안
- ✅ **HTTPS 강제 적용** (HTTP → HTTPS 리다이렉트)
- ✅ **내부 네트워크 분리** (frontend/backend/monitoring)
- ✅ **Rate Limiting** (API: 10req/s, Login: 1req/s)
- ✅ **IP 화이트리스트** (관리자 페이지 접근 제한)

### 애플리케이션 보안  
- ✅ **Spring Security 활성화** (CSRF, XSS 방지)
- ✅ **JWT 토큰 기반 인증** (1시간 만료)
- ✅ **세션 보안** (Redis 저장, 30분 만료)
- ✅ **입력값 검증** (Bean Validation)
- ✅ **SQL Injection 방지** (JPA Repository)

### 데이터베이스 보안
- ✅ **외부 포트 차단** (내부 Docker 네트워크만 허용)
- ✅ **강력한 인증** (SCRAM-SHA-256)
- ✅ **연결 암호화** (SSL/TLS)
- ✅ **자동 백업** (일일 백업, 7일 보관)
- ✅ **접근 로그** (연결/쿼리 기록)

### 컨테이너 보안
- ✅ **Non-root 사용자** 실행
- ✅ **읽기 전용 파일시스템**
- ✅ **리소스 제한** (메모리, CPU)
- ✅ **보안 옵션** (no-new-privileges)
- ✅ **헬스체크** 활성화

---

## 🚀 Production 배포 절차

### 1단계: 서버 준비
```bash
# Ubuntu 20.04/22.04 권장
sudo apt update && sudo apt upgrade -y

# Docker 및 Docker Compose 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2단계: 코드 배포
```bash
# 소스 코드 다운로드
git clone https://github.com/your-repo/factlab.git
cd factlab

# 환경 변수 설정
cp .env.example .env
nano .env  # 실제 값들로 변경

# Production 설정 파일 교체
cp nginx/nginx-secure.conf nginx/nginx.conf
cp docker-compose-secure.yml docker-compose.yml
cp backend_service/pom-secure.xml backend_service/pom.xml
```

### 3단계: SSL 인증서 발급
```bash
# 도메인이 서버를 향하고 있는지 확인
nslookup polradar.com

# SSL 인증서 발급
chmod +x nginx/ssl-setup.sh
sudo ./nginx/ssl-setup.sh
```

### 4단계: 애플리케이션 시작
```bash
# 프로덕션 모드로 빌드 및 시작
docker-compose build --no-cache
docker-compose up -d

# 상태 확인
docker-compose ps
docker-compose logs -f
```

### 5단계: 보안 검증
```bash
# SSL 등급 테스트
curl -I https://polradar.com

# 포트 스캔 테스트
nmap -p 1-65535 your-server-ip

# 헤더 보안 검증
curl -I https://polradar.com | grep -E "(X-|Strict|Content-Security)"
```

---

## 🔍 보안 모니터링

### 로그 모니터링
```bash
# 접근 로그 실시간 모니터링
docker-compose logs -f nginx

# 데이터베이스 로그 확인
docker-compose exec database tail -f /var/lib/postgresql/data/log/postgresql-*.log

# 애플리케이션 로그 확인
docker-compose logs -f backend-service
```

### 보안 알림 설정
```bash
# fail2ban 설치 (브루트포스 방지)
sudo apt install fail2ban

# /etc/fail2ban/jail.local 생성
sudo tee /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600  
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 6
EOF

sudo systemctl restart fail2ban
```

### 자동화된 백업
```bash
# 데이터베이스 백업 스크립트
sudo tee /etc/cron.daily/factlab-backup <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/factlab-backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 데이터베이스 백업
docker-compose exec -T database pg_dump -U factlab_user factlab > $BACKUP_DIR/db_backup_$DATE.sql

# 설정 파일 백업  
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz .env docker-compose.yml nginx/

# 7일 이전 백업 삭제
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

# 백업 결과 로그
echo "$(date): Backup completed" >> /var/log/factlab-backup.log
EOF

sudo chmod +x /etc/cron.daily/factlab-backup
```

---

## ⚠️ 보안 위험 요소 체크

### 🔴 Critical (즉시 수정 필요)
- [ ] 기본 패스워드 사용 (`password`, `admin` 등)
- [ ] HTTP Only 서비스 (HTTPS 미적용)
- [ ] 외부에서 데이터베이스 포트 접근 가능
- [ ] Spring Security 비활성화
- [ ] JWT Secret 하드코딩

### 🟡 High (우선 수정 권장)
- [ ] 관리자 페이지 IP 제한 미적용
- [ ] Rate Limiting 미적용  
- [ ] 로그 모니터링 미설정
- [ ] 자동 백업 미설정
- [ ] SSL 인증서 자동 갱신 미설정

### 🟢 Medium (개선 사항)
- [ ] 2FA 인증 미적용
- [ ] 취약점 스캐닝 도구 미도입
- [ ] 침입 탐지 시스템(IDS) 미적용
- [ ] 로그 중앙화 시스템 미구축

---

## 🛠️ 보안 도구 추천

### 취약점 스캐닝
```bash
# OWASP ZAP (웹 애플리케이션 보안 테스트)
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://polradar.com

# Nmap (포트 스캔)
nmap -sS -O -p- your-server-ip
```

### SSL 보안 검사
```bash
# SSL Labs 테스트
curl -s "https://api.ssllabs.com/api/v3/analyze?host=polradar.com" | jq '.endpoints[0].grade'

# testssl.sh
git clone https://github.com/drwetter/testssl.sh.git
cd testssl.sh
./testssl.sh https://polradar.com
```

---

## 📞 보안 사고 대응

### 1. 즉시 대응 
```bash
# 의심스러운 접근 차단
sudo ufw deny from suspicious-ip

# 서비스 긴급 중단
docker-compose down

# 로그 백업 및 분석
docker-compose logs > security-incident-$(date +%Y%m%d).log
```

### 2. 복구 절차
```bash
# 최신 백업으로 복원
docker-compose down
docker volume rm factlab_postgres_data
# 백업에서 데이터 복원 후
docker-compose up -d
```

### 3. 보안 강화
```bash
# 모든 패스워드 변경
# JWT Secret 재생성  
# 로그 분석 후 취약점 패치
# 모니터링 강화
```

---

## ✅ 보안 검증 완료 시

이 체크리스트의 모든 항목을 완료한 후에만 Production 환경에 배포하세요.

- [ ] 환경 변수 보안 설정 완료
- [ ] HTTPS/SSL 인증서 적용 완료  
- [ ] 방화벽 및 네트워크 보안 완료
- [ ] 애플리케이션 보안 설정 완료
- [ ] 데이터베이스 보안 강화 완료
- [ ] 컨테이너 보안 설정 완료
- [ ] 모니터링 및 로깅 설정 완료
- [ ] 백업 및 복구 절차 검증 완료
- [ ] 보안 테스트 통과 완료

**🎯 목표 보안 등급: A+ (SSL Labs), 95+ (Mozilla Observatory)**
