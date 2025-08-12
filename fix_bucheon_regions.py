#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
부천시 지역구분 수정 스크립트
부천시는 원미구, 소사구, 오정구로 구분되어야 함
"""

import json
import os
from collections import defaultdict

def analyze_bucheon_regions():
    """부천시 데이터의 지역구분을 분석"""
    
    data_dir = "collected_data"
    
    # 부천시 데이터 파일들
    bucheon_files = [
        "경기_부천시_소사구_data.json",
        "경기_부천시_중구_data.json", 
        "경기_부천시_북구_data.json"
    ]
    
    print("=== 부천시 지역구분 분석 ===")
    
    for filename in bucheon_files:
        filepath = os.path.join(data_dir, filename)
        if not os.path.exists(filepath):
            print(f"파일 없음: {filename}")
            continue
            
        print(f"\n--- {filename} 분석 ---")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 동별 아파트 분포 분석
        dong_apartments = defaultdict(set)
        for item in data[:100]:  # 처음 100건만 분석
            dong = item.get('dong', '')
            complex_name = item.get('complex_name', '')
            if dong and complex_name:
                dong_apartments[dong].add(complex_name)
        
        print(f"총 데이터: {len(data)}건")
        print(f"동별 아파트 분포:")
        for dong, apartments in dong_apartments.items():
            print(f"  {dong}: {len(apartments)}개 아파트")
            for apt in list(apartments)[:3]:  # 처음 3개만 표시
                print(f"    - {apt}")
            if len(apartments) > 3:
                print(f"    ... 외 {len(apartments)-3}개")

def get_bucheon_region_mapping():
    """부천시의 정확한 지역구분 매핑"""
    
    # 부천시 지역구분 (2016년 구제 폐지 전 기준)
    bucheon_regions = {
        '원미구': {
            '동': ['심곡동', '원미동', '춘의동', '도당동', '약대동', '중동', '중앙동', '상동', '상1동', '상2동', '상3동'],
            '아파트_예시': ['한라마을', '부천우방유쉘', '부천한신더휴메트로', '뉴서울', '주공', '일루미스테이트']
        },
        '소사구': {
            '동': ['소사본동', '범박동', '옥길동', '괴안동', '송내동', '상동', '중동', '중앙동', '상동', '상1동', '상2동', '상3동'],
            '아파트_예시': ['부천범박힐스테이트', '부천소사역푸르지오', '옥길데시앙', '삼익3차', '소사에스케이뷰']
        },
        '오정구': {
            '동': ['오정동', '원종동', '고강동', '작동', '내동', '여월동', '성곡동', '도당동', '약대동'],
            '아파트_예시': ['오정휴먼시아', '원종아이원시티', '여월휴먼시아', '부천동도센트리움까치울숲']
        }
    }
    
    return bucheon_regions

def fix_bucheon_regions():
    """부천시 지역구분을 수정하여 새로운 파일 생성"""
    
    data_dir = "collected_data"
    bucheon_regions = get_bucheon_region_mapping()
    
    # 기존 부천시 데이터 로드
    bucheon_file = os.path.join(data_dir, "bucheon_all_data.json")
    if not os.path.exists(bucheon_file):
        print("부천시 통합 데이터 파일이 없습니다.")
        return
    
    with open(bucheon_file, 'r', encoding='utf-8') as f:
        bucheon_data = json.load(f)
    
    # 지역구분 수정
    fixed_data = {
        '경기 부천시 원미구': [],
        '경기 부천시 소사구': [],
        '경기 부천시 오정구': []
    }
    
    # 아파트명과 동을 기준으로 지역구분 판단
    for region_name, data in bucheon_data.items():
        for item in data:
            complex_name = item.get('complex_name', '')
            dong = item.get('dong', '')
            
            # 지역구분 판단 로직
            if any(apt in complex_name for apt in bucheon_regions['원미구']['아파트_예시']):
                fixed_data['경기 부천시 원미구'].append(item)
            elif any(apt in complex_name for apt in bucheon_regions['소사구']['아파트_예시']):
                fixed_data['경기 부천시 소사구'].append(item)
            elif any(apt in complex_name for apt in bucheon_regions['오정구']['아파트_예시']):
                fixed_data['경기 부천시 오정구'].append(item)
            else:
                # 동을 기준으로 판단
                if dong in bucheon_regions['원미구']['동']:
                    fixed_data['경기 부천시 원미구'].append(item)
                elif dong in bucheon_regions['소사구']['동']:
                    fixed_data['경기 부천시 소사구'].append(item)
                elif dong in bucheon_regions['오정구']['동']:
                    fixed_data['경기 부천시 오정구'].append(item)
                else:
                    # 기본값으로 소사구에 배정 (가장 많은 데이터)
                    fixed_data['경기 부천시 소사구'].append(item)
    
    # 수정된 데이터 저장
    output_file = os.path.join(data_dir, "bucheon_fixed_regions_data.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(fixed_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n=== 부천시 지역구분 수정 완료 ===")
    for region, data in fixed_data.items():
        print(f"{region}: {len(data)}건")
    
    print(f"출력 파일: {output_file}")
    
    return fixed_data

if __name__ == '__main__':
    print("부천시 지역구분 분석 및 수정")
    print("=" * 50)
    
    # 1. 현재 지역구분 분석
    analyze_bucheon_regions()
    
    print("\n" + "=" * 50)
    
    # 2. 지역구분 수정
    fixed_data = fix_bucheon_regions()
