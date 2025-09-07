# 🚀 FactLab 운영 배포 가이드 - polradar.com

## 📋 배포 전 체크리스트

### 1. 환경 설정 준비
- [ ] `.env.prod` 파일에 운영 환경 변수 설정
- [ ] 강력한 DB 비밀번호 및 JWT 시크릿 설정
- [ ] 운영용 API 키들 (Gemini, Google, Naver, Kakao) 준비
- [ ] SSL 인증서 준비 (Let's Encrypt 또는 유료 인증서)

### 2. 보안 설정
- [ ] 방화벽 설정 (80, 443 포트만 외부 노출)
- [ ] SSH 키 기반 인증 설정
- [ ] 운영 서버 사용자 계정 생성 (sudo 권한)
- [ ] 로그 모니터링 시스템 설정

### 3. 인프라 준비
- [ ] Docker & Docker Compose 설치 확인
- [ ] 서버 리소스 확인 (최소 4GB RAM, 50GB Storage)
- [ ] 도메인 DNS 설정 (polradar.com → 서버 IP)
- [ ] CDN 설정 (선택사항)

## 🔧 배포 단계

### Phase 1: 서버 환경 설정

```bash
# 1. 서버 접속 및 프로젝트 클론
ssh user@polradar.com
git clone https://github.com/K-SYun/FactLab.git
cd FactLab

# 2. 환경 설정
cp .env.prod .env
# .env 파일에서 실제 운영 값들로 수정 필요

# 3. SSL 인증서 설정 (Let's Encrypt 사용 예시)
sudo apt install certbot
sudo certbot certonly --standalone -d polradar.com -d www.polradar.com

# 4. SSL 인증서를 nginx 볼륨에 복사
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/polradar.com/fullchain.pem nginx/ssl/polradar.com.crt
sudo cp /etc/letsencrypt/live/polradar.com/privkey.pem nginx/ssl/polradar.com.key
```

### Phase 2: 안전한 배포 실행

```bash
# 1. 배포 스크립트 권한 설정
chmod +x deploy-prod.sh

# 2. 배포 실행 (자동 백업 및 롤백 기능 포함)
./deploy-prod.sh
```

### Phase 3: 배포 후 확인

```bash
# 1. 서비스 상태 확인
docker-compose -f docker-compose.prod.yml ps

# 2. 로그 확인
docker-compose -f docker-compose.prod.yml logs -f

# 3. 웹사이트 접속 테스트
curl -I https://polradar.com
curl -I https://polradar.com:3001

# 4. 데이터베이스 연결 확인
docker exec -it factlab-database-prod psql -U factlab_prod_user -d factlab -c "SELECT COUNT(*) FROM news;"
```

## 🔄 운영 관리 명령어

### 일상적인 관리
```bash
# 서비스 재시작
docker-compose -f docker-compose.prod.yml restart

# 특정 서비스만 재시작
docker-compose -f docker-compose.prod.yml restart backend-service

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f --tail 100

# 리소스 사용량 확인
docker stats

# 디스크 사용량 정리
docker system prune -f
```

### 백업 및 복원
```bash
# 수동 백업 생성
mkdir -p backup/manual_$(date +%Y%m%d_%H%M%S)
docker run --rm -v factlab_postgres_data_prod:/data -v $(pwd)/backup/manual_$(date +%Y%m%d_%H%M%S):/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .

# 데이터베이스 SQL 덤프 백업
docker exec factlab-database-prod pg_dump -U factlab_prod_user factlab > backup/factlab_$(date +%Y%m%d_%H%M%S).sql

# 백업에서 복원 (긴급시)
docker-compose -f docker-compose.prod.yml down
docker volume rm factlab_postgres_data_prod
docker volume create factlab_postgres_data_prod
docker run --rm -v factlab_postgres_data_prod:/data -v $(pwd)/backup/BACKUP_FOLDER:/backup alpine tar xzf /backup/postgres_data.tar.gz -C /data
docker-compose -f docker-compose.prod.yml up -d
```

### 모니터링
```bash
# 실시간 로그 모니터링 (중요 키워드 필터링)
docker-compose -f docker-compose.prod.yml logs -f | grep -E "(ERROR|WARN|Exception|Failed)"

# 메모리 사용량 확인
docker exec factlab-backend-service-prod java -XX:+PrintFlagsFinal -version | grep MaxHeapSize

# 데이터베이스 성능 확인
docker exec -it factlab-database-prod psql -U factlab_prod_user -d factlab -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

## 🚨 문제 해결 가이드

### 배포 실패 시 대응
1. **자동 롤백 실행**: 배포 스크립트가 자동으로 이전 버전으로 롤백
2. **수동 롤백**: `./deploy-prod.sh rollback` 실행
3. **로그 분석**: 각 서비스별 로그에서 오류 원인 파악

### 일반적인 문제들
```bash
# 메모리 부족 시
# - Java 힙 사이즈 조정: .env.prod에서 JAVA_OPTS 수정
# - 불필요한 컨테이너 정리: docker container prune

# 디스크 공간 부족 시
# - 오래된 이미지 삭제: docker image prune -a
# - 로그 파일 정리: truncate -s 0 /var/lib/docker/containers/*/*-json.log

# 데이터베이스 연결 실패 시
# - 데이터베이스 컨테이너 재시작
# - 연결 설정 확인: .env 파일의 DB_* 변수들

# SSL 인증서 만료 시
# - 인증서 갱신: sudo certbot renew
# - nginx 컨테이너 재시작: docker-compose -f docker-compose.prod.yml restart nginx
```

## 📊 운영 모니터링

### 중요 메트릭 모니터링
- **응답 시간**: API 응답 시간 < 500ms
- **에러율**: 전체 요청의 < 1%
- **메모리 사용량**: < 80%
- **디스크 사용량**: < 85%
- **데이터베이스 연결 수**: < 80개

### 정기 작업
```bash
# 매일 자동 백업 (crontab -e)
0 2 * * * cd /path/to/FactLab && ./backup-daily.sh

# 주간 시스템 정리 (일요일 새벽 3시)
0 3 * * 0 docker system prune -f

# SSL 인증서 자동 갱신 (매월 1일)
0 0 1 * * sudo certbot renew && docker-compose -f docker-compose.prod.yml restart nginx
```

## 🔐 보안 고려사항

### 필수 보안 설정
1. **방화벽 설정**: UFW 또는 iptables로 불필요한 포트 차단
2. **SSL 강제**: HTTP → HTTPS 리다이렉트
3. **API 키 보안**: 환경 변수로만 관리, 코드에 하드코딩 금지
4. **정기 보안 업데이트**: OS 및 Docker 이미지 정기 업데이트
5. **로그 모니터링**: 비정상적인 접근 패턴 감지

### 접근 제한
- 관리자 페이지 IP 화이트리스트 설정
- 데이터베이스 직접 접근 차단
- SSH 키 기반 인증만 허용

## 📞 긴급 상황 대응

### 서비스 장애 시 체크리스트
1. [ ] 서비스 상태 확인: `docker-compose ps`
2. [ ] 로그 확인: `docker-compose logs -f`
3. [ ] 리소스 확인: `docker stats`, `df -h`, `free -h`
4. [ ] 네트워크 확인: `curl -I https://polradar.com`
5. [ ] 필요시 롤백: `./deploy-prod.sh rollback`

### 연락처 정보
- 개발팀: your-team@email.com
- 서버 관리: admin@polradar.com
- 응급 상황: +82-xxx-xxxx-xxxx

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 사항 |
|------|------|-----------|
| 2024-XX-XX | 1.0 | 초기 배포 가이드 작성 |

**⚠️ 중요**: 운영 배포 전에 반드시 스테이징 환경에서 전체 프로세스를 테스트하세요!