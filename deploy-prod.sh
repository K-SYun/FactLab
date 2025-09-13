#!/bin/bash
# FactLab 운영 배포 스크립트 - polradar.com
# 안전한 배포를 위한 단계별 스크립트

set -e  # 에러 발생시 스크립트 중단

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

# 환경 변수 체크
check_environment() {
    log "환경 변수 및 설정 파일 확인 중..."
    
    if [ ! -f ".env" ]; then
        error ".env 파일이 없습니다. 운영 환경 변수를 먼저 설정하세요."
    fi
    
    if [ ! -f "docker-compose.prod.yml" ]; then
        error "docker-compose.prod.yml 파일이 없습니다."
    fi
    
    # 필수 환경 변수 확인
    source .env
    if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "PRODUCTION_PASSWORD_HERE" ]; then
        error "운영 DB 비밀번호가 설정되지 않았습니다."
    fi
    
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "PRODUCTION_JWT_SECRET_512BITS_SECURE_KEY_HERE" ]; then
        error "운영 JWT 시크릿이 설정되지 않았습니다."
    fi
    
    success "환경 변수 확인 완료"
}

# 백업 생성
create_backup() {
    log "현재 운영 환경 백업 생성 중..."
    
    BACKUP_DIR="backup/$(date +'%Y%m%d_%H%M%S')"
    mkdir -p $BACKUP_DIR
    
    # Docker 볼륨 백업
    if docker volume ls | grep -q "factlab_postgres_data_prod"; then
        log "데이터베이스 백업 중..."
        docker run --rm -v factlab_postgres_data_prod:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
        success "데이터베이스 백업 완료: $BACKUP_DIR/postgres_data.tar.gz"
    fi
    
    # 설정 파일 백업
    cp -r nginx $BACKUP_DIR/ 2>/dev/null || true
    cp .env $BACKUP_DIR/ 2>/dev/null || true
    
    success "백업 생성 완료: $BACKUP_DIR"
    echo "BACKUP_DIR=$BACKUP_DIR" > .last_backup
}

# 서비스 중단 (무중단 배포를 위해 단계적 중단)
stop_services() {
    log "서비스 단계적 중단 중..."
    
    # nginx를 제외한 서비스부터 중단
    docker-compose -f docker-compose.prod.yml stop crawler-service ai-service admin-service user-service backend-service || true
    
    sleep 5
    
    # nginx 중단 (트래픽 차단)
    docker-compose -f docker-compose.prod.yml stop nginx || true
    
    # 모든 컨테이너 정리
    docker-compose -f docker-compose.prod.yml down || true
    
    success "서비스 중단 완료"
}

# 이미지 빌드 및 배포
deploy_services() {
    log "운영 이미지 빌드 중..."
    
    # 캐시 없이 전체 이미지 재빌드
    docker-compose --env-file .env -f docker-compose.prod.yml build --no-cache --parallel
    
    log "서비스 시작 중..."
    
    # 데이터베이스부터 시작
    docker-compose --env-file .env -f docker-compose.prod.yml up -d database
    sleep 30  # DB 초기화 대기
    
    # 백엔드 서비스 시작
    docker-compose --env-file .env -f docker-compose.prod.yml up -d backend-service
    sleep 20  # 백엔드 초기화 대기
    
    # AI 및 크롤러 서비스 시작
    docker-compose --env-file .env -f docker-compose.prod.yml up -d ai-service crawler-service
    sleep 15
    
    # 프론트엔드 서비스 시작
    docker-compose --env-file .env -f docker-compose.prod.yml up -d user-service admin-service
    sleep 15
    
    # 마지막에 nginx 시작 (트래픽 복구)
    docker-compose --env-file .env -f docker-compose.prod.yml up -d nginx
    
    success "서비스 배포 완료"
}

# 헬스체크
health_check() {
    log "서비스 헬스체크 진행 중..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "헬스체크 시도 $attempt/$max_attempts"
        
        # 각 서비스 상태 확인
        if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
            success "User Service 정상"
        else
            warn "User Service 응답 없음"
        fi
        
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200\|301\|302"; then
            success "Admin Service 정상"
        else
            warn "Admin Service 응답 없음"
        fi
        
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health | grep -q "200"; then
            success "Backend Service 정상"
            break
        else
            warn "Backend Service 응답 없음"
        fi
        
        sleep 10
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        error "헬스체크 실패. 롤백을 고려하세요."
    fi
    
    success "모든 서비스 정상 동작 확인"
}

# 롤백 함수
rollback() {
    error "배포 실패. 롤백 진행..."
    
    if [ -f ".last_backup" ]; then
        source .last_backup
        log "백업에서 복원 중: $BACKUP_DIR"
        
        # 서비스 중단
        docker-compose -f docker-compose.prod.yml down
        
        # 데이터 복원
        if [ -f "$BACKUP_DIR/postgres_data.tar.gz" ]; then
            docker volume rm factlab_postgres_data_prod 2>/dev/null || true
            docker volume create factlab_postgres_data_prod
            docker run --rm -v factlab_postgres_data_prod:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar xzf /backup/postgres_data.tar.gz -C /data
        fi
        
        # 이전 서비스 시작
        docker-compose -f docker-compose.prod.yml up -d
        
        warn "롤백 완료. 서비스를 확인하세요."
    else
        error "백업 정보를 찾을 수 없습니다. 수동 복구가 필요합니다."
    fi
}

# 메인 배포 프로세스
main() {
    log "FactLab 운영 배포 시작 - polradar.com"
    
    # 사전 확인
    check_environment
    
    # 사용자 확인
    echo -n -e "${YELLOW}운영 환경에 배포하시겠습니까? (y/N): ${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log "배포가 취소되었습니다."
        exit 0
    fi
    
    # 배포 실행
    create_backup || rollback
    stop_services || rollback
    deploy_services || rollback
    health_check || rollback
    
    success "🎉 FactLab 운영 배포 완료!"
    success "🌐 사이트: https://polradar.com"
    success "⚙️  관리자: https://polradar.com:3001"
    
    log "배포 후 확인사항:"
    log "1. 웹사이트 정상 접속 확인"
    log "2. 크롤링 작동 확인"
    log "3. AI 분석 기능 확인"
    log "4. 데이터베이스 연결 확인"
    log "5. SSL 인증서 확인"
}

# 스크립트 실행
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi