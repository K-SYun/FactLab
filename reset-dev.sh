#!/bin/bash

echo "🔄 개발 환경 완전 초기화 시작..."

# 1. 모든 컨테이너 중지 및 삭제
echo "1️⃣ 컨테이너 및 볼륨 삭제 중..."
docker-compose down -v 2>/dev/null || true
docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true

# 2. 시스템 정리
echo "2️⃣ Docker 시스템 정리 중..."
docker system prune -f
docker volume prune -f

# 3. 개발 환경 설정 복사
echo "3️⃣ 개발 환경 설정 적용 중..."
cp .env.dev .env

# 4. 개발 환경 빌드 및 실행
echo "4️⃣ 개발 환경 빌드 및 실행 중..."
docker-compose -f docker-compose.dev.yml up --build -d

# 5. 상태 확인
echo "5️⃣ 서비스 상태 확인 중..."
sleep 10
docker-compose -f docker-compose.dev.yml ps

echo "✅ 개발 환경 초기화 완료!"
echo ""
echo "📋 접근 정보:"
echo "- 사용자 서비스: http://localhost:3000"
echo "- 관리자 서비스: http://localhost:3001"  
echo "- API 서버: http://localhost:8080"
echo "- Swagger: http://localhost:8080/swagger-ui.html"
echo "- 데이터베이스: localhost:5432"
echo "- Redis: localhost:6379"
echo ""
echo "📊 로그 확인: docker-compose -f docker-compose.dev.yml logs -f backend-service"