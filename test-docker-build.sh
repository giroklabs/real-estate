#!/bin/bash

echo "🐳 Docker 빌드 테스트 시작..."

# 프론트엔드 디렉토리로 이동
cd frontend

echo "📁 현재 디렉토리: $(pwd)"
echo "📋 파일 목록:"
ls -la

echo ""
echo "🔧 Docker 빌드 시작..."
echo "빌드 컨텍스트: frontend 디렉토리"
echo "Dockerfile: Dockerfile.frontend"

# Docker 빌드 실행
docker build -f Dockerfile.frontend -t real-estate-frontend:test .

if [ $? -eq 0 ]; then
    echo "✅ Docker 빌드 성공!"
    echo ""
    echo "📋 이미지 정보:"
    docker images | grep real-estate-frontend
    
    echo ""
    echo "🚀 컨테이너 실행 테스트:"
    echo "docker run -p 3000:3000 real-estate-frontend:test"
else
    echo "❌ Docker 빌드 실패!"
    exit 1
fi
