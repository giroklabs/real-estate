#!/usr/bin/env python3
"""
부동산 데이터에서 중복 제거 스크립트
"""

import json
import os
from pathlib import Path

def remove_duplicates_from_file(file_path):
    """파일에서 중복 데이터 제거"""
    print(f"🔄 {file_path} 중복 제거 중...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        original_count = 0
        cleaned_count = 0
        
        if 'data' in data:
            # data 키 구조 (서울, 인천, 대구)
            for region_name, transactions in data['data'].items():
                if isinstance(transactions, list):
                    original_count += len(transactions)
                    
                    # 중복 제거를 위한 Set
                    seen_transactions = set()
                    unique_transactions = []
                    
                    for transaction in transactions:
                        # 고유 키 생성 (날짜 + 아파트명 + 가격 + 면적 + 층수)
                        unique_key = f"{transaction.get('date', '')}_{transaction.get('complex_name', '')}_{transaction.get('avg_price', 0)}_{transaction.get('area', 0)}_{transaction.get('floor', 0)}"
                        
                        if unique_key not in seen_transactions:
                            seen_transactions.add(unique_key)
                            unique_transactions.append(transaction)
                    
                    data['data'][region_name] = unique_transactions
                    cleaned_count += len(unique_transactions)
                    
                    removed_count = original_count - cleaned_count
                    if removed_count > 0:
                        print(f"  📊 {region_name}: {original_count} → {cleaned_count} (중복 {removed_count}건 제거)")
        else:
            # 직접 지역 키 구조 (부산, 광주, 대전, 울산)
            for region_name, transactions in data.items():
                if isinstance(transactions, list):
                    original_count += len(transactions)
                    
                    # 중복 제거를 위한 Set
                    seen_transactions = set()
                    unique_transactions = []
                    
                    for transaction in transactions:
                        # 고유 키 생성 (날짜 + 아파트명 + 가격 + 면적 + 층수)
                        unique_key = f"{transaction.get('date', '')}_{transaction.get('complex_name', '')}_{transaction.get('avg_price', 0)}_{transaction.get('area', 0)}_{transaction.get('floor', 0)}"
                        
                        if unique_key not in seen_transactions:
                            seen_transactions.add(unique_key)
                            unique_transactions.append(transaction)
                    
                    data[region_name] = unique_transactions
                    cleaned_count += len(unique_transactions)
                    
                    removed_count = original_count - cleaned_count
                    if removed_count > 0:
                        print(f"  📊 {region_name}: {original_count} → {cleaned_count} (중복 {removed_count}건 제거)")
        
        # 백업 생성
        backup_path = file_path.with_suffix(f'.backup_before_dedup_{Path(file_path).stem}')
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  💾 백업 생성: {backup_path}")
        
        # 정리된 데이터 저장
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        total_removed = original_count - cleaned_count
        print(f"  ✅ {file_path.name}: 총 {total_removed}건 중복 제거 완료")
        return total_removed
        
    except Exception as e:
        print(f"  ❌ {file_path} 처리 중 오류: {str(e)}")
        return 0

def main():
    """메인 함수"""
    data_dir = Path("collected_data")
    
    # 처리할 파일 목록
    files_to_process = [
        "seoul_all_data.json",
        "busan_all_data.json", 
        "incheon_all_data.json",
        "daegu_all_data.json",
        "gwangju_all_data.json",
        "daejeon_all_data.json",
        "ulsan_all_data.json"
    ]
    
    print("🚀 부동산 데이터 중복 제거 시작...")
    print("=" * 60)
    
    total_removed = 0
    
    for filename in files_to_process:
        file_path = data_dir / filename
        if file_path.exists():
            removed = remove_duplicates_from_file(file_path)
            total_removed += removed
        else:
            print(f"⚠️ {filename} 파일을 찾을 수 없습니다.")
    
    print("=" * 60)
    print(f"✅ 중복 제거 완료! 총 {total_removed}건의 중복 데이터가 제거되었습니다.")

if __name__ == "__main__":
    main()
