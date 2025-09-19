#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
누락된 도시 데이터 로드 스크립트
대구, 대전, 광주, 울산 데이터를 데이터베이스에 저장
"""

import json
import os
import sys
from database.models import save_transaction_data

def load_city_data_to_db(city_name):
    """특정 도시의 JSON 데이터를 데이터베이스에 로드"""
    data_dir = "collected_data"
    filename = f"{data_dir}/{city_name}_all_data.json"

    if not os.path.exists(filename):
        print(f"❌ 파일 없음: {filename}")
        return 0

    print(f"📂 {city_name.upper()} 데이터 로드 중...")

    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)

        total_transactions = 0

        # JSON 구조에 따라 데이터 추출 (data 키가 있거나 없거나)
        if 'data' in data:
            # 대구처럼 data 키가 있는 구조
            regions_data = data['data']
        else:
            # 대전, 광주, 울산처럼 data 키가 없는 구조
            regions_data = data

        # 각 지역별 데이터 처리
        for region_name, region_data in regions_data.items():
            if isinstance(region_data, list):
                print(f"  └─ {region_name}: {len(region_data)}건")

                # 데이터베이스에 저장
                if region_data:
                    save_transaction_data(region_data)
                    total_transactions += len(region_data)
            else:
                print(f"  └─ {region_name}: 건너뜀 (리스트 아님)")

        print(f"✅ {city_name.upper()} 데이터 로드 완료: 총 {total_transactions}건")
        return total_transactions

    except Exception as e:
        print(f"❌ {city_name.upper()} 데이터 로드 실패: {e}")
        return 0

def main():
    """메인 함수"""
    print("🚀 누락된 도시 데이터 로드 시작")
    print("=" * 50)

    # 로드할 도시 목록
    cities = ['daegu', 'daejeon', 'gwangju', 'ulsan']
    total_loaded = 0

    for city in cities:
        loaded = load_city_data_to_db(city)
        total_loaded += loaded
        print()

    print("=" * 50)
    print(f"🎉 총 {total_loaded}건의 데이터가 데이터베이스에 로드되었습니다.")
    print("💡 이제 공포탐욕지수가 각 도시별로 제대로 계산됩니다!")

if __name__ == "__main__":
    main()
