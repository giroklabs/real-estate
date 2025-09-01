#!/usr/bin/env python3
"""
부산 개별 파일에 수영구 데이터가 누락된 문제 해결
통합 파일에서 부산 수영구 데이터를 추출하여 개별 파일에 추가
"""

import json
import os

def fix_busan_data():
    print("🔧 부산 데이터 수정 시작...")
    
    # 1. 통합 파일에서 부산 수영구 데이터 추출
    integrated_file = "collected_data/all_cities_integrated_data.json"
    busan_file = "collected_data/busan_all_data.json"
    
    if not os.path.exists(integrated_file):
        print("❌ 통합 파일을 찾을 수 없습니다.")
        return
    
    if not os.path.exists(busan_file):
        print("❌ 부산 개별 파일을 찾을 수 없습니다.")
        return
    
    # 통합 파일 로드
    with open(integrated_file, 'r', encoding='utf-8') as f:
        integrated_data = json.load(f)
    
    # 부산 개별 파일 로드
    with open(busan_file, 'r', encoding='utf-8') as f:
        busan_data = json.load(f)
    
    # 부산 수영구 데이터 추출
    suyeong_data = integrated_data.get('data', {}).get('부산 수영구', [])
    
    if not suyeong_data:
        print("❌ 통합 파일에서 부산 수영구 데이터를 찾을 수 없습니다.")
        return
    
    print(f"✅ 통합 파일에서 부산 수영구 데이터 {len(suyeong_data)}건 발견")
    
    # 부산 개별 파일에 수영구 데이터 추가
    if 'data' not in busan_data:
        busan_data['data'] = {}
    
    busan_data['data']['부산 수영구'] = suyeong_data
    
    # 백업 생성
    backup_file = f"{busan_file}.backup"
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(busan_data, f, ensure_ascii=False, indent=2)
    print(f"✅ 백업 파일 생성: {backup_file}")
    
    # 수정된 데이터 저장
    with open(busan_file, 'w', encoding='utf-8') as f:
        json.dump(busan_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 부산 개별 파일 업데이트 완료: {len(suyeong_data)}건 추가")
    
    # 검증
    with open(busan_file, 'r', encoding='utf-8') as f:
        updated_data = json.load(f)
    
    updated_suyeong = updated_data.get('data', {}).get('부산 수영구', [])
    print(f"✅ 검증 완료: 부산 수영구 데이터 {len(updated_suyeong)}건 확인")

if __name__ == "__main__":
    fix_busan_data()

