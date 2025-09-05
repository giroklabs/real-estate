#!/usr/bin/env python3
"""
모든 도시의 데이터 불일치 문제 해결
통합 파일에서 각 도시별 데이터를 추출하여 개별 파일 생성/업데이트
"""

import json
import os
from datetime import datetime

def fix_all_cities_data():
    print("🔧 모든 도시 데이터 수정 시작...")
    
    # 통합 파일 경로
    integrated_file = "collected_data/all_cities_integrated_data.json"
    
    if not os.path.exists(integrated_file):
        print("❌ 통합 파일을 찾을 수 없습니다.")
        return
    
    # 통합 파일 로드
    with open(integrated_file, 'r', encoding='utf-8') as f:
        integrated_data = json.load(f)
    
    # 도시별 매핑
    city_mapping = {
        'seoul': '서울',
        'busan': '부산', 
        'daegu': '대구',
        'incheon': '인천',
        'daejeon': '대전',
        'gwangju': '광주',
        'ulsan': '울산',
        'bucheon': '경기 부천시',
        'seongnam': '경기 성남시',
        'guri': '경기 구리시'
    }
    
    # 각 도시별로 데이터 수정
    for city_code, city_name in city_mapping.items():
        print(f"\n🏙️ {city_name} ({city_code}) 데이터 수정 중...")
        
        # 해당 도시의 모든 지역 데이터 추출
        city_data = {}
        total_transactions = 0
        
        for region_name, region_data in integrated_data.get('data', {}).items():
            if region_name.startswith(city_name):
                city_data[region_name] = region_data
                if isinstance(region_data, list):
                    total_transactions += len(region_data)
        
        if not city_data:
            print(f"⚠️ {city_name} 데이터를 찾을 수 없습니다.")
            continue
        
        # 개별 파일 경로 결정
        individual_file = f"collected_data/{city_code}_all_data.json"
        
        # 기존 파일 백업
        if os.path.exists(individual_file):
            backup_file = f"{individual_file}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            with open(backup_file, 'w', encoding='utf-8') as f:
                with open(individual_file, 'r', encoding='utf-8') as original:
                    f.write(original.read())
            print(f"✅ 백업 파일 생성: {backup_file}")
        
        # 새로운 데이터 구조 생성
        new_city_data = {
            'data': city_data,
            'metadata': {
                'city': city_name,
                'city_code': city_code,
                'total_regions': len(city_data),
                'total_transactions': total_transactions,
                'created_at': datetime.now().isoformat(),
                'source': 'integrated_data_extraction'
            }
        }
        
        # 개별 파일 저장
        with open(individual_file, 'w', encoding='utf-8') as f:
            json.dump(new_city_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ {city_name} 개별 파일 업데이트 완료:")
        print(f"   - 지역 수: {len(city_data)}개")
        print(f"   - 총 거래 수: {total_transactions}건")
        print(f"   - 파일 크기: {os.path.getsize(individual_file) / 1024 / 1024:.1f}MB")
    
    print(f"\n🎉 모든 도시 데이터 수정 완료!")
    
    # 검증
    print(f"\n📊 검증 결과:")
    for city_code, city_name in city_mapping.items():
        individual_file = f"collected_data/{city_code}_all_data.json"
        if os.path.exists(individual_file):
            with open(individual_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            regions = len(data.get('data', {}))
            transactions = sum(len(region_data) for region_data in data.get('data', {}).values() if isinstance(region_data, list))
            print(f"   {city_name}: {regions}개 지역, {transactions}건 거래")

if __name__ == "__main__":
    fix_all_cities_data()


