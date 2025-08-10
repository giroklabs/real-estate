#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
환경 변수 설정 도우미 스크립트
"""

import os

def setup_environment():
    """환경 변수 설정 도우미"""
    print("=== 부동산 데이터 수집 환경 설정 ===")
    print()
    
    # 현재 환경 변수 확인
    molit_encoded = os.getenv('MOLIT_SERVICE_KEY_ENCODED', '')
    molit_decoded = os.getenv('MOLIT_SERVICE_KEY_DECODED', '')
    
    print("현재 설정된 환경 변수:")
    print(f"MOLIT_SERVICE_KEY_ENCODED: {'설정됨' if molit_encoded else '설정되지 않음'}")
    print(f"MOLIT_SERVICE_KEY_DECODED: {'설정됨' if molit_decoded else '설정되지 않음'}")
    print()
    
    if not molit_encoded and not molit_decoded:
        print("⚠️  API 키가 설정되지 않았습니다!")
        print()
        print("다음 단계를 따라 환경 변수를 설정하세요:")
        print()
        print("1. .env 파일 생성:")
        print("   touch .env")
        print()
        print("2. .env 파일에 다음 내용 추가:")
        print("   MOLIT_SERVICE_KEY_ENCODED=your_encoded_key_here")
        print("   MOLIT_SERVICE_KEY_DECODED=your_decoded_key_here")
        print()
        print("3. 환경 변수 로드:")
        print("   source .env")
        print()
        print("4. 또는 터미널에서 직접 설정:")
        print("   export MOLIT_SERVICE_KEY_ENCODED=your_key_here")
        print("   export MOLIT_SERVICE_KEY_DECODED=your_key_here")
        print()
        print("API 키는 다음에서 발급받을 수 있습니다:")
        print("- 공공데이터포털: https://www.data.go.kr/")
        print("- 국토교통부 실거래가 API")
        print()
        return False
    else:
        print("✅ API 키가 설정되어 있습니다.")
        print("데이터 수집을 시작할 수 있습니다.")
        print()
        return True

def test_api_connection():
    """API 연결 테스트"""
    print("=== API 연결 테스트 ===")
    
    try:
        from crawlers.molit_api_crawler import MolitAPICrawler
        
        crawler = MolitAPICrawler()
        
        if not crawler.service_key:
            print("❌ API 키가 설정되지 않았습니다.")
            return False
        
        print("✅ API 키 확인됨")
        print(f"API URL: {crawler.base_url}")
        print()
        
        # 간단한 지역 코드 테스트
        test_region = '부산 해운대구'
        region_code = crawler.get_region_code(test_region)
        
        if region_code:
            print(f"✅ 지역 코드 변환 성공: {test_region} -> {region_code}")
        else:
            print(f"❌ 지역 코드 변환 실패: {test_region}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ API 연결 테스트 실패: {e}")
        return False

if __name__ == '__main__':
    print("환경 설정을 확인하고 있습니다...")
    print()
    
    # 환경 변수 설정 확인
    env_ok = setup_environment()
    
    if env_ok:
        print()
        # API 연결 테스트
        api_ok = test_api_connection()
        
        if api_ok:
            print()
            print("🎉 모든 설정이 완료되었습니다!")
            print("python data_collector.py 명령으로 데이터 수집을 시작할 수 있습니다.")
        else:
            print()
            print("❌ API 연결에 문제가 있습니다.")
            print("환경 변수와 API 키를 다시 확인해주세요.")
    else:
        print()
        print("❌ 환경 변수 설정이 필요합니다.")
        print("위의 안내에 따라 설정을 완료한 후 다시 실행해주세요.")
