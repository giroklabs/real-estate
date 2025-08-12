#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
현재까지 수집된 데이터를 통합하는 스크립트
"""

import json
import os
from datetime import datetime

def create_integrated_data():
    """수집된 데이터를 통합하여 하나의 파일로 저장"""
    
    data_dir = "collected_data"
    if not os.path.exists(data_dir):
        print("데이터 디렉토리가 존재하지 않습니다.")
        return
    
    # 수집된 데이터 파일들 찾기
    data_files = []
    collection_times = {}
    
    for file in os.listdir(data_dir):
        if file.endswith('_data.json') and not file.startswith('all_'):
            filepath = os.path.join(data_dir, file)
            try:
                # 파일 수정 시간 가져오기
                stat = os.stat(filepath)
                mtime = datetime.fromtimestamp(stat.st_mtime)
                collection_times[file] = mtime.strftime("%Y-%m-%d %H:%M:%S")
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    data_files.append((file, data))
                    print(f"로드된 파일: {file} - 데이터 크기: {len(data) if isinstance(data, list) else 'N/A'} - 수집일시: {collection_times[file]}")
            except Exception as e:
                print(f"파일 로드 오류 ({file}): {e}")
    
    if not data_files:
        print("수집된 데이터 파일이 없습니다.")
        return
    
    # 모든 데이터 통합
    all_integrated_data = {}
    total_transactions = 0
    regions_count = 0
    
    for filename, data in data_files:
        if isinstance(data, dict):
            # 지역별 데이터인 경우
            for region, region_data in data.items():
                if isinstance(region_data, list):
                    all_integrated_data[region] = region_data
                    total_transactions += len(region_data)
                    regions_count += 1
        elif isinstance(data, list):
            # 단일 지역 데이터인 경우
            region_name = filename.replace('_data.json', '').replace('_', ' ')
            all_integrated_data[region_name] = data
            total_transactions += len(data)
            regions_count += 1
    
    # 메타데이터 추가
    metadata = {
        "collection_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "total_regions": regions_count,
        "total_transactions": total_transactions,
        "data_files": len(data_files),
        "collection_times": collection_times,
        "description": "부동산 거래 데이터 통합 파일"
    }
    
    # 통합 데이터에 메타데이터 추가
    integrated_data = {
        "metadata": metadata,
        "data": all_integrated_data
    }
    
    # 통합 데이터 저장
    output_filename = os.path.join(data_dir, "all_cities_integrated_data.json")
    try:
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(integrated_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n=== 통합 데이터 생성 완료 ===")
        print(f"저장 파일: {output_filename}")
        print(f"총 지역 수: {regions_count}개")
        print(f"총 거래 데이터: {total_transactions:,}건")
        print(f"데이터 파일 수: {len(data_files)}개")
        print(f"생성 일시: {metadata['collection_date']}")
        
        # 지역별 데이터 현황 출력
        print(f"\n=== 지역별 데이터 현황 ===")
        for region, region_data in all_integrated_data.items():
            if isinstance(region_data, list):
                print(f"{region}: {len(region_data):,}건")
        
    except Exception as e:
        print(f"통합 데이터 저장 오류: {e}")

if __name__ == "__main__":
    create_integrated_data()
