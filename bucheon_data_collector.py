#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
부천시 부동산 데이터 수집 및 저장 스크립트
"""

import json
import time
import os
from datetime import datetime
from crawlers.molit_api_crawler import MolitAPICrawler

def collect_bucheon_data():
    """부천시 데이터 수집 및 저장"""
    
    # 데이터 저장 디렉토리 생성
    data_dir = "collected_data"
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    
    crawler = MolitAPICrawler()
    print('부천시 데이터 수집 시작...')
    
    # 부천시 구별 지역 코드 (정확한 지역구분)
    bucheon_regions = [
        ('경기 부천시 원미구', '41191'),
        ('경기 부천시 소사구', '41192'),
        ('경기 부천시 오정구', '41193')
    ]
    
    all_data = {}
    total_data = 0
    
    # 부천시 데이터 수집
    print('=== 부천시 데이터 수집 시작 ===')
    for region_name, region_code in bucheon_regions:
        print(f'\n=== {region_name} 데이터 수집 중... (코드: {region_code}) ===')
        try:
            # 8개월 데이터 수집 (직접 지역 코드 사용)
            data = crawler.crawl_region_data_with_code(region_code, months=8)
            if data:
                all_data[region_name] = data
                total_data += len(data)
                print(f'{region_name} 데이터 수집 완료: {len(data)}건')
                
                # 개별 지역 데이터 파일로 저장
                filename = f"{region_name.replace(' ', '_')}_data.json"
                filepath = os.path.join(data_dir, filename)
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print(f'{region_name} 데이터 파일 저장 완료: {filepath}')
            else:
                print(f'{region_name} 데이터 수집 실패')
                all_data[region_name] = []
        except Exception as e:
            print(f'{region_name} 데이터 수집 중 오류 발생: {e}')
            all_data[region_name] = []
        
        # API 호출 간격 조절
        time.sleep(1)
    
    # 전체 데이터를 하나의 파일로 저장
    all_data_filepath = os.path.join(data_dir, 'bucheon_all_data.json')
    with open(all_data_filepath, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    print(f'\n전체 데이터 파일 저장 완료: {all_data_filepath}')
    
    # 수집 요약 정보 저장 (가격 통계 포함)
    summary = {
        'collection_date': datetime.now().isoformat(),
        'total_regions': len(bucheon_regions),
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
    summary_filepath = os.path.join(data_dir, 'bucheon_collection_summary.json')
    with open(summary_filepath, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f'요약 정보 파일 저장 완료: {summary_filepath}')
    
    print(f'\n=== 부천시 데이터 수집 완료 ===')
    print(f'총 지역 수: {len(bucheon_regions)}')
    print(f'총 거래 건수: {total_data:,}건')
    
    # 지역별 요약 정보 출력
    print(f'\n=== 지역별 요약 정보 ===')
    for region, info in summary['regions_summary'].items():
        if info['transaction_count'] > 0:
            print(f'{region}: {info["transaction_count"]}건, 평균가: {info["avg_price"]:,}원, 최고가: {info["max_price"]:,}원, 최저가: {info["min_price"]:,}원')

if __name__ == '__main__':
    collect_bucheon_data()
