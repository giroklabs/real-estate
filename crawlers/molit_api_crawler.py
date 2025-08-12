import requests
import pandas as pd
import xml.etree.ElementTree as ET
import time
from datetime import datetime, timedelta
from database.models import save_transaction_data, save_price_change_data
from services.region_service import RegionService
import concurrent.futures
import threading
import urllib.parse

class MolitAPICrawler:
    def __init__(self):
        # 공공데이터포털 OpenAPI 설정 (기존 작동하는 엔드포인트)
        self.base_url = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev"
        # 인코딩된 키 (새로운 키)
        self.service_key_encoded = "iJ494e%2B8%2FQFaOfEPwX51jVQMAqn8oLwjg4%2BA3chAO4QDuk%2BQcyHDe%2BltkHtQc2JV%2Baygqkyq48o0CqZSep%2F%2BLQ%3D%3D"
        # 디코딩된 키 (새로운 키)
        self.service_key_decoded = "iJ494e+8/QFaOfEPwX51jVQMAqn8oLwjg4+A3chAO4QDuk+QcyHDe+ltkHtQc2JV+aygqkyq48o0CqZSep/+LQ=="
        # 현재 사용할 키 (디코딩된 키 사용)
        self.service_key = self.service_key_decoded
        
        # API 키 테스트 모드 (새로운 키로 실제 API 호출 시도)
        self.test_mode = False  # 새로운 키로 실제 API 호출
        
        # 지역 서비스 연동
        self.region_service = RegionService()
        
    def get_apartment_data(self, region_code, deal_date, page_no=1, num_of_rows=10):
        """공공데이터포털 API로 아파트 실거래가 데이터 조회"""
        try:
            # RESTful 서비스를 위한 UTF-8 URL 인코딩 (특수문자 = 포함)
            # 디코딩된 인증키를 직접 사용하는 방법
            # 출처: https://hyeonhahaha.tistory.com/entry/공공데이터-e약은요-연동-중-서비스-키-등록-안됨-문제-해결-과정
            
            # 디코딩된 서비스키를 직접 파라미터로 사용 (이전 인증키)
            SERVICE_KEY = "+6+gD3OxMqe/Y7ddcg7thoXJk/m8nYqXOw7uyZEDObEo80uaT+ZjDV7P67Syrf2b5CGaPGaELTT8OIPU5YyL0A=="
            
            # 파라미터 구성 (디코딩된 키 직접 사용)
            params = {
                'serviceKey': SERVICE_KEY,
                'LAWD_CD': region_code,
                'DEAL_YMD': deal_date,
                'pageNo': page_no,
                'numOfRows': num_of_rows
            }
            
            # API 호출
            base_url = self.base_url
            
            print(f"공공데이터포털 API 호출: {region_code}, {deal_date}, 페이지: {page_no}")
            print(f"디코딩된 서비스키: {SERVICE_KEY[:30]}...")
            print(f"API URL: {base_url}")
            response = requests.get(base_url, params=params, timeout=30)
            
            if response.status_code == 200:
                print(f"API 응답 상태: 성공 (200)")
                return self.parse_xml_response(response.text, region_code)
            else:
                print(f"API 호출 실패: {response.status_code}")
                print(f"응답 내용: {response.text[:500]}")
                return []
                
        except Exception as e:
            print(f"공공데이터포털 API 오류: {str(e)}")
            return []
    
    def parse_xml_response(self, xml_text, region_code):
        """XML 응답 파싱 (공공데이터포털 문서 기준)"""
        try:
            print(f"XML 응답 내용 (처음 1000자): {xml_text[:1000]}")
            root = ET.fromstring(xml_text)
            
            # 결과 코드 확인 (header 내부)
            result_code = root.find('.//resultCode')
            result_msg = root.find('.//resultMsg')
            
            # API 키 오류 확인
            auth_msg = root.find('.//returnAuthMsg')
            if auth_msg is not None and 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR' in auth_msg.text:
                print(f"⚠️  API 키 오류 감지: {auth_msg.text}")
                return {'error': 'api_key_error', 'message': auth_msg.text}
            
            if result_code is not None:
                print(f"API 결과 코드: {result_code.text}")
                print(f"API 결과 메시지: {result_msg.text if result_msg is not None else 'N/A'}")
                
                if result_code.text != '000':  # 공공데이터포털 API는 '000'을 성공 코드로 사용
                    print(f"API 결과 코드 오류: {result_code.text}")
                    return []
            
            # 전체 결과 수 확인
            total_count = root.find('.//totalCount')
            if total_count is not None:
                print(f"전체 결과 수: {total_count.text}")
            
            # 거래 데이터 추출 (items/item 구조)
            items = []
            for item in root.findall('.//item'):
                try:
                    # 문서 기준 필드명 사용
                    deal_amount = item.find('dealAmount')  # 거래금액
                    area = item.find('excluUseAr')  # 전용면적
                    floor = item.find('floor')  # 층
                    dong = item.find('umdNm')  # 법정동 (읍면동명)
                    jibun = item.find('jibun')  # 지번
                    apartment_name = item.find('aptNm')  # 아파트명
                    deal_year = item.find('dealYear')  # 거래년도
                    deal_month = item.find('dealMonth')  # 거래월
                    deal_day = item.find('dealDay')  # 거래일
                    
                    # 필드 존재 여부 확인
                    if deal_amount is None or apartment_name is None:
                        print(f"필수 필드 누락, 스킵")
                        continue
                    
                    # 거래일자 조합
                    year = deal_year.text.strip() if deal_year is not None else '2024'
                    month = deal_month.text.strip().zfill(2) if deal_month is not None else '01'
                    day = deal_day.text.strip().zfill(2) if deal_day is not None else '01'
                    deal_date = f"{year}-{month}-{day}"
                    
                    # 가격 파싱
                    price = self.parse_amount(deal_amount.text.strip())
                    
                    # 지역명 찾기
                    region_name = self.get_region_name(region_code)
                    
                    # 면적 파싱
                    area_value = self.parse_area(area.text.strip() if area is not None else '84.5')
                    
                    # 층수 파싱
                    floor_value = self.parse_floor(floor.text.strip() if floor is not None else '10')
                    
                    transaction = {
                        'date': deal_date,
                        'region_name': region_name,
                        'complex_name': apartment_name.text.strip(),
                        'transaction_count': 1,
                        'avg_price': price,
                        'source': 'molit_api',
                        'area': area_value,
                        'floor': floor_value,
                        'latest_transaction_date': deal_date,
                        'dong': dong.text.strip() if dong is not None else '',
                        'jibun': jibun.text.strip() if jibun is not None else ''
                    }
                    
                    items.append(transaction)
                    print(f"거래 데이터 파싱 완료: {apartment_name.text.strip()}, {price:,}원")
                    
                except Exception as e:
                    print(f"개별 항목 파싱 오류: {str(e)}")
                    continue
            
            print(f"파싱된 거래 데이터: {len(items)}건")
            return items
            
        except Exception as e:
            print(f"XML 파싱 오류: {str(e)}")
            print(f"XML 원본: {xml_text}")
            return []
    
    def parse_amount(self, amount_str):
        """거래금액 파싱 (만원 단위 -> 원 단위)"""
        try:
            amount_str = amount_str.strip().replace(',', '')
            
            # 문서에 따르면 거래금액은 만원 단위로 제공
            if amount_str.isdigit():
                # 숫자만 있는 경우 (만원 단위)
                return int(amount_str) * 10000
            elif '억' in amount_str:
                # 억 단위 표기가 있는 경우
                parts = amount_str.split('억')
                if len(parts) == 2:
                    billion = int(parts[0].strip()) * 100000000
                    million = int(parts[1].strip()) * 10000 if parts[1].strip() else 0
                    return billion + million
                else:
                    return int(parts[0].strip()) * 100000000
            else:
                # 기타 형태는 만원 단위로 처리
                return int(float(amount_str)) * 10000
                
        except Exception as e:
            print(f"가격 파싱 오류: {str(e)}, 원본: {amount_str}")
            return 500000000  # 기본값 (5억원)
    
    def parse_area(self, area_str):
        """면적 파싱 (예: "84.97" -> 84.97)"""
        try:
            return float(area_str.strip())
        except:
            return 84.5  # 기본값
    
    def parse_floor(self, floor_str):
        """층수 파싱 (예: "10" -> 10)"""
        try:
            return int(floor_str.strip())
        except:
            return 10  # 기본값
    
    def get_region_name(self, region_code):
        """법정동 코드로 지역명 찾기"""
        # 지역 서비스에서 직접 조회하여 정확한 매핑
        for province_name, province_data in self.region_service.supported_regions.items():
            for district_name, code in province_data['districts'].items():
                if code == region_code:
                    return self.region_service.format_region_name(province_name, district_name)
        
        return f"지역코드_{region_code}"
    
    def get_region_code(self, region_name):
        """지역명으로 법정동 코드 찾기 (지역 서비스 사용)"""
        return self.region_service.get_region_code(region_name)
    
    def generate_date_list(self, start_year=2023, end_year=2024):
        """날짜 리스트 생성 (YYYYMM 형식)"""
        date_list = []
        for year in range(start_year, end_year + 1):
            for month in range(1, 13):
                date_list.append(f"{year}{month:02d}")
        return date_list
    
    def crawl_region_data_with_code(self, region_code, months=24):
        """지역 코드로 직접 데이터 수집 (다중 페이지 처리) - 최근 N개월 데이터 수집"""
        if not region_code:
            print(f"지역 코드가 제공되지 않았습니다")
            return []
        
        all_transactions = []
        
        # 최근 N개월 데이터 수집
        current_date = datetime.now()
        for i in range(months):
            target_date = current_date - timedelta(days=30*i)
            deal_date = target_date.strftime('%Y%m')  # YYYYMM 형식으로 변경
            
            # 첫 번째 페이지 호출로 전체 데이터 수 확인
            first_page_data = self.get_apartment_data(region_code, deal_date, page_no=1, num_of_rows=100)
            if isinstance(first_page_data, list):
                all_transactions.extend(first_page_data)
            
            # 첫 페이지에서 100건이 나왔다면 추가 페이지가 있을 수 있음
            if isinstance(first_page_data, list) and len(first_page_data) == 100:
                page_no = 2
                while True:
                    page_data = self.get_apartment_data(region_code, deal_date, page_no=page_no, num_of_rows=100)
                    if not page_data or not isinstance(page_data, list):
                        break
                    all_transactions.extend(page_data)
                    
                    # 100건 미만이면 마지막 페이지
                    if len(page_data) < 100:
                        break
                    
                    page_no += 1
                    time.sleep(0.2)  # 페이지 간 간격 (속도 향상)
            
            # 월별 간격 조절 (속도 향상)
            time.sleep(0.5)
        
        return all_transactions

    def crawl_region_data(self, region_name, months=24):
        """특정 지역의 데이터 수집 (다중 페이지 처리) - 최근 2년 데이터 수집"""
        region_code = self.get_region_code(region_name)
        
        if not region_code:
            print(f"지역 코드를 찾을 수 없습니다: {region_name}")
            return []
        
        all_transactions = []
        
        # 최근 N개월 데이터 수집
        current_date = datetime.now()
        for i in range(months):
            target_date = current_date - timedelta(days=30*i)
            deal_date = target_date.strftime('%Y%m')  # YYYYMM 형식으로 변경
            
            # 첫 번째 페이지 호출로 전체 데이터 수 확인
            first_page_data = self.get_apartment_data(region_code, deal_date, page_no=1, num_of_rows=100)
            all_transactions.extend(first_page_data)
            
            # 첫 페이지에서 100건이 나왔다면 추가 페이지가 있을 수 있음
            if len(first_page_data) == 100:
                page_no = 2
                while True:
                    page_data = self.get_apartment_data(region_code, deal_date, page_no=page_no, num_of_rows=100)
                    if not page_data:
                        break
                    all_transactions.extend(page_data)
                    
                    # 100건 미만이면 마지막 페이지
                    if len(page_data) < 100:
                        break
                    
                    page_no += 1
                    time.sleep(0.2)  # 페이지 간 간격 (속도 향상)
            
            # 월별 간격 조절 (속도 향상)
            time.sleep(0.5)
        
        return all_transactions
    
    def crawl_all_regions(self, regions=None):
        """모든 지역 데이터 수집 (지역 서비스 범위 내에서만)"""
        if regions is None:
            regions = self.region_service.get_default_regions()
        
        # 지원하지 않는 지역 필터링
        valid, unsupported = self.region_service.validate_region_request(regions)
        if not valid:
            print(f"지원하지 않는 지역이 포함되어 있습니다: {unsupported}")
            # 지원하는 지역만 필터링
            regions = [r for r in regions if self.region_service.is_supported_region(r)]
            print(f"지원하는 지역으로 필터링: {regions}")
        
        if not regions:
            print("처리할 수 있는 지역이 없습니다. 기본 지역을 사용합니다.")
            regions = self.region_service.get_default_regions()
        
        all_transactions = []
        all_price_changes = []
        
        for region_name in regions:
            try:
                print(f"\n=== {region_name} 국토교통부 데이터 수집 시작 ===")
                
                # 지역 데이터 수집
                region_transactions = self.crawl_region_data(region_name)
                
                if not region_transactions:
                    print(f"{region_name}: API 데이터 수집 실패 - 실제 데이터 없음")
                    continue
                
                # 데이터베이스에 저장
                for transaction in region_transactions:
                    save_transaction_data(transaction)
                
                all_transactions.extend(region_transactions)
                
                # 가격변동률 계산
                if len(region_transactions) >= 2:
                    recent_price = region_transactions[0]['avg_price']
                    old_price = region_transactions[-1]['avg_price']
                    change_rate = ((recent_price - old_price) / old_price) * 100
                    
                    price_change = {
                        'date': datetime.now().strftime('%Y-%m-01'),
                        'region_name': region_transactions[0]['region_name'],
                        'avg_price': recent_price,
                        'price_change_rate': change_rate
                    }
                    
                    save_price_change_data(price_change)
                    all_price_changes.append(price_change)
                
                print(f"{region_name} 국토교통부 데이터 수집 완료: {len(region_transactions)}건")
                
                # 지역 간 간격 조절 (속도 향상)
                time.sleep(0.5)
                
            except Exception as e:
                print(f"{region_name} 국토교통부 데이터 수집 실패: {str(e)}")
                continue
        
        return {
            'transactions': all_transactions,
            'price_changes': all_price_changes,
            'total_count': len(all_transactions)
        }
    

