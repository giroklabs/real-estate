#!/usr/bin/env python3
"""
Gzip 압축 효과 테스트 스크립트
"""

import gzip
import json
import os

def test_gzip_compression():
    """Gzip 압축 효과 테스트"""
    
    # 테스트할 데이터 파일들
    test_files = [
        'collected_data/all_cities_integrated_data.json',
        'collected_data/integrated_all_data_20250811_174025.json',
        'collected_data/busan_incheon_seoul_daegu_bucheon_all_data.json'
    ]
    
    print("🚀 Gzip 압축 효과 테스트 시작\n")
    
    for file_path in test_files:
        if os.path.exists(file_path):
            try:
                # 원본 파일 크기
                original_size = os.path.getsize(file_path)
                original_size_mb = original_size / (1024 * 1024)
                
                # 파일 읽기
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # JSON 문자열로 변환
                json_str = json.dumps(data, ensure_ascii=False)
                json_size = len(json_str.encode('utf-8'))
                json_size_mb = json_size / (1024 * 1024)
                
                # Gzip 압축
                gzip_data = gzip.compress(json_str.encode('utf-8'))
                compressed_size = len(gzip_data)
                compressed_size_mb = compressed_size / (1024 * 1024)
                
                # 압축률 계산
                compression_ratio = (1 - compressed_size / json_size) * 100
                
                print(f"📁 파일: {file_path}")
                print(f"   원본 크기: {original_size_mb:.2f}MB")
                print(f"   JSON 크기: {json_size_mb:.2f}MB")
                print(f"   압축 크기: {compressed_size_mb:.2f}MB")
                print(f"   압축률: {compression_ratio:.1f}%")
                print(f"   절약: {json_size_mb - compressed_size_mb:.2f}MB")
                print()
                
            except Exception as e:
                print(f"❌ {file_path} 테스트 실패: {e}\n")
        else:
            print(f"⚠️  {file_path} 파일이 존재하지 않습니다.\n")

if __name__ == "__main__":
    test_gzip_compression()
