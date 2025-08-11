"""
지역 서비스 관리 모듈
서울, 부산, 인천, 경기, 대구로 서비스 범위 제한
"""

class RegionService:
    def __init__(self):
        # 서비스 지원 광역시/도 및 하위 지역
        self.supported_regions = {
            '서울특별시': {
                'name': '서울특별시',
                'code_prefix': '11',
                'districts': {
                    '강남구': '11680',
                    '강동구': '11740',
                    '강북구': '11305',
                    '강서구': '11500',
                    '관악구': '11620',
                    '광진구': '11215',
                    '구로구': '11530',
                    '금천구': '11545',
                    '노원구': '11350',
                    '도봉구': '11320',
                    '동대문구': '11230',
                    '동작구': '11590',
                    '마포구': '11440',
                    '서대문구': '11410',
                    '서초구': '11650',
                    '성동구': '11200',
                    '성북구': '11290',
                    '송파구': '11710',
                    '양천구': '11470',
                    '영등포구': '11560',
                    '용산구': '11170',
                    '은평구': '11380',
                    '종로구': '11110',
                    '중구': '11140',
                    '중랑구': '11260'
                }
            },
            '부산광역시': {
                'name': '부산광역시',
                'code_prefix': '26',
                'districts': {
                    '강서구': '26440',
                    '금정구': '26410',
                    '기장군': '26710',
                    '남구': '26290',
                    '동구': '26170',
                    '동래구': '26260',
                    '부산진구': '26230',
                    '북구': '26320',
                    '사상구': '26530',
                    '사하구': '26380',
                    '서구': '26140',
                    '수영구': '26500',
                    '연제구': '26470',
                    '영도구': '26200',
                    '중구': '26110',
                    '해운대구': '26350'
                }
            },
            '인천광역시': {
                'name': '인천광역시',
                'code_prefix': '28',
                'districts': {
                    '강화군': '28710',
                    '계양구': '28245',
                    '남동구': '28200',
                    '동구': '28140',
                    '미추홀구': '28177',
                    '부평구': '28237',
                    '서구': '28260',
                    '연수구': '28185',
                    '옹진군': '28720',
                    '중구': '28110'
                }
            },
            '대구광역시': {
                'name': '대구광역시',
                'code_prefix': '27',
                'districts': {
                    '남구': '27200',
                    '달서구': '27290',
                    '달성군': '27710',
                    '동구': '27140',
                    '북구': '27230',
                    '서구': '27260',
                    '수성구': '27245',
                    '중구': '27110',
                    '군위군': '27720'
                }
            },
            '경기도': {
                'name': '경기도',
                'code_prefix': '41',
                'districts': {
                    '가평군': '41820',
                    '고양시': '41280',
                    '과천시': '41290',
                    '광명시': '41210',
                    '광주시': '41610',
                    '구리시': '41310',
                    '군포시': '41410',
                    '김포시': '41570',
                    '남양주시': '41360',
                    '동두천시': '41250',
                    '부천시': '41190',
                    '성남시': '41135',
                    '수원시': '41110',
                    '시흥시': '41390',
                    '안산시': '41270',
                    '안성시': '41550',
                    '안양시': '41170',
                    '양주시': '41630',
                    '양평군': '41830',
                    '여주시': '41670',
                    '연천군': '41800',
                    '오산시': '41370',
                    '용인시': '41460',
                    '의왕시': '41430',
                    '의정부시': '41150',
                    '이천시': '41500',
                    '파주시': '41480',
                    '평택시': '41220',
                    '포천시': '41650',
                    '하남시': '41450',
                    '화성시': '41590'
                }
            }
        }
    
    def get_supported_provinces(self):
        """지원하는 광역시/도 목록 반환"""
        return list(self.supported_regions.keys())
    
    def get_districts_by_province(self, province_name):
        """특정 광역시/도의 구/군 목록 반환"""
        if province_name in self.supported_regions:
            return self.supported_regions[province_name]['districts']
        return {}
    
    def get_all_districts(self):
        """모든 지원 지역의 구/군 목록 반환"""
        all_districts = {}
        for province_data in self.supported_regions.values():
            all_districts.update(province_data['districts'])
        return all_districts
    
    def get_region_code(self, region_name):
        """지역명으로 지역코드 찾기"""
        # 먼저 정확한 매칭 시도
        for province_name, province_data in self.supported_regions.items():
            for district_name, code in province_data['districts'].items():
                # "부산 강서구" -> "부산광역시" + "강서구" 매칭
                if (province_name.replace('특별시', '').replace('광역시', '').replace('도', '') in region_name and 
                    district_name in region_name):
                    return code
        
        # 부분 매칭 시도 (기존 로직)
        for province_data in self.supported_regions.values():
            for district_name, code in province_data['districts'].items():
                if district_name in region_name or region_name in district_name:
                    return code
        return None
    
    def get_province_by_region_name(self, region_name):
        """지역명으로 소속 광역시/도 찾기"""
        for province_name, province_data in self.supported_regions.items():
            for district_name in province_data['districts'].keys():
                if district_name in region_name or region_name in district_name:
                    return province_name
        return None
    
    def is_supported_region(self, region_name):
        """지원하는 지역인지 확인"""
        return self.get_region_code(region_name) is not None
    
    def format_region_name(self, province_name, district_name):
        """표준 지역명 형식으로 변환 (예: '서울특별시 강남구' -> '서울 강남구')"""
        province_short = province_name.replace('특별시', '').replace('광역시', '').replace('도', '')
        return f"{province_short} {district_name}"
    
    def get_regions_for_api(self):
        """API에서 사용할 지역 목록 반환 (표준 형식)"""
        regions = []
        for province_name, province_data in self.supported_regions.items():
            for district_name in province_data['districts'].keys():
                formatted_name = self.format_region_name(province_name, district_name)
                regions.append(formatted_name)
        return regions
    
    def get_sample_regions_by_province(self, province_name, limit=5):
        """특정 광역시/도의 샘플 지역 반환"""
        if province_name not in self.supported_regions:
            return []
        
        districts = list(self.supported_regions[province_name]['districts'].keys())
        sample_districts = districts[:limit]
        
        return [self.format_region_name(province_name, district) 
                for district in sample_districts]
    
    def validate_region_request(self, regions):
        """요청된 지역이 모두 지원 범위 내인지 확인"""
        if not regions:
            return True, []
        
        unsupported = []
        for region in regions:
            if not self.is_supported_region(region):
                unsupported.append(region)
        
        if unsupported:
            return False, unsupported
        
        return True, []
    
    def get_default_regions(self):
        """기본 샘플 지역 반환 (각 광역시/도별 대표 지역)"""
        default_regions = [
            '서울 강남구',
            '부산 해운대구',
            '인천 연수구',
            '대구 수성구',
            '경기 수원시'
        ]
        return default_regions
