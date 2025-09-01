#!/bin/bash

# PolRadar Production Deployment Script
# 클라우드 테스트 배포용 스크립트

echo "🚀 PolRadar Production 배포 시작..."

# 1. 환경 변수 파일 확인
if [ ! -f .env ]; then
    echo "❌ .env 파일이 없습니다. .env.example을 참고해서 .env 파일을 생성하세요."
    echo "cp .env.example .env"
    echo "그 후 .env 파일의 실제 값들을 입력하세요."
    exit 1
fi

# 2. 보안 설정 파일들 활성화
echo "📋 보안 설정 파일 활성화..."

# nginx 보안 설정 활성화
if [ -f nginx/nginx-secure.conf ]; then
    cp nginx/nginx-secure.conf nginx/nginx.conf
    echo "✅ Nginx 보안 설정 활성화"
fi

# Docker Compose 보안 설정 활성화
if [ -f docker-compose-secure.yml ]; then
    cp docker-compose-secure.yml docker-compose.yml
    echo "✅ Docker Compose 보안 설정 활성화"
fi

# Maven 보안 설정 활성화
if [ -f backend_service/pom-secure.xml ]; then
    cp backend_service/pom-secure.xml backend_service/pom.xml
    echo "✅ Spring Boot 보안 설정 활성화"
fi

# 3. 기존 컨테이너 정리
echo "🧹 기존 컨테이너 정리..."
docker-compose down -v
docker system prune -f

# 4. SSL 인증서 디렉토리 생성
echo "🔐 SSL 인증서 디렉토리 준비..."
sudo mkdir -p /etc/letsencrypt
sudo mkdir -p /var/www/certbot

# 5. 전체 이미지 재빌드
echo "🔨 Docker 이미지 빌드..."
docker-compose build --no-cache

# 6. 서비스 시작
echo "🏃 서비스 시작..."
docker-compose up -d

# 7. 서비스 상태 확인
echo "🔍 서비스 상태 확인..."
sleep 10
docker-compose ps

# 8. SSL 인증서 발급 (도메인이 설정된 경우만)
if [ "$1" = "ssl" ]; then
    echo "🔒 SSL 인증서 발급 시도..."
    docker-compose run --rm certbot
fi

# 9. 로그 확인 안내
echo ""
echo "✅ 배포 완료!"
echo ""
echo "📊 상태 확인:"
echo "  - 웹사이트: https://polradar.com (또는 http://your-server-ip)"
echo "  - 관리자: https://polradar.com/admin"
echo "  - API 문서: https://polradar.com/api/swagger-ui/index.html"
echo ""
echo "📋 유용한 명령어:"
echo "  - 로그 확인: docker-compose logs -f [service-name]"
echo "  - 상태 확인: docker-compose ps"
echo "  - 재시작: docker-compose restart [service-name]"
echo "  - 중지: docker-compose down"
echo ""
echo "⚠️  주의사항:"
echo "  - .env 파일의 모든 값이 실제 값으로 설정되었는지 확인하세요"
echo "  - 도메인 DNS가 서버 IP로 설정되었는지 확인하세요"
echo "  - 방화벽에서 80, 443 포트가 열려있는지 확인하세요"