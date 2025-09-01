#!/usr/bin/env python3
"""
부동산 데이터 업데이트 스크립트
각 지역별 최신 데이터를 국토교통부 API에서 수집하여 업데이트합니다.
"""

import os
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from crawlers.molit_api_crawler import MolitAPICrawler
from services.region_service import RegionService

class DataUpdater:
    def __init__(self):
        self.crawler = MolitAPICrawler()
        self.region_service = RegionService()
        self.data_dir = Path("collected_data")
        
        # 지역별 데이터 파일 매핑
        self.city_files = {
            'seoul': 'seoul_all_data.json',
            'busan': 'busan_all_data.json', 
            'incheon': 'incheon_all_data.json',
            'daegu': 'daegu_all_data.json',
            'gwangju': 'gwangju_all_data.json',
            'daejeon': 'daejeon_all_data.json',
            'ulsan': 'ulsan_all_data.json'
        }
        
        # 지역별 지역코드 매핑
        self.region_codes = {
            'seoul': '11680',  # 서울 강남구 기준
            'busan': '26440',  # 부산 해운대구 기준
            'incheon': '28200', # 인천 연수구 기준
            'daegu': '27200',  # 대구 수성구 기준
            'gwangju': '29170', # 광주 서구 기준
            'daejeon': '30200', # 대전 유성구 기준
            'ulsan': '31140'   # 울산 남구 기준
        }

    def get_latest_date_from_file(self, city):
        """파일에서 현재 최신 데이터 날짜를 가져옵니다."""
        file_path = self.data_dir / self.city_files[city]
        
        if not file_path.exists():
            print(f"❌ {city} 데이터 파일이 존재하지 않습니다: {file_path}")
            return None
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 데이터 구조에 따라 최신 날짜 추출
            if city in ['seoul', 'incheon', 'daegu']:
                # data 키 구조
                latest_dates = []
                for region_data in data.get('data', {}).values():
                    if isinstance(region_data, list):
                        for item in region_data:
                            if isinstance(item, dict) and 'date' in item:
                                latest_dates.append(item['date'])
            else:
                # 직접 지역 키 구조
                latest_dates = []
                for region_data in data.values():
                    if isinstance(region_data, list):
                        for item in region_data:
                            if isinstance(item, dict) and 'date' in item:
                                latest_dates.append(item['date'])
            
            if latest_dates:
                latest_date = max(latest_dates)
                print(f"📅 {city} 현재 최신 데이터: {latest_date}")
                return latest_date
            else:
                print(f"⚠️ {city} 데이터에서 날짜를 찾을 수 없습니다.")
                return None
                
        except Exception as e:
            print(f"❌ {city} 데이터 파일 읽기 오류: {str(e)}")
            return None

    def update_city_data(self, city):
        """특정 도시의 데이터를 업데이트합니다."""
        print(f"\n🔄 {city.upper()} 데이터 업데이트 시작...")
        
        # 현재 최신 데이터 날짜 확인
        latest_date = self.get_latest_date_from_file(city)
        if not latest_date:
            print(f"❌ {city} 최신 데이터 날짜를 확인할 수 없습니다.")
            return False
        
        # 최신 날짜 다음날부터 현재까지의 데이터 수집
        start_date = datetime.strptime(latest_date, '%Y-%m-%d') + timedelta(days=1)
        current_date = datetime.now()
        
        if start_date > current_date:
            print(f"✅ {city} 데이터가 이미 최신입니다. (최신: {latest_date})")
            return True
        
        print(f"📊 {city} 데이터 수집 기간: {start_date.strftime('%Y-%m-%d')} ~ {current_date.strftime('%Y-%m-%d')}")
        
        try:
            # 지역코드 가져오기
            region_code = self.region_codes.get(city)
            if not region_code:
                print(f"❌ {city} 지역코드를 찾을 수 없습니다.")
                return False
            
            # 새 데이터 수집
            new_data = []
            temp_date = start_date
            
            while temp_date <= current_date:
                deal_ymd = temp_date.strftime('%Y%m')
                print(f"  📅 {deal_ymd} 데이터 수집 중...")
                
                # API에서 데이터 수집
                month_data = self.crawler.get_apartment_data(region_code, deal_ymd, page_no=1, num_of_rows=1000)
                if month_data:
                    new_data.extend(month_data)
                    print(f"    ✅ {len(month_data)}건 수집")
                else:
                    print(f"    ⚠️ 데이터 없음")
                
                temp_date += timedelta(days=32)  # 다음 달로 이동
                temp_date = temp_date.replace(day=1)  # 1일로 설정
            
            if new_data:
                print(f"📈 {city} 새로 수집된 데이터: {len(new_data)}건")
                
                # 기존 데이터와 병합
                self.merge_data(city, new_data)
                print(f"✅ {city} 데이터 업데이트 완료!")
                return True
            else:
                print(f"⚠️ {city} 새로운 데이터가 없습니다.")
                return True
                
        except Exception as e:
            print(f"❌ {city} 데이터 업데이트 실패: {str(e)}")
            return False

    def merge_data(self, city, new_data):
        """새 데이터를 기존 데이터와 병합합니다."""
        file_path = self.data_dir / self.city_files[city]
        
        # 기존 데이터 로드
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except:
            existing_data = {}
        
        # 새 데이터를 기존 데이터에 추가
        if city in ['seoul', 'incheon', 'daegu']:
            # data 키 구조
            if 'data' not in existing_data:
                existing_data['data'] = {}
            
            for item in new_data:
                region_name = item.get('region_name', '')
                if region_name not in existing_data['data']:
                    existing_data['data'][region_name] = []
                existing_data['data'][region_name].append(item)
        else:
            # 직접 지역 키 구조
            for item in new_data:
                region_name = item.get('region_name', '')
                if region_name not in existing_data:
                    existing_data[region_name] = []
                existing_data[region_name].append(item)
        
        # 메타데이터 업데이트
        if 'metadata' in existing_data:
            existing_data['metadata']['last_updated'] = datetime.now().isoformat()
            existing_data['metadata']['update_count'] = existing_data['metadata'].get('update_count', 0) + 1
        
        # 백업 생성
        backup_path = file_path.with_suffix(f'.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}')
        try:
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(existing_data, f, ensure_ascii=False, indent=2)
            print(f"💾 백업 생성: {backup_path}")
        except Exception as e:
            print(f"⚠️ 백업 생성 실패: {str(e)}")
        
        # 업데이트된 데이터 저장
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)

    def update_all_cities(self):
        """모든 도시의 데이터를 업데이트합니다."""
        print("🚀 전체 도시 데이터 업데이트 시작...")
        print(f"📅 업데이트 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        results = {}
        for city in self.city_files.keys():
            results[city] = self.update_city_data(city)
        
        # 결과 요약
        print("\n📊 업데이트 결과 요약:")
        print("=" * 50)
        success_count = 0
        for city, success in results.items():
            status = "✅ 성공" if success else "❌ 실패"
            print(f"{city.upper():<10}: {status}")
            if success:
                success_count += 1
        
        print("=" * 50)
        print(f"총 {len(results)}개 도시 중 {success_count}개 성공")
        print(f"📅 업데이트 완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return results

    def check_update_status(self):
        """각 도시별 업데이트 상태를 확인합니다."""
        print("📊 각 도시별 데이터 상태 확인:")
        print("=" * 60)
        
        for city, filename in self.city_files.items():
            file_path = self.data_dir / filename
            if file_path.exists():
                latest_date = self.get_latest_date_from_file(city)
                if latest_date:
                    days_ago = (datetime.now() - datetime.strptime(latest_date, '%Y-%m-%d')).days
                    status = "🟢 최신" if days_ago <= 7 else "🟡 지연" if days_ago <= 30 else "🔴 오래됨"
                    print(f"{city.upper():<10}: {latest_date} ({days_ago}일 전) {status}")
                else:
                    print(f"{city.upper():<10}: ❌ 데이터 오류")
            else:
                print(f"{city.upper():<10}: ❌ 파일 없음")

def main():
    """메인 함수"""
    updater = DataUpdater()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "status":
            updater.check_update_status()
        elif command == "update":
            if len(sys.argv) > 2:
                city = sys.argv[2].lower()
                if city in updater.city_files:
                    updater.update_city_data(city)
                else:
                    print(f"❌ 지원하지 않는 도시: {city}")
                    print(f"지원 도시: {', '.join(updater.city_files.keys())}")
            else:
                updater.update_all_cities()
        else:
            print("❌ 지원하지 않는 명령어입니다.")
            print("사용법:")
            print("  python update_data.py status          # 상태 확인")
            print("  python update_data.py update          # 전체 업데이트")
            print("  python update_data.py update seoul    # 특정 도시 업데이트")
    else:
        print("📋 부동산 데이터 업데이트 도구")
        print("사용법:")
        print("  python update_data.py status          # 상태 확인")
        print("  python update_data.py update          # 전체 업데이트")
        print("  python update_data.py update seoul    # 특정 도시 업데이트")

if __name__ == "__main__":
    main()
