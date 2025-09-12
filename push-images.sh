#!/bin/bash

echo "🏗️ Docker 이미지 빌드 및 푸시..."

# Docker Hub 로그인 확인
docker info | grep -q "Username" || docker login

# 이미지 빌드 및 태그
docker build -t factlab/user-service:latest -f user_service/Dockerfile.prod ./user_service
docker build -t factlab/admin-service:latest -f admin_service/Dockerfile.prod ./admin_service  
docker build -t factlab/backend-service:latest -f backend_service/Dockerfile.prod ./backend_service
docker build -t factlab/crawler-service:latest -f crawler/Dockerfile.prod ./crawler
docker build -t factlab/ai-service:latest -f ai_service/Dockerfile.prod ./ai_service

# Docker Hub에 푸시
docker push factlab/user-service:latest
docker push factlab/admin-service:latest
docker push factlab/backend-service:latest
docker push factlab/crawler-service:latest
docker push factlab/ai-service:latest

echo "✅ 모든 이미지 푸시 완료!"
