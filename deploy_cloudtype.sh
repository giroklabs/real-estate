#!/bin/bash

# Cloudtype 배포 스크립트
echo "🚀 Cloudtype 배포 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 현재 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo -e "${BLUE}스크립트 디렉토리: ${SCRIPT_DIR}${NC}"

# 1. 환경 변수 파일 확인
echo -e "\n${YELLOW}1단계: 환경 변수 확인${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}⚠️  .env 파일이 없습니다. env.example을 복사하여 생성하세요.${NC}"
    echo "cp env.example .env"
    echo "그 후 .env 파일에 API 키를 설정하세요."
    exit 1
else
    echo -e "${GREEN}✅ .env 파일 확인 완료${NC}"
fi

# 2. Git 상태 확인
echo -e "\n${YELLOW}2단계: Git 상태 확인${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  커밋되지 않은 변경사항이 있습니다.${NC}"
    echo "현재 변경사항:"
    git status --short
    
    read -p "계속 진행하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "배포를 취소합니다."
        exit 1
    fi
else
    echo -e "${GREEN}✅ Git 상태 정상${NC}"
fi

# 3. 최신 커밋 푸시
echo -e "\n${YELLOW}3단계: Git 푸시${NC}"
echo "최신 변경사항을 GitHub에 푸시합니다..."
git add .
git commit -m "🚀 Cloudtype 배포 준비 완료"
git push origin main
echo -e "${GREEN}✅ Git 푸시 완료${NC}"

# 4. Cloudtype 설정 파일 확인
echo -e "\n${YELLOW}4단계: Cloudtype 설정 파일 확인${NC}"
if [ -f "cloudtype.toml" ]; then
    echo -e "${GREEN}✅ cloudtype.toml 파일 확인 완료${NC}"
    echo "설정 내용:"
    cat cloudtype.toml
else
    echo -e "${RED}❌ cloudtype.toml 파일이 없습니다.${NC}"
    exit 1
fi

# 5. 배포 가이드 출력
echo -e "\n${GREEN}🎉 Cloudtype 배포 준비 완료!${NC}"
echo -e "\n${BLUE}다음 단계를 따라 배포를 완료하세요:${NC}"
echo -e "\n${YELLOW}1. Cloudtype 계정 생성${NC}"
echo "   https://cloudtype.io 접속"
echo "   GitHub 계정으로 로그인"

echo -e "\n${YELLOW}2. 새 프로젝트 생성${NC}"
echo "   'New Project' 클릭"
echo "   Python 환경 선택"
echo "   프로젝트 이름: real-estate-app"

echo -e "\n${YELLOW}3. Git 저장소 연결${NC}"
echo "   Repository: giroklabs/real-estate"
echo "   Branch: main"

echo -e "\n${YELLOW}4. 환경 변수 설정${NC}"
echo "   FLASK_APP=app.py"
echo "   FLASK_ENV=production"
echo "   PORT=5002"
echo "   REB_API_KEY=your_api_key"
echo "   MOBILE_API_KEY=your_api_key"
echo "   MOBILE_API_SECRET=your_secret"

echo -e "\n${YELLOW}5. 배포 실행${NC}"
echo "   'Deploy' 버튼 클릭"
echo "   빌드 및 배포 완료 대기"

echo -e "\n${YELLOW}6. Cron 작업 설정${NC}"
echo "   Settings → Cron Jobs"
echo "   Schedule: 0 1 1 * *"
echo "   Command: python auto_data_collector.py"

echo -e "\n${GREEN}🎯 배포 완료 후:${NC}"
echo "   - 매월 1일 새벽 1시 자동 데이터 수집"
echo "   - 24/7 운영 가능"
echo "   - PC를 끄고 있어도 자동 실행"

echo -e "\n${BLUE}배포 중 문제가 발생하면 Cloudtype 로그를 확인하세요.${NC}"
echo -e "${BLUE}한국어 지원팀이 도움을 드릴 수 있습니다.${NC}"

