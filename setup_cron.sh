#!/bin/bash

# cron 작업 설정 스크립트
# 매월 1일 새벽 1시에 자동 데이터 수집 실행

# 현재 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "스크립트 디렉토리: $SCRIPT_DIR"

# logs 디렉토리 생성
mkdir -p "$SCRIPT_DIR/logs"

# cron 작업 설정 (매월 1일 새벽 1시)
CRON_JOB="0 1 1 * * cd $SCRIPT_DIR && source venv/bin/activate && python auto_data_collector.py >> $SCRIPT_DIR/logs/cron.log 2>&1"

echo "설정할 cron 작업:"
echo "$CRON_JOB"
echo ""

# 기존 cron 작업 확인
echo "기존 cron 작업:"
crontab -l 2>/dev/null || echo "기존 cron 작업 없음"
echo ""

# 새 cron 작업 추가
echo "새 cron 작업을 추가합니다..."
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "cron 작업이 설정되었습니다!"
echo "설정된 cron 작업 확인:"
crontab -l

echo ""
echo "참고: PC가 켜져 있어야 cron 작업이 실행됩니다."
echo "PC를 끄지 마시거나, 클라우드 서버를 사용하는 것을 권장합니다."
echo ""
echo "변경사항: 매일 → 매월 1일 새벽 1시 실행"
echo "이유: 서버 부하 감소 및 효율적인 월간 데이터 수집"
