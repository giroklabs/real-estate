#!/bin/bash

# 매월 자동 업데이트 시스템 서비스 설정 스크립트

echo "🚀 매월 자동 업데이트 시스템 설정 시작..."

# 현재 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 스크립트 디렉토리: $SCRIPT_DIR"

# Python 가상환경 경로
VENV_PATH="$SCRIPT_DIR/venv"
PYTHON_PATH="$VENV_PATH/bin/python"

# 가상환경 존재 확인
if [ ! -f "$PYTHON_PATH" ]; then
    echo "❌ Python 가상환경을 찾을 수 없습니다: $VENV_PATH"
    echo "먼저 가상환경을 생성해주세요."
    exit 1
fi

echo "✅ Python 가상환경 확인: $PYTHON_PATH"

# 필요한 Python 패키지 설치
echo "📦 필요한 Python 패키지 설치 중..."
$PYTHON_PATH -m pip install schedule

# systemd 서비스 파일 생성
SERVICE_FILE="/etc/systemd/system/realstate-monthly-update.service"

echo "📝 systemd 서비스 파일 생성 중..."

sudo tee $SERVICE_FILE > /dev/null << EOF
[Unit]
Description=Real Estate Data Monthly Update Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$SCRIPT_DIR
Environment=PATH=$VENV_PATH/bin
ExecStart=$PYTHON_PATH $SCRIPT_DIR/monthly_update_scheduler.py start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "✅ 서비스 파일 생성 완료: $SERVICE_FILE"

# systemd 데몬 리로드
echo "🔄 systemd 데몬 리로드 중..."
sudo systemctl daemon-reload

# 서비스 활성화
echo "⚡ 서비스 활성화 중..."
sudo systemctl enable realstate-monthly-update.service

echo "✅ 매월 자동 업데이트 시스템 설정 완료!"
echo ""
echo "📋 사용 가능한 명령어:"
echo "  sudo systemctl start realstate-monthly-update    # 서비스 시작"
echo "  sudo systemctl stop realstate-monthly-update     # 서비스 중지"
echo "  sudo systemctl status realstate-monthly-update   # 서비스 상태 확인"
echo "  sudo systemctl restart realstate-monthly-update  # 서비스 재시작"
echo ""
echo "📊 로그 확인:"
echo "  sudo journalctl -u realstate-monthly-update -f   # 실시간 로그"
echo "  tail -f $SCRIPT_DIR/logs/monthly_update_*.log    # 로그 파일"
echo ""
echo "🧪 테스트 실행:"
echo "  cd $SCRIPT_DIR"
echo "  $PYTHON_PATH monthly_update_scheduler.py update  # 즉시 업데이트 테스트"
echo "  $PYTHON_PATH monthly_update_scheduler.py status  # 상태 확인"
