#!/bin/bash

echo "🌐 네트워크 접근 테스트 시작"
echo "================================"

# 현재 IP 주소 확인
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "📍 현재 IP 주소: $CURRENT_IP"
echo ""

# 백엔드 서버 상태 확인
echo "🔍 백엔드 서버 상태 확인..."
if curl -s "http://$CURRENT_IP:5001/api/health" > /dev/null; then
    echo "✅ 백엔드 서버 정상 동작 (포트 5001)"
    echo "   API 엔드포인트: http://$CURRENT_IP:5001/api"
else
    echo "❌ 백엔드 서버 연결 실패"
fi
echo ""

# 프론트엔드 서버 상태 확인
echo "🔍 프론트엔드 서버 상태 확인..."
if curl -s "http://$CURRENT_IP:3000" > /dev/null; then
    echo "✅ 프론트엔드 서버 정상 동작 (포트 3000)"
    echo "   웹사이트: http://$CURRENT_IP:3000"
else
    echo "❌ 프론트엔드 서버 연결 실패"
fi
echo ""

# 네트워크 정보 출력
echo "📋 네트워크 접근 정보"
echo "========================"
echo "🌐 웹사이트: http://$CURRENT_IP:3000"
echo "🔌 API 서버: http://$CURRENT_IP:5001/api"
echo "📊 서버 상태: http://$CURRENT_IP:5001/api/health"
echo ""
echo "💡 같은 Wi-Fi에 연결된 다른 기기에서 위 주소로 접속하여 테스트할 수 있습니다."
echo ""

# 포트 사용 현황 확인
echo "🔌 포트 사용 현황"
echo "=================="
echo "포트 3000 (프론트엔드):"
lsof -i :3000 2>/dev/null || echo "   사용 중이지 않음"
echo ""
echo "포트 5001 (백엔드):"
lsof -i :5001 2>/dev/null || echo "   사용 중이지 않음"
echo ""
echo "테스트 완료! 🎉"
