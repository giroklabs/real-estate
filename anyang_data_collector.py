#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
안양시 부동산 데이터 수집 스크립트
안양시는 일반시이므로 구 단위로 데이터를 수집합니다.
"""

import json
import time
import os
from datetime import datetime, timedelta
from crawlers.molit_api_crawler import MolitAPICrawler

def collect_anyang_data():
    """안양시 전체 구 데이터 수집 및 저장"""
    
    # 데이터 저장 디렉토리 생성
    data_dir = "collected_data"
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    
    crawler = MolitAPICrawler()
    print('안양시 데이터 수집 시작...')
    
    # 안양시 구 목록
    anyang_regions = [
        '경기 안양시 만안구',
        '경기 안양시 동안구'
    ]
    
    all_data = {}
    total_data = 0
    
    # 안양시 데이터 수집
    print('=== 안양시 데이터 수집 시작 ===')
    for region in anyang_regions:
        print(f'\n=== {region} 데이터 수집 중... ===')
        try:
            # 8개월 데이터 수집
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
    
    # 전체 데이터 통합 저장
    if all_data:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        all_data_filename = f"anyang_all_data_{timestamp}.json"
        all_data_filepath = os.path.join(data_dir, all_data_filename)
        
        with open(all_data_filepath, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2)
        
        print(f'\n=== 안양시 전체 데이터 저장 완료 ===')
        print(f'파일: {all_data_filepath}')
        print(f'총 데이터: {total_data}건')
        
        # 수집 요약 정보 저장
        summary = {
            'collection_date': datetime.now().isoformat(),
            'total_regions': len(anyang_regions),
            'total_data_count': total_data,
            'regions': {}
        }
        
        for region, data in all_data.items():
            summary['regions'][region] = {
                'data_count': len(data),
                'collection_status': 'success' if data else 'failed'
            }
        
        summary_filename = f"anyang_collection_summary_{timestamp}.json"
        summary_filepath = os.path.join(data_dir, summary_filename)
        
        with open(summary_filepath, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f'요약 정보 저장 완료: {summary_filepath}')
    else:
        print('수집된 데이터가 없습니다.')

if __name__ == "__main__":
    collect_anyang_data()
