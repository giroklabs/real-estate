#!/usr/bin/env python3
"""
백엔드에 데이터를 직접 임베드하는 스크립트
JSON 파일을 Python 딕셔너리로 변환하여 백엔드에 포함
"""

import json
import os
from pathlib import Path
from datetime import datetime

def create_embedded_data():
    """JSON 데이터를 Python 딕셔너리로 변환"""
    data_dir = Path("collected_data")
    
    # 임베드할 파일 목록
    files_to_embed = [
        "seoul_all_data.json",
        "busan_all_data.json", 
        "incheon_all_data.json",
        "daegu_all_data.json",
        "gwangju_all_data.json",
        "daejeon_all_data.json",
        "ulsan_all_data.json"
    ]
    
    embedded_data = {}
    total_size = 0
    
    print("🔄 데이터 임베딩 시작...")
    print(f"📅 생성 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    for filename in files_to_embed:
        file_path = data_dir / filename
        if file_path.exists():
            print(f"📁 {filename} 로딩 중...")
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # 파일명에서 도시 코드 추출
                city_code = filename.replace('_all_data.json', '')
                embedded_data[city_code] = data
                
                # 데이터 크기 확인
                data_size = len(json.dumps(data, ensure_ascii=False))
                total_size += data_size
                print(f"  ✅ {city_code}: {data_size:,} bytes")
                
            except Exception as e:
                print(f"  ❌ {filename} 로딩 실패: {str(e)}")
        else:
            print(f"  ⚠️ {filename} 파일 없음")
    
    # Python 파일로 저장
    output_file = "embedded_data.py"
    print(f"\n💾 {output_file} 생성 중...")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('"""\n')
        f.write('임베드된 부동산 데이터\n')
        f.write(f'자동 생성됨 - {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')
        f.write('수동 편집 금지 - create_embedded_data.py로 재생성 필요\n')
        f.write('"""\n\n')
        f.write('EMBEDDED_DATA = ')
        f.write(json.dumps(embedded_data, ensure_ascii=False, indent=2))
        f.write('\n')
    
    file_size = os.path.getsize(output_file)
    print(f"✅ 임베드 완료!")
    print(f"📊 총 데이터 크기: {total_size:,} bytes")
    print(f"📁 생성된 파일 크기: {file_size:,} bytes")
    print(f"🗜️ 압축률: {((total_size - file_size) / total_size * 100):.1f}%")
    
    return embedded_data

if __name__ == "__main__":
    create_embedded_data()
