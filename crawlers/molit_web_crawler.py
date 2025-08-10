import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import re
from datetime import datetime, timedelta
import logging

class MolitWebCrawler:
    """국토교통부 실거래가 공개시스템 웹 크롤러"""
    
    def __init__(self):
        self.base_url = "https://rt.molit.go.kr/pt/gis/gis.do"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
    def get_region_code(self, region_name):
        """지역명으로 지역코드 반환"""
        # 시도 단위 매핑
        sido_mapping = {
            '서울특별시': '11',
            '부산광역시': '21',
            '대구광역시': '22',
            '인천광역시': '23',
            '광주광역시': '24',
            '대전광역시': '25',
            '울산광역시': '26',
            '세종특별자치시': '29',
            '경기도': '41',
            '강원도': '42',
            '충청북도': '43',
            '충청남도': '44',
            '전라북도': '45',
            '전라남도': '46',
            '경상북도': '47',
            '경상남도': '48',
            '제주특별자치도': '50'
        }
        
        # 시군구 단위 매핑 (부산의 경우)
        gugun_mapping = {
            '부산 강서구': '21',
            '부산 금정구': '21',
            '부산 남구': '21',
            '부산 동구': '21',
            '부산 동래구': '21',
            '부산 부산진구': '21',
            '부산 북구': '21',
            '부산 사상구': '21',
            '부산 사하구': '21',
            '부산 서구': '21',
            '부산 수영구': '21',
            '부산 연제구': '21',
            '부산 영도구': '21',
            '부산 중구': '21',
            '부산 해운대구': '21',
            '부산 기장군': '21'
        }
        
        # 먼저 시군구 단위 매핑 확인
        if region_name in gugun_mapping:
            return gugun_mapping[region_name]
        
        # 시도 단위 매핑 확인
        for key, value in sido_mapping.items():
            if region_name.startswith(key):
                return value
        return None
    
    def get_apartment_data(self, region_name, deal_date, property_type='아파트'):
        """아파트 실거래가 데이터 조회"""
        try:
            region_code = self.get_region_code(region_name)
            if not region_code:
                print(f"지역 코드를 찾을 수 없습니다: {region_name}")
                return []
            
            # 파라미터 구성
            params = {
                'mobileAt': '',
                'srhThingSecd': 'A',  # 아파트
                'sido': region_code,
                'gugun': '',  # 시군구 (필요시 추가)
                'dong': '',   # 읍면동 (필요시 추가)
                'startDate': deal_date,
                'endDate': deal_date,
                'pageNo': 1
            }
            
            print(f"국토교통부 웹사이트 조회: {region_name}, {deal_date}")
            
            # 데이터 조회
            response = self.session.get(self.base_url, params=params, timeout=30)
            
            if response.status_code == 200:
                # HTML 파싱하여 데이터 추출
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 실거래가 테이블 찾기
                table = soup.find('table', {'class': 'tbl_type01'})
                if table:
                    return self._parse_table_data(table, region_name)
                else:
                    print(f"데이터 테이블을 찾을 수 없습니다: {region_name}")
                    return []
            else:
                print(f"HTTP 오류: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"국토교통부 웹사이트 조회 오류: {str(e)}")
            return []
    
    def _parse_table_data(self, table, region_name):
        """테이블 데이터 파싱"""
        transactions = []
        rows = table.find_all('tr')[1:]  # 헤더 제외
        
        for row in rows:
            try:
                cells = row.find_all('td')
                if len(cells) >= 8:
                    transaction = {
                        'region_name': region_name,
                        'complex_name': cells[0].get_text(strip=True),
                        'area': cells[1].get_text(strip=True),
                        'floor': cells[2].get_text(strip=True),
                        'price': cells[3].get_text(strip=True),
                        'deal_date': cells[4].get_text(strip=True),
                        'address': cells[5].get_text(strip=True),
                        'construction_year': cells[6].get_text(strip=True),
                        'latest_transaction_date': datetime.now().strftime('%Y-%m-%d')
                    }
                    transactions.append(transaction)
            except Exception as e:
                print(f"행 파싱 오류: {str(e)}")
                continue
        
        return transactions
    
    def crawl_region_data(self, region_name, months=24):
        """특정 지역의 데이터 수집 (다중 월 처리)"""
        all_transactions = []
        
        # 최근 N개월 데이터 수집
        current_date = datetime.now()
        for i in range(months):
            target_date = current_date - timedelta(days=30*i)
            deal_date = target_date.strftime('%Y%m')
            
            print(f"{region_name} {deal_date} 데이터 수집 중...")
            
            monthly_data = self.get_apartment_data(region_name, deal_date)
            if monthly_data:
                all_transactions.extend(monthly_data)
                print(f"{deal_date}: {len(monthly_data)}건 수집")
            else:
                print(f"{deal_date}: 데이터 없음")
            
            # 서버 부하 방지를 위한 대기
            time.sleep(1)
        
        print(f"{region_name} 총 {len(all_transactions)}건 수집 완료")
        return all_transactions

# 사용 예시
if __name__ == "__main__":
    crawler = MolitWebCrawler()
    data = crawler.crawl_region_data("경기도 성남시", months=3)
    print(f"수집된 데이터: {len(data)}건")
