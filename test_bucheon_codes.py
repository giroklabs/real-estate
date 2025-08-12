#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
부천시 지역 코드 테스트 스크립트
"""

import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

def test_bucheon_codes():
    """부천시의 다양한 지역 코드를 테스트"""
    
    # 부천시 관련 가능한 지역 코드들
    possible_codes = [
        '41190',  # 경기도 부천시 (현재 사용 중)
        '41191',  # 부천시 원미구 (구 지역)
        '41192',  # 부천시 소사구 (구 지역)
        '41193',  # 부천시 오정구 (구 지역)
        '41194',  # 부천시 중구 (구 지역)
        '41195',  # 부천시 남구 (구 지역)
        '41196',  # 부천시 북구 (구 지역)
        '41197',  # 부천시 동구 (구 지역)
        '41198',  # 부천시 서구 (구 지역)
        '41199',  # 부천시 강서구 (구 지역)
    ]
    
    # 테스트할 날짜 (최근 12개월)
    test_dates = []
    current_date = datetime.now()
    for i in range(12):
        target_date = current_date - timedelta(days=30*i)
        test_dates.append(target_date.strftime('%Y%m'))
    
    # API 설정
    base_url = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev"
    service_key = "+6+gD3OxMqe/Y7ddcg7thoXJk/m8nYqXOw7uyZEDObEo80uaT+ZjDV7P67Syrf2b5CGaPGaELTT8OIPU5YyL0A=="
    
    print("=== 부천시 지역 코드 테스트 시작 ===")
    print(f"테스트 날짜: {test_dates}")
    print()
    
    working_codes = []
    
    for code in possible_codes:
        print(f"=== 지역 코드 {code} 테스트 ===")
        total_transactions = 0
        
        for date in test_dates[:3]:  # 처음 3개월만 테스트 (속도 향상)
            try:
                params = {
                    'serviceKey': service_key,
                    'LAWD_CD': code,
                    'DEAL_YMD': date,
                    'pageNo': 1,
                    'numOfRows': 10
                }
                
                response = requests.get(base_url, params=params, timeout=10)
                
                if response.status_code == 200:
                    # XML 파싱
                    root = ET.fromstring(response.text)
                    total_count = root.find('.//totalCount')
                    
                    if total_count is not None:
                        count = int(total_count.text)
                        total_transactions += count
                        print(f"  {date}: {count}건")
                    else:
                        print(f"  {date}: 데이터 없음")
                else:
                    print(f"  {date}: API 오류 ({response.status_code})")
                    
            except Exception as e:
                print(f"  {date}: 오류 발생 - {e}")
            
            # API 호출 간격 조절
            import time
            time.sleep(0.5)
        
        print(f"총 거래 건수: {total_transactions}건")
        
        if total_transactions > 0:
            working_codes.append((code, total_transactions))
            print(f"✅ 데이터가 발견된 지역 코드: {code}")
        else:
            print(f"❌ 데이터 없음")
        print()
    
    # 결과 요약
    print("=== 테스트 결과 요약 ===")
    if working_codes:
        print("데이터가 있는 지역 코드들:")
        for code, count in working_codes:
            print(f"  {code}: {count}건")
    else:
        print("데이터가 있는 지역 코드가 없습니다.")
    
    return working_codes

if __name__ == '__main__':
    test_bucheon_codes()
