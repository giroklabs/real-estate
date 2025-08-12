#!/bin/bash

# 프론트엔드 배포 스크립트
echo "🚀 프론트엔드 배포 스크립트 시작"

# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 프로덕션 빌드
echo "🔨 프로덕션 빌드 중..."
npm run build

# 빌드 결과 확인
if [ -d "build" ]; then
    echo "✅ 빌드 성공!"
    echo "📁 빌드 파일 위치: frontend/build/"
    echo ""
    echo "🌐 카페24 업로드 방법:"
    echo "1. 카페24 파일매니저 접속"
    echo "2. frontend/build/ 폴더의 모든 파일을 웹 디렉토리에 업로드"
    echo ""
    echo "📋 빌드된 파일 목록:"
    ls -la build/
    echo ""
    echo "📊 파일 크기:"
    du -sh build/*
else
    echo "❌ 빌드 실패!"
    exit 1
fi

echo ""
echo "🎉 배포 준비 완료!"
echo "📖 자세한 배포 가이드는 CAFE24_DEPLOYMENT_GUIDE.md를 참조하세요."
