#!/bin/bash

# PolRadar 빠른 배포 스크립트 (테스트용)
# 클라우드 서버에서 실행하는 간단한 배포 스크립트

echo "⚡ PolRadar 빠른 배포 (테스트용)..."

# .env 파일 체크
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없어서 기본값으로 생성합니다."
    echo "실제 운영에서는 .env 파일의 값들을 수정해야 합니다!"
    
    cat > .env << EOF
# 테스트용 환경변수 (실제 운영시 수정 필요!)
DB_USERNAME=factlab_user
DB_PASSWORD=test_password_change_in_production
DATABASE_URL=postgresql://factlab_user:test_password_change_in_production@database:5432/factlab
JWT_SECRET=test_jwt_secret_key_change_this_in_production_minimum_32_chars
REDIS_PASSWORD=test_redis_password
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
KAKAO_CLIENT_ID=your_kakao_client_id
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
CERTBOT_EMAIL=admin@polradar.com
EOF
fi

# Docker 및 Docker Compose 설치 확인
if ! command -v docker &> /dev/null; then
    echo "❌ Docker가 설치되지 않았습니다."
    echo "Ubuntu/Debian에서 Docker 설치:"
    echo "curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose가 설치되지 않았습니다."
    echo "Docker Compose 설치:"
    echo "sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-Linux-x86_64 -o /usr/local/bin/docker-compose"
    echo "sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
fi

# 보안 설정 활성화 (파일이 있는 경우만)
echo "🔐 보안 설정 활성화 중..."

if [ -f nginx/nginx-secure.conf ]; then
    cp nginx/nginx-secure.conf nginx/nginx.conf
    echo "✅ Nginx 보안 설정"
else
    echo "⚠️  nginx-secure.conf 파일이 없습니다."
fi

if [ -f docker-compose-secure.yml ]; then
    cp docker-compose-secure.yml docker-compose.yml
    echo "✅ Docker 보안 설정"
else
    echo "⚠️  docker-compose-secure.yml 파일이 없습니다."
fi

if [ -f backend_service/pom-secure.xml ]; then
    cp backend_service/pom-secure.xml backend_service/pom.xml
    echo "✅ Spring Boot 보안 설정"
else
    echo "⚠️  pom-secure.xml 파일이 없습니다."
fi

# 기존 컨테이너 정리
echo "🧹 기존 서비스 정리..."
docker-compose down 2>/dev/null || true

# 빌드 및 실행
echo "🔨 서비스 빌드 및 시작..."
docker-compose up --build -d

# 잠시 대기 후 상태 확인
echo "⏳ 서비스 시작 대기 중..."
sleep 15

# 상태 확인
echo "📊 서비스 상태:"
docker-compose ps

echo ""
echo "✅ 빠른 배포 완료!"
echo ""
echo "🌐 접속 주소:"
echo "  - 사용자 사이트: http://localhost (또는 http://서버IP)"
echo "  - 관리자 사이트: http://localhost/admin (또는 http://서버IP/admin)"
echo ""
echo "📋 확인사항:"
echo "  - 모든 컨테이너가 'Up' 상태인지 확인"
echo "  - 브라우저에서 사이트 접속 테스트"
echo "  - 실제 운영시 .env 파일의 패스워드들을 변경하세요!"
echo ""
echo "🔧 문제 해결:"
echo "  - 로그 확인: docker-compose logs -f"
echo "  - 재시작: docker-compose restart"
echo "  - 중지: docker-compose down"