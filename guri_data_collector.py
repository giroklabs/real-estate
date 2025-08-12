#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
구리시 부동산 데이터 수집 스크립트
구리시는 일반시이므로 시 단위로 데이터를 수집합니다.
"""

import json
import time
import os
from datetime import datetime, timedelta
from crawlers.molit_api_crawler import MolitAPICrawler

def collect_guri_data():
    """구리시 데이터 수집 및 저장"""
    
    # 데이터 저장 디렉토리 생성
    data_dir = "collected_data"
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    
    crawler = MolitAPICrawler()
    print('구리시 데이터 수집 시작...')
    
    # 구리시 지역
    guri_region = '경기 구리시'
    
    try:
        # 8개월 데이터 수집
        data = crawler.crawl_region_data(guri_region, months=8)
        if data:
            print(f'{guri_region} 데이터 수집 완료: {len(data)}건')
            
            # 개별 지역 데이터 파일로 저장
            filename = f"{guri_region.replace(' ', '_')}_data.json"
            filepath = os.path.join(data_dir, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f'{guri_region} 데이터 파일 저장 완료: {filepath}')
            
            # 전체 데이터 통합 저장
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            all_data_filename = f"guri_all_data_{timestamp}.json"
            all_data_filepath = os.path.join(data_dir, all_data_filename)
            
            all_data = {guri_region: data}
            with open(all_data_filepath, 'w', encoding='utf-8') as f:
                json.dump(all_data, f, ensure_ascii=False, indent=2)
            
            print(f'\n=== 구리시 전체 데이터 저장 완료 ===')
            print(f'파일: {all_data_filepath}')
            print(f'총 데이터: {len(data)}건')
            
            # 수집 요약 정보 저장
            summary = {
                'collection_date': datetime.now().isoformat(),
                'total_regions': 1,
                'total_data_count': len(data),
                'regions': {
                    guri_region: {
                        'data_count': len(data),
                        'collection_status': 'success'
                    }
                }
            }
            
            summary_filename = f"guri_collection_summary_{timestamp}.json"
            summary_filepath = os.path.join(data_dir, summary_filename)
            
            with open(summary_filepath, 'w', encoding='utf-8') as f:
                json.dump(summary, f, ensure_ascii=False, indent=2)
            
            print(f'요약 정보 저장 완료: {summary_filepath}')
        else:
            print(f'{guri_region} 데이터 수집 실패')
            
    except Exception as e:
        print(f'{guri_region} 데이터 수집 중 오류 발생: {e}')

if __name__ == "__main__":
    collect_guri_data()
