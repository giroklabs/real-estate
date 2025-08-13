#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
지역명과 지역 코드 매핑 디버깅 스크립트
"""

from services.region_service import RegionService

def debug_region_mapping():
    """지역명과 지역 코드 매핑을 디버깅"""
    
    region_service = RegionService()
    
    # 테스트할 지역명들
    test_regions = [
        '경기 부천시',
        '경기 부천시 소사구',
        '부천시',
        '부천시 소사구'
    ]
    
    print("=== 지역명과 지역 코드 매핑 디버깅 ===")
    print()
    
    for region_name in test_regions:
        region_code = region_service.get_region_code(region_name)
        province = region_service.get_province_by_region_name(region_name)
        is_supported = region_service.is_supported_region(region_name)
        
        print(f"지역명: {region_name}")
        print(f"  지역 코드: {region_code}")
        print(f"  소속 광역시/도: {province}")
        print(f"  지원 여부: {is_supported}")
        print()
    
    # 지원하는 모든 지역 출력
    print("=== 지원하는 모든 지역 ===")
    all_regions = region_service.get_regions_for_api()
    for region in all_regions:
        print(f"  {region}")
    
    print()
    print("=== 경기도 지역들 ===")
    gyeonggi_regions = region_service.get_districts_by_province('경기도')
    for district, code in gyeonggi_regions.items():
        print(f"  {district}: {code}")

if __name__ == '__main__':
    debug_region_mapping()
