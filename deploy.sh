#!/bin/bash

# Fly.io 배포 스크립트
echo "🚀 Fly.io 배포 시작..."

# 1. Fly CLI 설치 확인
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI가 설치되지 않았습니다."
    echo "다음 명령어로 설치하세요:"
    echo "curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# 2. 로그인 확인
if ! fly auth whoami &> /dev/null; then
    echo "🔐 Fly.io에 로그인이 필요합니다."
    fly auth login
fi

# 3. 앱 존재 확인 및 생성
if ! fly apps list | grep -q "realstate-app"; then
    echo "📱 앱을 생성합니다..."
    fly apps create realstate-app --org personal
fi

# 4. 볼륨 생성 (데이터 저장용)
if ! fly volumes list | grep -q "realstate_data"; then
    echo "💾 데이터 볼륨을 생성합니다..."
    fly volumes create realstate_data --size 10 --region nrt
fi

# 5. 환경 변수 설정 (secrets)
echo "🔒 환경 변수를 설정합니다..."
echo "API 키들을 입력하세요:"

read -p "MOBILE_API_KEY: " mobile_api_key
read -p "MOBILE_API_SECRET: " mobile_api_secret
read -p "REB_API_KEY: " reb_api_key

# secrets 설정
fly secrets set MOBILE_API_KEY="$mobile_api_key"
fly secrets set MOBILE_API_SECRET="$mobile_api_secret"
fly secrets set REB_API_KEY="$reb_api_key"

# 6. 배포
echo "🚀 배포를 시작합니다..."
fly deploy

# 7. 상태 확인
echo "✅ 배포 완료! 앱 상태를 확인합니다..."
fly status

echo "🌐 앱 URL: https://realstate-app.fly.dev"
echo "📊 로그 확인: fly logs"
echo "🔧 SSH 접속: fly ssh console"
