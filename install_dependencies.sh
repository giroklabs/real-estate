#!/bin/bash

echo "🚀 부동산 데이터 분석 시스템 의존성 설치 시작..."

# Python 가상환경 활성화 (있는 경우)
if [ -d "venv" ]; then
    echo "📦 가상환경 활성화 중..."
    source venv/bin/activate
fi

# 백엔드 의존성 설치
echo "📦 백엔드 의존성 설치 중..."
pip install -r requirements.txt

# Flask-Compress 설치 확인
echo "🔍 Flask-Compress 설치 확인 중..."
python -c "import flask_compress; print('✅ Flask-Compress 설치 완료')" 2>/dev/null || {
    echo "❌ Flask-Compress 설치 실패, 수동으로 설치합니다..."
    pip install Flask-Compress==1.14
}

echo "✅ 모든 의존성 설치 완료!"
echo ""
echo "📋 설치된 주요 패키지:"
echo "   - Flask (웹 프레임워크)"
echo "   - Flask-CORS (CORS 지원)"
echo "   - Flask-Compress (gzip 압축)"
echo "   - requests (HTTP 클라이언트)"
echo "   - pandas (데이터 분석)"
echo "   - numpy (수치 계산)"
echo ""
echo "🚀 서버 실행 방법:"
echo "   python app.py"
echo ""
echo "💡 프론트엔드 실행 방법:"
echo "   cd frontend && npm start"
