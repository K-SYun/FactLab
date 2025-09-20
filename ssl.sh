#!/bin/bash

# SSL 인증서 자동 발급 스크립트
# 사용법: ./ssl.sh

set -e  # 오류 발생 시 스크립트 중단

echo "=== PolRadar SSL 인증서 발급 스크립트 ==="
echo

# 현재 디렉토리 확인
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ 오류: docker-compose.prod.yml 파일이 없습니다."
    echo "   FactLab 프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

echo "📋 1단계: 필요한 디렉토리 생성"
sudo mkdir -p /etc/letsencrypt
sudo mkdir -p /var/www/certbot
echo "✅ 디렉토리 생성 완료"
echo

echo "🐳 2단계: nginx 컨테이너 시작 (HTTP 모드)"
docker-compose -f docker-compose.prod.yml up -d nginx
echo "✅ nginx 컨테이너 시작 완료"
echo

# 5초 대기
echo "⏳ nginx 시작 대기 중..."
sleep 5

echo "🔗 3단계: 도메인 연결 상태 확인"
if ! curl -s -o /dev/null -w "%{http_code}" http://polradar.com/.well-known/acme-challenge/test | grep -q "404"; then
    echo "⚠️  경고: 도메인이 제대로 연결되지 않았을 수 있습니다."
    echo "   polradar.com이 이 서버를 가리키는지 확인해주세요."
    read -p "   계속하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 작업이 취소되었습니다."
        exit 1
    fi
fi

echo "🔐 4단계: SSL 인증서 발급"
echo "   도메인: polradar.com, www.polradar.com"
echo "   이메일: jysystem22@gmail.com"
echo

docker-compose -f docker-compose.prod.yml run --rm certbot \
    certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email jysystem22@gmail.com \
    --agree-tos \
    --no-eff-email \
    -d polradar.com \
    -d www.polradar.com

if [ $? -eq 0 ]; then
    echo "✅ SSL 인증서 발급 성공!"
else
    echo "❌ SSL 인증서 발급 실패!"
    echo "   도메인 설정을 확인하고 다시 시도해주세요."
    exit 1
fi
echo

echo "🔄 5단계: nginx 재시작 (HTTPS 적용)"
docker-compose -f docker-compose.prod.yml restart nginx
echo "✅ nginx HTTPS 설정 적용 완료"
echo

echo "🚀 6단계: 전체 서비스 시작"
docker-compose -f docker-compose.prod.yml up -d
echo "✅ 모든 서비스 시작 완료"
echo

echo "🧪 7단계: HTTPS 연결 테스트"
if curl -s -I https://polradar.com | grep -q "200 OK"; then
    echo "✅ HTTPS 연결 성공!"
    echo "   🎉 https://polradar.com 에서 확인하세요."
else
    echo "⚠️  HTTPS 연결 테스트 실패"
    echo "   몇 분 후 다시 확인해보세요."
fi
echo

echo "📅 자동 갱신 설정 안내:"
echo "   인증서는 90일마다 갱신이 필요합니다."
echo "   다음 명령어를 crontab에 추가하세요:"
echo
echo "   crontab -e"
echo "   0 12 * * * cd $(pwd) && ./renew-ssl.sh"
echo

# 갱신 스크립트 생성
cat > renew-ssl.sh << 'EOF'
#!/bin/bash
# SSL 인증서 자동 갱신 스크립트

cd "$(dirname "$0")"
docker-compose -f docker-compose.prod.yml run --rm certbot renew --quiet
if [ $? -eq 0 ]; then
    docker-compose -f docker-compose.prod.yml restart nginx
    echo "$(date): SSL 인증서 갱신 성공" >> ssl-renew.log
else
    echo "$(date): SSL 인증서 갱신 실패" >> ssl-renew.log
fi
EOF

chmod +x renew-ssl.sh
echo "✅ 자동 갱신 스크립트 (renew-ssl.sh) 생성 완료"
echo

echo "🎊 SSL 설정이 완료되었습니다!"
echo "   - HTTPS: https://polradar.com"
echo "   - Admin: https://polradar.com/admin"
echo
echo "💡 SSL 등급 확인: https://www.ssllabs.com/ssltest/"