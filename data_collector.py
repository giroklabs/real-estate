#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
부산 전체 구 부동산 데이터 수집 및 저장 스크립트
"""

import json
import time
import os
from datetime import datetime, timedelta
from crawlers.molit_api_crawler import MolitAPICrawler

def collect_and_save_busan_data():
    """부산 전체 구 데이터 수집 및 저장"""
    
    # 데이터 저장 디렉토리 생성
    data_dir = "collected_data"
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    
    crawler = MolitAPICrawler()
    print('부산 전체 구 데이터 수집 시작...')
    
    # 부산 전체 구 목록
    busan_regions = [
        '부산 강서구', '부산 금정구', '부산 남구', '부산 동구', '부산 동래구',
        '부산 부산진구', '부산 북구', '부산 사상구', '부산 사하구', '부산 서구',
        '부산 수영구', '부산 연제구', '부산 영도구', '부산 중구', '부산 해운대구', '부산 기장군'
    ]
    
    # 인천 전체 구 목록
    incheon_regions = [
        '인천 강화군', '인천 계양구', '인천 남동구', '인천 동구', '인천 미추홀구',
        '인천 부평구', '인천 서구', '인천 연수구', '인천 옹진군', '인천 중구'
    ]
    
    all_data = {}
    total_data = 0
    
    # 부산 데이터 수집
    print('=== 부산 데이터 수집 시작 ===')
    for region in busan_regions:
        print(f'\n=== {region} 데이터 수집 중... ===')
        try:
            # 2개월 데이터 수집
            data = crawler.crawl_region_data(region, months=8)
            if data:
                all_data[region] = data
                total_data += len(data)
                print(f'{region} 데이터 수집 완료: {len(data)}건')
                
                # 개별 지역 데이터 파일로 저장
                filename = f"{region.replace(' ', '_')}_data.json"
                filepath = os.path.join(data_dir, filename)
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f'{region} 데이터 파일 저장 완료: {filepath}')
            else:
                print(f'{region} 데이터 수집 실패')
                all_data[region] = []
        except Exception as e:
            print(f'{region} 데이터 수집 중 오류 발생: {e}')
            all_data[region] = []
        
        # API 호출 간격 조절
        time.sleep(1)
    
    # 인천 데이터 수집
    print('\n=== 인천 데이터 수집 시작 ===')
    for region in incheon_regions:
        print(f'\n=== {region} 데이터 수집 중... ===')
        try:
            # 2개월 데이터 수집
            data = crawler.crawl_region_data(region, months=8)
            if data:
                all_data[region] = data
                total_data += len(data)
                print(f'{region} 데이터 수집 완료: {len(data)}건')
                
                # 개별 지역 데이터 파일로 저장
                filename = f"{region.replace(' ', '_')}_data.json"
                filepath = os.path.join(data_dir, filename)
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f'{region} 데이터 파일 저장 완료: {filepath}')
            else:
                print(f'{region} 데이터 수집 실패')
                all_data[region] = []
        except Exception as e:
            print(f'{region} 데이터 수집 중 오류 발생: {e}')
            all_data[region] = []
        
        # API 호출 간격 조절
        time.sleep(1)
    
    # 서울시 데이터 수집
    seoul_regions = [
        '서울 강남구', '서울 강동구', '서울 강북구', '서울 강서구', '서울 관악구',
        '서울 광진구', '서울 구로구', '서울 금천구', '서울 노원구', '서울 도봉구',
        '서울 동대문구', '서울 동작구', '서울 마포구', '서울 서대문구', '서울 서초구',
        '서울 성동구', '서울 성북구', '서울 송파구', '서울 양천구', '서울 영등포구',
        '서울 용산구', '서울 은평구', '서울 종로구', '서울 중구', '서울 중랑구'
    ]
    
    print('\n=== 서울시 데이터 수집 시작 ===')
    for region in seoul_regions:
        print(f'\n=== {region} 데이터 수집 중... ===')
        try:
            # 2개월 데이터 수집
            data = crawler.crawl_region_data(region, months=8)
            if data:
                all_data[region] = data
                total_data += len(data)
                print(f'{region} 데이터 수집 완료: {len(data)}건')
                
                # 개별 지역 데이터 파일로 저장
                filename = f"{region.replace(' ', '_')}_data.json"
                filepath = os.path.join(data_dir, filename)
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f'{region} 데이터 파일 저장 완료: {filepath}')
            else:
                print(f'{region} 데이터 수집 실패')
                all_data[region] = []
        except Exception as e:
            print(f'{region} 데이터 수집 중 오류 발생: {e}')
            all_data[region] = []
        
        # API 호출 간격 조절
        time.sleep(1)
    
    # 전체 데이터를 하나의 파일로 저장
    all_data_filepath = os.path.join(data_dir, 'busan_incheon_seoul_all_data.json')
    with open(all_data_filepath, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    print(f'\n전체 데이터 파일 저장 완료: {all_data_filepath}')
    
    # 수집 요약 정보 저장 (가격 통계 포함)
    summary = {
        'collection_date': datetime.now().isoformat(),
        'total_regions': len(busan_regions) + len(incheon_regions) + len(seoul_regions),
        'total_transactions': total_data,
        'regions_summary': {}
    }

    for region, data in all_data.items():
        if data and len(data) > 0:
            # 이미 계산된 avg_price 사용
            prices = []
            for item in data:
                if 'avg_price' in item and item['avg_price']:
                    try:
                        price = int(item['avg_price'])
                        prices.append(price)
                    except (ValueError, TypeError):
                        continue

            if prices:
                avg_price = int(sum(prices) / len(prices))
                max_price = max(prices)
                min_price = min(prices)
            else:
                avg_price = 0
                max_price = 0
                min_price = 0

            summary['regions_summary'][region] = {
                'transaction_count': len(data),
                'avg_price': avg_price,
                'max_price': max_price,
                'min_price': min_price,
                'data_file': f"{region.replace(' ', '_')}_data.json"
            }
        else:
            summary['regions_summary'][region] = {
                'transaction_count': 0,
                'avg_price': 0,
                'max_price': 0,
                'min_price': 0,
                'data_file': f"{region.replace(' ', '_')}_data.json"
            }
    
    # 요약 정보 파일로 저장
    summary_filepath = os.path.join(data_dir, 'collection_summary.json')
    with open(summary_filepath, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f'요약 정보 파일 저장 완료: {summary_filepath}')
    
    print(f'\n=== 부산 및 인천 전체 구 데이터 수집 완료 ===')
    print(f'총 지역 수: {len(busan_regions) + len(incheon_regions) + len(seoul_regions)}')
    print(f'총 거래 건수: {total_data:,}건')
    
    # 지역별 요약 정보 출력
    print(f'\n=== 지역별 요약 정보 ===')
    for region, info in summary['regions_summary'].items():
        if info['transaction_count'] > 0:
            print(f'{region}: {info["transaction_count"]}건, 평균가: {info["avg_price"]:,}원, 최고가: {info["max_price"]:,}원, 최저가: {info["min_price"]:,}원')

if __name__ == '__main__':
    collect_and_save_busan_data()
