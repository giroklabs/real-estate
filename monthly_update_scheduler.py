#!/usr/bin/env python3
"""
매월 자동 데이터 업데이트 스케줄러
매월 1일 자정에 자동으로 데이터를 업데이트합니다.
"""

import os
import sys
import schedule
import time
import logging
from datetime import datetime
from pathlib import Path

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from update_data import DataUpdater

class MonthlyUpdateScheduler:
    def __init__(self):
        self.updater = DataUpdater()
        self.setup_logging()
        
    def setup_logging(self):
        """로깅 설정"""
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        log_file = log_dir / f"monthly_update_{datetime.now().strftime('%Y%m')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        self.logger = logging.getLogger(__name__)
        
    def monthly_update_job(self):
        """매월 실행되는 업데이트 작업"""
        self.logger.info("🔄 매월 자동 업데이트 시작")
        
        try:
            # 업데이트 전 상태 확인
            self.logger.info("📊 업데이트 전 상태 확인")
            self.updater.check_update_status()
            
            # 전체 도시 업데이트 실행
            results = self.updater.update_all_cities()
            
            # 결과 로깅
            success_count = sum(1 for success in results.values() if success)
            total_count = len(results)
            
            self.logger.info(f"✅ 매월 자동 업데이트 완료: {success_count}/{total_count} 성공")
            
            # 실패한 도시가 있으면 로깅
            failed_cities = [city for city, success in results.items() if not success]
            if failed_cities:
                self.logger.warning(f"⚠️ 업데이트 실패한 도시: {', '.join(failed_cities)}")
            
        except Exception as e:
            self.logger.error(f"❌ 매월 자동 업데이트 실패: {str(e)}")
            
    def start_scheduler(self):
        """스케줄러 시작"""
        self.logger.info("🚀 매월 자동 업데이트 스케줄러 시작")
        
        # 매월 1일 00:00에 실행
        schedule.every().month.do(self.monthly_update_job)
        
        # 매주 월요일 09:00에 상태 확인 (선택사항)
        schedule.every().monday.at("09:00").do(self.weekly_status_check)
        
        self.logger.info("📅 스케줄 설정 완료:")
        self.logger.info("  - 매월 1일 00:00: 전체 데이터 업데이트")
        self.logger.info("  - 매주 월요일 09:00: 상태 확인")
        
        try:
            while True:
                schedule.run_pending()
                time.sleep(60)  # 1분마다 체크
        except KeyboardInterrupt:
            self.logger.info("⏹️ 스케줄러 종료")
            
    def weekly_status_check(self):
        """주간 상태 확인"""
        self.logger.info("📊 주간 상태 확인")
        self.updater.check_update_status()
        
    def run_immediate_update(self):
        """즉시 업데이트 실행 (테스트용)"""
        self.logger.info("🔄 즉시 업데이트 실행")
        self.monthly_update_job()

def main():
    """메인 함수"""
    scheduler = MonthlyUpdateScheduler()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "start":
            scheduler.start_scheduler()
        elif command == "update":
            scheduler.run_immediate_update()
        elif command == "status":
            scheduler.updater.check_update_status()
        else:
            print("❌ 지원하지 않는 명령어입니다.")
            print("사용법:")
            print("  python monthly_update_scheduler.py start    # 스케줄러 시작")
            print("  python monthly_update_scheduler.py update   # 즉시 업데이트")
            print("  python monthly_update_scheduler.py status   # 상태 확인")
    else:
        print("📋 매월 자동 업데이트 스케줄러")
        print("사용법:")
        print("  python monthly_update_scheduler.py start    # 스케줄러 시작")
        print("  python monthly_update_scheduler.py update   # 즉시 업데이트")
        print("  python monthly_update_scheduler.py status   # 상태 확인")

if __name__ == "__main__":
    main()
