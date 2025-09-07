# FactLab 운영 배포 완전 가이드 (30GB 확장 후)

## 1. 서버 초기 설정 및 환경 준비

### 1.1 시스템 업데이트
```bash
# 시스템 패키지 업데이트
sudo apt update && sudo apt upgrade -y

# 필요한 패키지 설치
sudo apt install -y curl wget git vim htop
```

### 1.2 Docker 설치
```bash
# Docker 공식 GPG 키 추가
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Docker 저장소 추가
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker 설치
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 세션 재시작 (또는 로그아웃 후 재로그인)
newgrp docker
```

### 1.3 Node.js 설치 (빌드용)
```bash
# NodeSource 저장소 추가
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js 설치
sudo apt-get install -y nodejs

# 설치 확인
node --version
npm --version
```

## 2. 프로젝트 클론 및 설정

### 2.1 프로젝트 클론
```bash
# 홈 디렉토리로 이동
cd ~

# 기존 디렉토리가 있다면 삭제
sudo rm -rf FactLab

# 프로젝트 클론
git clone https://github.com/K-SYun/FactLab.git

# 프로젝트 디렉토리로 이동
cd FactLab

# 권한 설정
sudo chown -R $USER:$USER .
```

### 2.2 환경 변수 설정
```bash
# 운영 환경 변수 파일 생성
cp .env.example .env.prod

# 환경 변수 편집 (실제 값으로 수정 필요)
vim .env.prod
```

`.env` 파일 내용 예시:
```env
# 데이터베이스
DB_USERNAME=factlab_user
DB_PASSWORD=factlab123

# JWT Secret (운영용 강화 필요)
JWT_SECRET=production_jwt_secret_key_very_long_and_secure_512bits

# Redis Password (운영용)
REDIS_PASSWORD=redis_production_password

# Gemini AI API Key
GEMINI_API_KEY=your_actual_gemini_api_key

# Social Login Credentials (Backend용)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# Social Login Credentials (React Frontend용)
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_NAVER_CLIENT_ID=your_naver_client_id
REACT_APP_KAKAO_CLIENT_ID=your_kakao_client_id
```

## 3. 디스크 공간 확인 및 최적화

### 3.1 현재 디스크 상태 확인
```bash
# 디스크 사용량 확인
df -h

# 파일 시스템 크기 조정 (30GB 인식)
sudo resize2fs /dev/sda1

# 다시 확인
df -h
```

### 3.2 시스템 정리
```bash
# 불필요한 패키지 제거
sudo apt autoremove -y
sudo apt autoclean

# Docker 시스템 정리
docker system prune -f
docker volume prune -f
docker network prune -f
```

## 4. 운영 배포 실행

### 4.1 React 앱 빌드 (선택사항 - Docker에서 자동 빌드됨)
```bash
# User Service 빌드
cd user_service
npm install --production
npm run build
cd ..
```

### 4.2 Docker 이미지 빌드
```bash
# 운영용 Docker Compose로 이미지 빌드 (캐시 없이)
docker-compose -f docker-compose.prod.yml build --no-cache --parallel

# 빌드 상태 확인
docker images
```

### 4.3 서비스 시작
```bash
# 운영 환경으로 서비스 시작
docker-compose -f docker-compose.prod.yml up -d

# 서비스 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f
```

## 5. 서비스 확인 및 검증

### 5.1 컨테이너 상태 확인
```bash
# 실행 중인 컨테이너 확인
docker ps

# 각 서비스 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 특정 서비스 로그 확인
docker-compose -f docker-compose.prod.yml logs user-service
docker-compose -f docker-compose.prod.yml logs postgres
docker-compose -f docker-compose.prod.yml logs nginx
```

### 5.2 서비스 접근 테스트
```bash
# Nginx 상태 확인 (로컬에서)
curl -I http://localhost

# User Service 직접 접근 테스트
curl -I http://localhost:3000

# Health Check
curl http://localhost/health || echo "Health endpoint not available"
```

### 5.3 방화벽 설정 (Google Cloud)
```bash
# 구글 클라우드 방화벽 규칙 확인 (gcloud CLI 필요)
# 또는 Google Cloud Console에서 확인

# 80, 443 포트가 열려있는지 확인
sudo ufw status
```

## 6. 모니터링 및 유지보수

### 6.1 시스템 모니터링
```bash
# 디스크 사용량 지속 모니터링
watch -n 30 df -h

# 메모리 사용량 확인
free -h

# Docker 리소스 사용량
docker stats
```

### 6.2 로그 모니터링
```bash
# 실시간 로그 모니터링
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# 특정 시간 이후 로그만 보기
docker-compose -f docker-compose.prod.yml logs --since="1h"
```

### 6.3 백업 설정
```bash
# 데이터베이스 백업 스크립트 생성
cat > backup_db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec factlab_postgres_1 pg_dump -U factlab_user factlab_db > backup_$DATE.sql
echo "Database backup created: backup_$DATE.sql"
EOF

chmod +x backup_db.sh
```

## 7. 문제 해결

### 7.1 서비스가 시작되지 않는 경우
```bash
# 모든 서비스 중지
docker-compose -f docker-compose.prod.yml down

# 볼륨도 함께 제거 (주의: 데이터 손실)
docker-compose -f docker-compose.prod.yml down -v

# 이미지 재빌드
docker-compose -f docker-compose.prod.yml build --no-cache

# 다시 시작
docker-compose -f docker-compose.prod.yml up -d
```

### 7.2 디스크 공간 부족 시
```bash
# Docker 정리
docker system prune -af
docker volume prune -f

# 로그 파일 정리
sudo find /var/log -type f -name "*.log" -exec truncate -s 0 {} \;

# 임시 파일 정리
sudo rm -rf /tmp/*
sudo apt clean
```

### 7.3 네트워크 문제
```bash
# Docker 네트워크 확인
docker network ls

# 네트워크 재생성
docker-compose -f docker-compose.prod.yml down
docker network prune -f
docker-compose -f docker-compose.prod.yml up -d
```

## 8. 업데이트 절차

### 8.1 코드 업데이트
```bash
# 현재 상태 백업
docker-compose -f docker-compose.prod.yml down
cp -r . ../FactLab_backup_$(date +%Y%m%d_%H%M%S)

# 최신 코드 받기
git stash  # 로컬 변경사항 임시 저장
git pull origin main
git stash pop  # 로컬 변경사항 복원

# 재배포
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 9. 성능 최적화

### 9.1 메모리 최적화
```bash
# 스왑 파일 생성 (메모리 부족 시)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 9.2 Docker 최적화
```bash
# Docker 로그 크기 제한 설정
sudo vim /etc/docker/daemon.json
```

`/etc/docker/daemon.json`:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
# Docker 재시작
sudo systemctl restart docker

# 서비스 재시작
docker-compose -f docker-compose.prod.yml restart
```

## 완료 체크리스트

- [ ] Docker 및 Docker Compose 설치
- [ ] 프로젝트 클론 완료
- [ ] 환경 변수 설정 완료
- [ ] 30GB 디스크 인식 확인
- [ ] Docker 이미지 빌드 성공
- [ ] 모든 서비스 정상 실행
- [ ] 웹사이트 접근 가능 확인
- [ ] 로그 모니터링 설정
- [ ] 백업 스크립트 준비

## 접근 URL
- 메인 사이트: http://your-server-ip
- User Service: http://your-server-ip:3000
- Admin Service: http://your-server-ip:3001 (배포 시)

---

배포 완료 후 `docker-compose -f docker-compose.prod.yml ps`로 모든 서비스가 정상 실행되는지 확인하세요.