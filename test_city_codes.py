#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
대전시, 광주시, 수원시, 울산시 지역 코드 테스트 스크립트
"""

import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta

def test_city_codes():
    """각 도시의 지역 코드를 테스트"""
    
    # 테스트할 도시들의 지역 코드들
    cities = {
        '대전시': {
            'name': '대전시',
            'codes': ['30110', '30140', '30170', '30200', '30230']  # 중구, 동구, 서구, 유성구, 대덕구
        },
        '광주시': {
            'name': '광주시', 
            'codes': ['29110', '29140', '29155', '29170', '29200']  # 중구, 동구, 남구, 서구, 광산구
        },
        '수원시': {
            'name': '수원시',
            'codes': ['41110', '41111', '41113', '41115', '41117']  # 수원시, 장안구, 권선구, 팔달구, 영통구
        },
        '울산시': {
            'name': '울산시',
            'codes': ['31110', '31140', '31170', '31200', '31710']  # 중구, 남구, 동구, 북구, 울주군
        }
    }
    
    # API 설정
    base_url = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev"
    service_key = "+6+gD3OxMqe/Y7ddcg7thoXJk/m8nYqXOw7uyZEDObEo80uaT+ZjDV7P67Syrf2b5CGaPGaELTT8OIPU5YyL0A=="
    
    # 테스트할 날짜 (최근 3개월)
    test_dates = []
    current_date = datetime.now()
    for i in range(3):
        target_date = current_date - timedelta(days=30*i)
        test_dates.append(target_date.strftime('%Y%m'))
    
    print("=== 도시별 지역 코드 테스트 시작 ===")
    print(f"테스트 날짜: {test_dates}")
    print()
    
    working_codes = {}
    
    for city_name, city_info in cities.items():
        print(f"=== {city_name} 테스트 ===")
        city_working_codes = []
        
        for code in city_info['codes']:
            print(f"  지역 코드 {code} 테스트 중...")
            total_transactions = 0
            
            for date in test_dates:
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
                        root = ET.fromstring(response.text)
                        total_count = root.find('.//totalCount')
                        
                        if total_count is not None:
                            count = int(total_count.text)
                            total_transactions += count
                            print(f"    {date}: {count}건")
                        else:
                            print(f"    {date}: 데이터 없음")
                    else:
                        print(f"    {date}: API 오류 ({response.status_code})")
                        
                except Exception as e:
                    print(f"    {date}: 오류 발생 - {e}")
                
                import time
                time.sleep(0.5)
            
            print(f"  지역 코드 {code} 총 거래 건수: {total_transactions}건")
            
            if total_transactions > 0:
                city_working_codes.append((code, total_transactions))
                print(f"  ✅ 데이터가 발견된 지역 코드: {code}")
            else:
                print(f"  ❌ 데이터 없음")
            print()
        
        if city_working_codes:
            working_codes[city_name] = city_working_codes
        
        print()
    
    # 결과 요약
    print("=== 테스트 결과 요약 ===")
    for city_name, codes in working_codes.items():
        print(f"{city_name}:")
        for code, count in codes:
            print(f"  {code}: {count}건")
    
    return working_codes

if __name__ == '__main__':
    test_city_codes()
