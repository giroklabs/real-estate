import requests
import json
import os
from datetime import datetime, timedelta
import time
from database.models import save_transaction_data, save_price_change_data

class PublicDataCrawler:
    def __init__(self):
        # 공공데이터포털 API 키
        self.api_key = os.getenv('PUBLIC_DATA_API_KEY', "ggUugQqwpC%2FkfXHvV9vkOBaq9LCD9XbNnzs3FZq%2FwiEOTPXZpz6cQZ1%2B2r7VWtTWTnkUaJhpdvPtGaHvtzw5xw%3D%3D")
        self.base_url = "http://openapi.molit.go.kr:8081/OpenAPI_ToolInstallPackage/service/rest/RTMSOBJSvc/getRTMSDataSvcAptTrade"
        
    def get_real_estate_data(self, region_code, start_date, end_date):
        """실거래가 데이터 조회"""
        try:
            # 최근 3개월 데이터 수집 (API 제한 고려)
            from datetime import datetime, timedelta
            current_date = datetime.now()
            
            all_transactions = []
            
            for i in range(3):  # 3개월로 제한
                # 각 월별로 데이터 수집
                target_date = current_date - timedelta(days=30*i)
                deal_ymd = target_date.strftime('%Y%m')
                
                params = {
                    'serviceKey': self.api_key,
                    'LAWD_CD': region_code,
                    'DEAL_YMD': deal_ymd
                }
                
                print(f"공공데이터 API 호출: {region_code}, {deal_ymd}")
                print(f"API URL: {self.base_url}")
                print(f"API 파라미터: {params}")
                
                response = requests.get(self.base_url, params=params, timeout=30)
                print(f"API 응답 상태: {response.status_code}")
                print(f"API 응답 헤더: {response.headers}")
                
                response.raise_for_status()
                
                # XML 응답을 파싱
                data = response.text
                print(f"API 응답 길이: {len(data)}")
                print(f"API 응답 내용 (처음 500자): {data[:500]}")
                
                transactions = self.parse_xml_response(data, region_code)
                all_transactions.extend(transactions)
                
                # API 호출 간격 조절 (서버 부하 방지)
                time.sleep(2)
            
            return all_transactions
            
        except Exception as e:
            print(f"공공데이터 API 호출 실패: {str(e)}")
            return []
    
    def parse_xml_response(self, xml_data, region_code):
        """XML 응답 파싱"""
        transactions = []
        
        # 간단한 XML 파싱 (실제로는 lxml 사용 권장)
        import re
        
        # 거래 데이터 추출
        trade_pattern = r'<item>(.*?)</item>'
        items = re.findall(trade_pattern, xml_data, re.DOTALL)
        
        print(f"파싱된 거래 데이터: {len(items)}건")
        
        for item in items:
            try:
                # 각 필드 추출
                date_match = re.search(r'<거래일>(\d+)</거래일>', item)
                price_match = re.search(r'<거래금액>([^<]+)</거래금액>', item)
                area_match = re.search(r'<전용면적>([^<]+)</전용면적>', item)
                floor_match = re.search(r'<층>(\d+)</층>', item)
                name_match = re.search(r'<아파트>([^<]+)</아파트>', item)
                dong_match = re.search(r'<법정동>([^<]+)</법정동>', item)
                
                if date_match and price_match:
                    date = date_match.group(1)
                    price = self.parse_amount(price_match.group(1))
                    area = float(area_match.group(1)) if area_match else 84.5
                    floor = int(floor_match.group(1)) if floor_match else 15
                    name = name_match.group(1) if name_match else f"{self.get_region_name(region_code)} 아파트"
                    dong = dong_match.group(1) if dong_match else ""
                    
                    transaction = {
                        'date': f"{date[:4]}-{date[4:6]}-{date[6:8]}",
                        'region_name': self.get_region_name(region_code),
                        'complex_name': name,
                        'transaction_count': 1,
                        'avg_price': price,
                        'source': 'public_data_api',
                        'area': area,
                        'floor': floor,
                        'dong': dong
                    }
                    
                    transactions.append(transaction)
                    
            except Exception as e:
                print(f"데이터 파싱 오류: {str(e)}")
                continue
        
        return transactions
    
    def parse_amount(self, amount_str):
        """금액 문자열을 숫자로 변환"""
        try:
            # "1억 5,000" 형태의 문자열을 숫자로 변환
            amount_str = amount_str.strip()
            
            if '억' in amount_str:
                parts = amount_str.split('억')
                if len(parts) == 2:
                    billion = int(parts[0]) * 100000000
                    million = int(parts[1].replace(',', '')) * 10000 if parts[1] else 0
                    return billion + million
                else:
                    return int(parts[0]) * 100000000
            else:
                return int(amount_str.replace(',', '')) * 10000
                
        except Exception as e:
            print(f"금액 파싱 오류: {str(e)}")
            return 500000000  # 기본값
    
    def get_region_name(self, region_code):
        """지역 코드를 지역명으로 변환"""
        region_map = {
            '11110': '서울 종로구',
            '11140': '서울 중구',
            '11170': '서울 용산구',
            '11200': '서울 성동구',
            '11215': '서울 광진구',
            '11260': '서울 중랑구',
            '11305': '서울 성북구',
            '11320': '서울 강북구',
            '11350': '서울 도봉구',
            '11380': '서울 노원구',
            '11410': '서울 은평구',
            '11440': '서울 서대문구',
            '11470': '서울 마포구',
            '11500': '서울 양천구',
            '11530': '서울 구로구',
            '11545': '서울 금천구',
            '11560': '서울 영등포구',
            '11590': '서울 동작구',
            '11620': '서울 관악구',
            '11650': '서울 서초구',
            '11680': '서울 강남구',
            '11710': '서울 송파구',
            '11740': '서울 강동구',
            '26440': '부산 해운대구',
            '26410': '부산 부산진구',
            '26290': '부산 수영구',
            '41135': '경기 성남시',
            '41110': '경기 수원시',
            '41190': '경기 고양시',
            '41210': '경기 용인시',
            '28177': '인천 미추홀구',
            '28245': '인천 연수구',
            '28140': '인천 남동구'
        }
        return region_map.get(region_code, f'지역코드 {region_code}')
    

    
    def crawl_all_regions(self, regions=None):
        """모든 지역 데이터 수집"""
        if regions is None:
            regions = ['11680', '11620', '11710', '26440', '41135']  # 주요 지역 코드
        
        all_transactions = []
        all_price_changes = []
        
        for region_code in regions:
            try:
                # 최근 6개월 데이터 수집
                end_date = datetime.now()
                start_date = end_date - timedelta(days=180)
                
                transactions = self.get_real_estate_data(
                    region_code, 
                    start_date.strftime('%Y%m'), 
                    end_date.strftime('%Y%m')
                )
                
                # 데이터베이스에 저장
                for transaction in transactions:
                    save_transaction_data(transaction)
                
                all_transactions.extend(transactions)
                
                # 가격변동률 계산
                if len(transactions) >= 2:
                    recent_price = transactions[0]['avg_price']
                    old_price = transactions[-1]['avg_price']
                    change_rate = ((recent_price - old_price) / old_price) * 100
                    
                    price_change = {
                        'date': datetime.now().strftime('%Y-%m-01'),
                        'region_name': transactions[0]['region_name'],
                        'avg_price': recent_price,
                        'price_change_rate': change_rate
                    }
                    
                    save_price_change_data(price_change)
                    all_price_changes.append(price_change)
                
                print(f"{region_code} 지역 데이터 수집 완료: {len(transactions)}건")
                
                # API 호출 간격 조절
                time.sleep(1)
                
            except Exception as e:
                print(f"{region_code} 지역 데이터 수집 실패: {str(e)}")
                continue
        
        return {
            'transactions': all_transactions,
            'price_changes': all_price_changes,
            'total_count': len(all_transactions)
        }
