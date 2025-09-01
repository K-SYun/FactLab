#!/bin/bash

# FactLab Production 배포 스크립트
set -e

echo "🚀 FactLab Production 배포 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 환경 변수 확인
check_env_vars() {
    log_info "환경 변수 확인 중..."
    
    required_vars=(
        "DB_PASSWORD"
        "REDIS_PASSWORD" 
        "JWT_SECRET"
        "GEMINI_API_KEY"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "다음 환경 변수가 설정되지 않았습니다:"
        printf '%s\n' "${missing_vars[@]}"
        exit 1
    fi
    
    log_info "환경 변수 확인 완료 ✅"
}

# Docker 및 Docker Compose 설치 확인
check_docker() {
    log_info "Docker 설치 확인 중..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker가 설치되지 않았습니다."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose가 설치되지 않았습니다."
        exit 1
    fi
    
    log_info "Docker 확인 완료 ✅"
}

# 보안 설정 파일 배치
setup_security_configs() {
    log_info "보안 설정 파일 적용 중..."
    
    # Nginx 보안 설정
    if [[ -f "nginx/nginx-secure.conf" ]]; then
        cp nginx/nginx-secure.conf nginx/nginx.conf
        log_info "Nginx 보안 설정 적용 완료"
    fi
    
    # Docker Compose 보안 설정
    if [[ -f "docker-compose-secure.yml" ]]; then
        cp docker-compose-secure.yml docker-compose.yml
        log_info "Docker Compose 보안 설정 적용 완료"
    fi
    
    # Backend pom.xml 보안 설정
    if [[ -f "backend_service/pom-secure.xml" ]]; then
        cp backend_service/pom-secure.xml backend_service/pom.xml
        log_info "Backend 보안 설정 적용 완료"
    fi
    
    log_info "보안 설정 파일 적용 완료 ✅"
}

# SSL 인증서 확인
check_ssl() {
    log_info "SSL 인증서 확인 중..."
    
    if [[ ! -f "/etc/letsencrypt/live/polradar.com/fullchain.pem" ]]; then
        log_warn "SSL 인증서가 없습니다. 수동으로 발급해주세요:"
        log_warn "sudo ./nginx/ssl-setup.sh"
        
        read -p "SSL 인증서 없이 계속 진행하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_info "SSL 인증서 확인 완료 ✅"
    fi
}

# 방화벽 설정 확인
check_firewall() {
    log_info "방화벽 설정 확인 중..."
    
    if command -v ufw &> /dev/null; then
        ufw_status=$(sudo ufw status | head -n1)
        if [[ $ufw_status == *"inactive"* ]]; then
            log_warn "방화벽이 비활성화되어 있습니다."
            read -p "방화벽을 활성화하시겠습니까? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                sudo ufw allow 22/tcp
                sudo ufw allow 80/tcp
                sudo ufw allow 443/tcp
                sudo ufw --force enable
                log_info "방화벽 활성화 완료"
            fi
        else
            log_info "방화벽이 활성화되어 있습니다 ✅"
        fi
    else
        log_warn "UFW가 설치되지 않았습니다."
    fi
}

# 기존 컨테이너 정리
cleanup_containers() {
    log_info "기존 컨테이너 정리 중..."
    
    if [[ -f "docker-compose.yml" ]]; then
        docker-compose down --remove-orphans
        docker system prune -f
        log_info "컨테이너 정리 완료 ✅"
    fi
}

# 애플리케이션 빌드 및 시작
deploy_application() {
    log_info "애플리케이션 빌드 중..."
    
    # 환경 변수 로드
    if [[ -f ".env" ]]; then
        source .env
    fi
    
    # 빌드 및 시작
    docker-compose build --no-cache --parallel
    docker-compose up -d
    
    log_info "애플리케이션 배포 완료 ✅"
}

# 헬스체크
health_check() {
    log_info "헬스체크 실행 중..."
    
    # 서비스 시작까지 대기
    sleep 30
    
    services=("nginx" "backend-service" "database" "redis")
    
    for service in "${services[@]}"; do
        if docker-compose ps $service | grep -q "Up"; then
            log_info "$service 서비스 정상 ✅"
        else
            log_error "$service 서비스 실행 실패"
            docker-compose logs $service
            exit 1
        fi
    done
    
    # HTTP 응답 확인
    if curl -f -s http://localhost/health > /dev/null; then
        log_info "HTTP 헬스체크 통과 ✅"
    else
        log_error "HTTP 헬스체크 실패"
        exit 1
    fi
}

# 보안 검증
security_check() {
    log_info "보안 검증 실행 중..."
    
    # 포트 검사
    open_ports=$(ss -tuln | grep -E ':(22|80|443)\s' | wc -l)
    if [[ $open_ports -eq 3 ]]; then
        log_info "포트 보안 검증 통과 ✅"
    else
        log_warn "예상치 못한 열린 포트가 있습니다:"
        ss -tuln | grep -v '127.0.0.1'
    fi
    
    # SSL 검증 (인증서가 있는 경우)
    if [[ -f "/etc/letsencrypt/live/polradar.com/fullchain.pem" ]]; then
        if curl -f -s https://localhost > /dev/null; then
            log_info "SSL 검증 통과 ✅"
        else
            log_warn "SSL 검증 실패"
        fi
    fi
    
    log_info "보안 검증 완료 ✅"
}

# 백업 설정
setup_backup() {
    log_info "백업 설정 중..."
    
    # 백업 디렉토리 생성
    sudo mkdir -p /opt/factlab-backups
    sudo chown $USER:$USER /opt/factlab-backups
    
    # 백업 스크립트 생성
    sudo tee /etc/cron.daily/factlab-backup > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/factlab-backups"
DATE=$(date +%Y%m%d_%H%M%S)
cd /path/to/factlab

# 데이터베이스 백업
docker-compose exec -T database pg_dump -U factlab_user factlab > $BACKUP_DIR/db_backup_$DATE.sql

# 7일 이전 백업 삭제
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "$(date): Backup completed" >> /var/log/factlab-backup.log
EOF
    
    sudo chmod +x /etc/cron.daily/factlab-backup
    log_info "백업 설정 완료 ✅"
}

# 배포 정보 출력
print_deployment_info() {
    echo ""
    echo "🎉 FactLab 배포 완료!"
    echo ""
    echo "📊 서비스 상태:"
    docker-compose ps
    echo ""
    echo "🌐 접속 정보:"
    echo "  - 사용자 사이트: http://localhost (또는 https://polradar.com)"
    echo "  - 관리자 페이지: http://localhost/admin (또는 https://polradar.com/admin)"
    echo "  - API 문서: http://localhost/api/v3/api-docs (개발 모드에서만)"
    echo ""
    echo "📋 유용한 명령어:"
    echo "  - 로그 확인: docker-compose logs -f"
    echo "  - 서비스 재시작: docker-compose restart"
    echo "  - 서비스 중지: docker-compose down"
    echo ""
    echo "🔐 보안 점검:"
    echo "  - SSL 등급 확인: https://www.ssllabs.com/ssltest/"
    echo "  - 헤더 보안 확인: https://securityheaders.com/"
    echo ""
}

# 메인 실행 함수
main() {
    # 환경 변수 로드
    if [[ -f ".env" ]]; then
        source .env
    fi
    
    # 실행 단계
    check_docker
    check_env_vars
    setup_security_configs
    check_ssl
    check_firewall
    cleanup_containers
    deploy_application
    health_check
    security_check
    setup_backup
    print_deployment_info
    
    log_info "배포가 성공적으로 완료되었습니다! 🎉"
}

# 스크립트 실행
main "$@"