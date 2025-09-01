from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import json
import gzip
from datetime import datetime, timedelta
import os
import urllib.parse
from database.models import init_db
from crawlers.public_data_crawler import PublicDataCrawler

# 선택적 의존성(셀레니움 등)에 의존하는 크롤러는 지연/옵션 임포트로 처리
try:
    from crawlers.asil_crawler import AsilCrawler  # requires selenium
except Exception:
    AsilCrawler = None
try:
    from crawlers.molit_api_crawler import MolitAPICrawler  # may require pandas/numpy
except Exception:
    MolitAPICrawler = None
try:
    from crawlers.molit_web_crawler import MolitWebCrawler
except Exception:
    MolitWebCrawler = None
try:
    from crawlers.web_scraper import WebScraper  # optional dependency (selenium)
except Exception:
    WebScraper = None
from services.region_service import RegionService

# Gzip 압축 헬퍼 함수
def create_gzipped_response(data, status_code=200):
    """Gzip 압축된 JSON 응답 생성 (최적화된 압축률 및 JSON 형식)"""
    # JSON 최적화: separators로 공백 제거, 최대 압축률 적용
    json_data = json.dumps(data, separators=(',', ':'), ensure_ascii=False)
    gzip_data = gzip.compress(json_data.encode('utf-8'), compresslevel=9)
    
    response = jsonify(data)
    response.headers['Content-Encoding'] = 'gzip'
    response.headers['Content-Length'] = len(gzip_data)
    response.headers['Vary'] = 'Accept-Encoding'
    response.status_code = status_code
    
    # Flask의 jsonify와 gzip을 함께 사용하기 위한 처리
    response.data = gzip_data
    response.mimetype = 'application/json'
    
    return response

def extract_city_from_integrated_data(city_code):
    """통합 데이터 파일에서 특정 도시 데이터 추출"""
    try:
        # 도시 코드를 한글명으로 매핑 (확장 가능)
        city_mapping = {
            'daegu': '대구',
            'incheon': '인천',
            'anyang': '안양',
            'suwon': '수원',
            'yongin': '용인',
            'goyang': '고양',
            'sejong': '세종'
        }
        
        city_name = city_mapping.get(city_code)
        if not city_name:
            return None
            
        # 통합 파일에서 해당 도시 데이터 찾기
        integrated_files = [
            'busan_incheon_seoul_daegu_all_data.json',
            'busan_incheon_seoul_daegu_bucheon_all_data.json'
        ]
        
        for filename in integrated_files:
            filepath = os.path.join('collected_data', filename)
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                # 해당 도시로 시작하는 모든 지역 데이터 추출
                city_data = {}
                for region_key, region_data in data.items():
                    if region_key.startswith(city_name):
                        city_data[region_key] = region_data
                        
                if city_data:
                    return city_data
                    
        return None
        
    except Exception as e:
        print(f"통합 데이터에서 {city_code} 추출 실패: {e}")
        return None

# 저장된 데이터 로드 함수
def load_saved_busan_data():
    """저장된 부산 데이터 로드"""
    try:
        data_dir = "collected_data"
        all_data_filename = f"{data_dir}/busan_all_data.json"
        
        if os.path.exists(all_data_filename):
            with open(all_data_filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            print("저장된 부산 데이터가 없습니다.")
            return None
    except Exception as e:
        print(f"데이터 로드 오류: {e}")
        return None

def load_saved_busan_incheon_seoul_data():
    """저장된 부산+인천+서울 데이터 로드"""
    try:
        data_dir = "collected_data"
        all_data_filename = f"{data_dir}/busan_incheon_seoul_all_data.json"
        
        if os.path.exists(all_data_filename):
            with open(all_data_filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            print("저장된 부산+인천+서울 데이터가 없습니다.")
            return None
    except Exception as e:
        print(f"데이터 로드 오류: {e}")
        return None

def load_saved_busan_incheon_seoul_daegu_data():
    """저장된 부산+인천+서울+대구 데이터 로드"""
    try:
        data_dir = "collected_data"
        all_data_filename = f"{data_dir}/busan_incheon_seoul_daegu_all_data.json"
        
        if os.path.exists(all_data_filename):
            with open(all_data_filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            print("저장된 부산+인천+서울+대구 데이터가 없습니다.")
            return None
    except Exception as e:
        print(f"데이터 로드 오류: {e}")
        return None

def load_saved_busan_incheon_seoul_daegu_bucheon_data():
    """저장된 부산+인천+서울+대구+부천 데이터 로드"""
    try:
        data_dir = "collected_data"
        all_data_filename = f"{data_dir}/busan_incheon_seoul_daegu_bucheon_all_data.json"
        
        if os.path.exists(all_data_filename):
            with open(all_data_filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            print("저장된 부산+인천+서울+대구+부천 데이터가 없습니다.")
            return None
    except Exception as e:
        print(f"데이터 로드 오류: {e}")
        return None

def load_saved_seongnam_data():
    """저장된 성남시 데이터 로드"""
    try:
        data_dir = "collected_data"
        all_data_filename = f"{data_dir}/seongnam_all_data.json"
        
        if os.path.exists(all_data_filename):
            with open(all_data_filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            print("저장된 성남시 데이터가 없습니다.")
            return None
    except Exception as e:
        print(f"데이터 로드 오류: {e}")
        return None

def load_saved_guri_data():
    """저장된 구리시 데이터 로드"""
    try:
        data_dir = "collected_data"
        all_data_filename = f"{data_dir}/guri_all_data.json"
        
        if os.path.exists(all_data_filename):
            with open(all_data_filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            print("저장된 구리시 데이터가 없습니다.")
            return None
    except Exception as e:
        print(f"데이터 로드 오류: {e}")
        return None

app = Flask(__name__)
CORS(app)

# 데이터베이스 초기화
init_db()

# 지역 서비스 초기화
region_service = RegionService()

@app.route('/api/health', methods=['GET'])
def health_check():
    """서버 상태 확인"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/busan-data', methods=['GET'])
def get_busan_data():
    """저장된 부산 전체 구 데이터 조회"""
    try:
        data = load_saved_busan_data()
        if data:
            return jsonify({
                'status': 'success',
                'data': data,
                'message': '저장된 부산 데이터를 성공적으로 로드했습니다.'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': '저장된 부산 데이터가 없습니다. 먼저 데이터를 수집해주세요.'
            }), 404
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'데이터 로드 중 오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/api/busan-data/<region>', methods=['GET'])
def get_busan_region_data(region):
    """특정 부산 구/군 데이터 조회"""
    try:
        data = load_saved_busan_data()
        if data and region in data:
            return jsonify({
                'status': 'success',
                'region': region,
                'data': data[region],
                'transaction_count': len(data[region])
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'{region} 데이터를 찾을 수 없습니다.'
            }), 404
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'데이터 로드 중 오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/api/busan-incheon-seoul-data', methods=['GET'])
def get_busan_incheon_seoul_data():
    """저장된 부산+인천+서울 전체 구 데이터 조회"""
    try:
        data = load_saved_busan_incheon_seoul_data()
        if data:
            return jsonify({
                'status': 'success',
                'data': data,
                'message': '저장된 부산+인천+서울 데이터를 성공적으로 로드했습니다.'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': '저장된 부산+인천+서울 데이터가 없습니다. 먼저 데이터를 수집해주세요.'
            }), 404
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'데이터 로드 중 오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/api/busan-incheon-seoul-daegu-data', methods=['GET'])
def get_busan_incheon_seoul_daegu_data():
    """저장된 부산+인천+서울+대구 전체 구 데이터 조회"""
    try:
        data = load_saved_busan_incheon_seoul_daegu_data()
        if data:
            return jsonify({
                'status': 'success',
                'data': data,
                'message': '저장된 부산+인천+서울+대구 데이터를 성공적으로 로드했습니다.'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': '저장된 부산+인천+서울+대구 데이터가 없습니다. 먼저 데이터를 수집해주세요.'
            }), 404
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'데이터 로드 중 오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/api/busan-incheon-seoul-daegu-bucheon-data', methods=['GET'])
def get_busan_incheon_seoul_daegu_bucheon_data():
    """저장된 부산+인천+서울+대구+부천 전체 구 데이터 조회"""
    try:
        data = load_saved_busan_incheon_seoul_daegu_bucheon_data()
        if data:
            response_data = {
                'status': 'success',
                'data': data,
                'message': '저장된 부산+인천+서울+대구+부천 데이터를 성공적으로 로드했습니다.'
            }
            return create_gzipped_response(response_data)
        else:
            error_data = {
                'status': 'error',
                'message': '저장된 부산+인천+서울+대구+부천 데이터가 없습니다. 먼저 데이터를 수집해주세요.'
            }
            return create_gzipped_response(error_data, 404)
    except Exception as e:
        error_data = {
            'status': 'error',
            'message': f'데이터 로드 중 오류가 발생했습니다: {str(e)}'
        }
        return create_gzipped_response(error_data, 500)

@app.route('/api/seongnam-data', methods=['GET'])
def get_seongnam_data():
    """저장된 성남시 전체 구 데이터 조회"""
    try:
        data = load_saved_seongnam_data()
        if data:
            return jsonify({
                'status': 'success',
                'data': data,
                'message': '저장된 성남시 데이터를 성공적으로 로드했습니다.'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': '저장된 성남시 데이터가 없습니다. 먼저 데이터를 수집해주세요.'
            }), 404
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'데이터 로드 중 오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/api/guri-data', methods=['GET'])
def get_guri_data():
    """저장된 구리시 데이터 조회"""
    try:
        data = load_saved_guri_data()
        if data:
            return jsonify({
                'status': 'success',
                'data': data,
                'message': '저장된 구리시 데이터를 성공적으로 로드했습니다.'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': '저장된 구리시 데이터가 없습니다. 먼저 데이터를 수집해주세요.'
            }), 404
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'데이터 로드 중 오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/api/all-cities-data', methods=['GET'])
def get_all_cities_data():
    """저장된 모든 도시 데이터 조회 (부산+인천+서울+대구+부천+성남+구리)"""
    try:
        # 기존 통합 데이터 로드
        base_data = load_saved_busan_incheon_seoul_daegu_bucheon_data()
        
        # 성남시 데이터 추가
        seongnam_data = load_saved_seongnam_data()
        if seongnam_data:
            if base_data is None:
                base_data = {}
            base_data.update(seongnam_data)
        
        # 구리시 데이터 추가
        guri_data = load_saved_guri_data()
        if guri_data:
            if base_data is None:
                base_data = {}
            base_data.update(guri_data)
        
        if base_data:
            return jsonify({
                'status': 'success',
                'data': base_data,
                'message': '저장된 모든 도시 데이터를 성공적으로 로드했습니다.'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': '저장된 도시 데이터가 없습니다. 먼저 데이터를 수집해주세요.'
            }), 404
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'데이터 로드 중 오류가 발생했습니다: {str(e)}'
        }), 500

def load_saved_integrated_data():
    """저장된 통합 데이터 로드"""
    try:
        data_dir = "collected_data"
        all_data_filename = f"{data_dir}/all_cities_integrated_data.json"
        
        if os.path.exists(all_data_filename):
            with open(all_data_filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            print("저장된 통합 데이터가 없습니다.")
            return None
    except Exception as e:
        print(f"통합 데이터 로드 오류: {e}")
        return None

@app.route('/api/seoul-district-data', methods=['GET'])
def get_seoul_district_data():
    """서울시 특정 구 데이터 조회"""
    try:
        district = request.args.get('district', '')
        if not district:
            return jsonify({
                'status': 'error',
                'message': '구 이름을 지정해주세요'
            }), 400
        
        # 서울시 구 데이터 파일 경로
        file_path = os.path.join('collected_data', f'서울_{district}_data.json')
        
        if not os.path.exists(file_path):
            return jsonify({
                'status': 'error',
                'message': f'서울 {district} 데이터가 없습니다 (경로: {file_path})'
            }), 404
        
        # 데이터 로드
        with open(file_path, 'r', encoding='utf-8') as f:
            district_data = json.load(f)
        
        response_data = {
            'status': 'success',
            'data': district_data,
            'district': district,
            'transaction_count': len(district_data) if isinstance(district_data, list) else 0
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'서울 {district} 데이터 로드 중 오류가 발생했습니다: {str(e)}'
        }), 500

 

@app.route('/api/seoul-priority-data', methods=['GET'])
def get_seoul_priority_data():
    """서울시 우선 데이터 조회 (빠른 로딩용)"""
    try:
        # 서울시 우선 데이터 생성
        seoul_priority_data = create_seoul_priority_data()
        
        response_data = {
            'status': 'success',
            'data': seoul_priority_data,
            'type': 'seoul_priority',
            'metadata': {
                'collection_date': datetime.now().isoformat(),
                'total_regions': len(seoul_priority_data),
                'data_size_mb': round(len(json.dumps(seoul_priority_data, ensure_ascii=False).encode('utf-8')) / (1024 * 1024), 2),
                'description': '서울시 1개월 우선 데이터 (빠른 로딩용)'
            }
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'서울시 우선 데이터 로드 중 오류가 발생했습니다: {str(e)}'
        }), 500



def create_seoul_priority_data():
    """서울시 우선 데이터 생성 - 서울시 25개 구 데이터만 포함"""
    
    seoul_priority_data = {}
    
    # 서울시 구 목록
    seoul_districts = [
        '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
        '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
        '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
    ]
    
    # 각 서울시 구의 데이터 파일에서 데이터 로드
    for district in seoul_districts:
        file_path = os.path.join('collected_data', f'서울_{district}_data.json')
        
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    district_data = json.load(f)
                
                # 서울시 우선 데이터에 추가
                seoul_priority_data[f'서울 {district}'] = district_data
                print(f"✅ 서울 {district} 데이터 로드 완료")
                
            except Exception as e:
                print(f"❌ 서울 {district} 데이터 로드 실패: {e}")
                continue
    
    # 우선 데이터 파일로 저장 (다음번 요청 시 빠른 로딩)
    try:
        priority_path = os.path.join('collected_data', 'seoul_priority_data.json')
        with open(priority_path, 'w', encoding='utf-8') as f:
            json.dump(seoul_priority_data, f, ensure_ascii=False, indent=2)
        print(f"💾 서울시 우선 데이터 파일 저장 완료: {priority_path}")
    except Exception as e:
        print(f"❌ 서울시 우선 데이터 파일 저장 실패: {e}")
    
    return seoul_priority_data

@app.route('/api/integrated-data', methods=['GET'])
def get_integrated_data():
    """저장된 통합 데이터 조회 (메타데이터 포함)"""
    try:
        data = load_saved_integrated_data()
        if data:
            return jsonify({
                'status': 'success',
                'data': data['data'],
                'metadata': data['metadata'],
                'message': '저장된 통합 데이터를 성공적으로 로드했습니다.'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': '저장된 통합 데이터가 없습니다. 먼저 데이터를 수집해주세요.'
            }), 404
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'데이터 로드 중 오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/api/integrated-data-chunked', methods=['GET'])
def get_integrated_data_chunked():
    """청크 단위로 통합 데이터 제공 (성능 향상)"""
    try:
        chunk_size = request.args.get('chunk_size', 1000, type=int)
        page = request.args.get('page', 0, type=int)
        
        data = load_saved_integrated_data()
        if not data:
            return jsonify({'status': 'error', 'message': '데이터 없음'}), 404
        
        # 데이터를 청크로 분할
        all_items = []
        for region_data in data['data'].values():
            if isinstance(region_data, list):
                all_items.extend(region_data)
        
        start_idx = page * chunk_size
        end_idx = start_idx + chunk_size
        chunk_data = all_items[start_idx:end_idx]
        
        return jsonify({
            'status': 'success',
            'data': chunk_data,
            'pagination': {
                'page': page,
                'chunk_size': chunk_size,
                'total_items': len(all_items),
                'has_more': end_idx < len(all_items)
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/busan-summary', methods=['GET'])
def get_busan_summary():
    """부산 전체 구 데이터 요약 정보"""
    try:
        data = load_saved_busan_data()
        print(f"로드된 데이터: {type(data)}, 키: {list(data.keys()) if data else 'None'}")
        
        if data:
            summary = {
                'total_regions': len(data),
                'total_transactions': sum(len(region_data) for region_data in data.values()),
                'regions_summary': {}
            }
            
            for region, region_data in data.items():
                print(f"처리 중인 지역: {region}, 데이터 수: {len(region_data) if region_data else 0}")
                if region_data:
                    # 이미 계산된 avg_price, max_price, min_price 사용
                    prices = []
                    for item in region_data:
                        if 'avg_price' in item and item['avg_price']:
                            try:
                                price = int(item['avg_price'])
                                prices.append(price)
                            except (ValueError, TypeError):
                                continue
                    
                    print(f"  {region} 가격 데이터: {len(prices)}개, 샘플: {prices[:3] if prices else 'None'}")
                    
                    if prices:
                        avg_price = int(sum(prices) / len(prices))
                        max_price = max(prices)
                        min_price = min(prices)
                    else:
                        avg_price = 0
                        max_price = 0
                        min_price = 0
                    
                    summary['regions_summary'][region] = {
                        'transaction_count': len(region_data),
                        'avg_price': avg_price,
                        'max_price': max_price,
                        'min_price': min_price
                    }
            
            return jsonify({
                'status': 'success',
                'summary': summary
            })
        else:
            return jsonify({
                'status': 'error',
                'message': '저장된 부산 데이터가 없습니다.'
            }), 404
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'요약 정보 생성 중 오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/api/regions', methods=['GET'])
def get_regions():
    """사용 가능한 시군구 목록 (지역 서비스 기반)"""
    try:
        # 먼저 DB에서 실제 데이터가 있는 지역들을 조회
        conn = sqlite3.connect(os.environ.get('DATABASE_PATH', '/tmp/realstate.db'))
        cursor = conn.cursor()
        
        cursor.execute('SELECT DISTINCT region_name FROM transactions ORDER BY region_name')
        db_regions = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        # 지역 서비스에서 지원하는 지역 목록과 교집합
        supported_regions = region_service.get_regions_for_api()
        
        # DB에 데이터가 있으면서 지원하는 지역들을 우선 반환
        available_regions = [r for r in db_regions if region_service.is_supported_region(r)]
        
        # DB에 데이터가 없다면 지원하는 모든 지역 반환
        if not available_regions:
            available_regions = supported_regions
        
        return jsonify(available_regions)
        
    except Exception as e:
        print(f"Error in get_regions: {str(e)}")
        # 오류 시 기본 지역 반환
        return jsonify(region_service.get_default_regions())

@app.route('/api/provinces', methods=['GET'])
def get_provinces():
    """지원하는 광역시/도 목록"""
    try:
        provinces = region_service.get_supported_provinces()
        return jsonify(provinces)
    except Exception as e:
        print(f"Error in get_provinces: {str(e)}")
        return jsonify([])

@app.route('/api/provinces/<province_name>/districts', methods=['GET'])
def get_districts_by_province(province_name):
    """특정 광역시/도의 구/군 목록"""
    try:
        districts = region_service.get_districts_by_province(province_name)
        
        # 표준 형식으로 변환
        formatted_districts = []
        for district_name in districts.keys():
            formatted_name = region_service.format_region_name(province_name, district_name)
            formatted_districts.append({
                'name': formatted_name,
                'district': district_name,
                'code': districts[district_name]
            })
        
        return jsonify(formatted_districts)
    except Exception as e:
        print(f"Error in get_districts_by_province: {str(e)}")
        return jsonify([])

@app.route('/api/regions/validate', methods=['POST'])
def validate_regions():
    """요청된 지역이 지원 범위 내인지 확인"""
    try:
        data = request.get_json()
        regions = data.get('regions', [])
        
        valid, unsupported = region_service.validate_region_request(regions)
        
        return jsonify({
            'valid': valid,
            'unsupported_regions': unsupported,
            'supported_regions': [r for r in regions if region_service.is_supported_region(r)]
        })
    except Exception as e:
        print(f"Error in validate_regions: {str(e)}")
        return jsonify({'valid': False, 'error': str(e)}), 500

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """거래 데이터 조회"""
    region = request.args.get('region', '')
    start_date = request.args.get('start_date', '')
    end_date = request.args.get('end_date', '')
    
    conn = sqlite3.connect(os.environ.get('DATABASE_PATH', '/tmp/realstate.db'))
    cursor = conn.cursor()
    
    query = '''
        SELECT 
            t.date,
            t.region_name,
            t.complex_name,
            t.transaction_count,
            t.avg_price,
            t.source
        FROM transactions t
        WHERE 1=1
    '''
    params = []
    
    if region:
        query += ' AND t.region_name = ?'
        params.append(region)
    
    if start_date:
        query += ' AND t.date >= ?'
        params.append(start_date)
    
    if end_date:
        query += ' AND t.date <= ?'
        params.append(end_date)
    
    query += ' ORDER BY t.date DESC'
    
    cursor.execute(query, params)
    transactions = []
    
    for row in cursor.fetchall():
        transactions.append({
            'date': row[0],
            'region_name': row[1],
            'complex_name': row[2],
            'transaction_count': row[3],
            'avg_price': row[4],
            'source': row[5]
        })
    
    conn.close()
    return jsonify(transactions)

@app.route('/api/transactions/<region_name>', methods=['GET'])
def get_transaction_details(region_name):
    """지역별 상세 거래내역 조회"""
    try:
        # 도시별 데이터 파일에서 해당 지역의 거래내역 조회
        city_data = get_city_data_for_region(region_name)
        
        if not city_data:
            return jsonify([])
        
        transactions = []
        seen_transactions = set()  # 중복 방지를 위한 Set
        
        for transaction in city_data:
            # 중복 체크를 위한 고유 키 생성 (날짜 + 아파트명 + 가격 + 면적 + 층수)
            unique_key = f"{transaction.get('date', '')}_{transaction.get('complex_name', '')}_{transaction.get('avg_price', 0)}_{transaction.get('area', 0)}_{transaction.get('floor', 0)}"
            
            if unique_key not in seen_transactions:
                seen_transactions.add(unique_key)
                transactions.append({
                    'id': unique_key,
                    'apartment_name': transaction.get('complex_name', ''),
                    'transaction_date': transaction.get('date', ''),
                    'price': transaction.get('avg_price', 0),
                    'area': transaction.get('area', 0),
                    'floor': transaction.get('floor', 0),
                    'region_name': transaction.get('region_name', region_name),
                    'transaction_count': transaction.get('transaction_count', 1),
                    'source': transaction.get('source', 'molit_api'),
                    'latest_transaction_date': transaction.get('latest_transaction_date', transaction.get('date', ''))
                })
        
        # 최신순으로 정렬하고 최대 50건만 반환
        transactions.sort(key=lambda x: x['transaction_date'], reverse=True)
        return jsonify(transactions[:50])
        
    except Exception as e:
        print(f"거래상세내역 조회 오류: {e}")
        return jsonify({'error': str(e)}), 500

def get_city_data_for_region(region_name):
    """지역명으로 도시 데이터에서 해당 지역의 거래내역 조회"""
    try:
        # 지역명에서 도시 추출 (예: "서울 강남구" -> "seoul")
        city_mapping = {
            '서울': 'seoul',
            '부산': 'busan', 
            '인천': 'incheon',
            '대구': 'daegu',
            '광주': 'gwangju',
            '대전': 'daejeon',
            '울산': 'ulsan',
            '경기': 'gyeonggi'
        }
        
        city = None
        for key, value in city_mapping.items():
            if region_name.startswith(key):
                city = value
                break
        
        if not city:
            return []
        
        # 도시 데이터 파일 로드
        data_file = f'collected_data/{city}_all_data.json'
        
        if not os.path.exists(data_file):
            return []
        
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 해당 지역의 데이터 찾기
        if 'data' in data and region_name in data['data']:
            return data['data'][region_name]
        elif region_name in data:
            return data[region_name]
        
        return []
        
    except Exception as e:
        print(f"지역 데이터 조회 오류: {e}")
        return []

@app.route('/api/price-changes', methods=['GET'])
def get_price_changes():
    """가격변동률 데이터 조회"""
    region = request.args.get('region', '')
    period = request.args.get('period', '30')  # 기본 30일
    
    conn = sqlite3.connect(os.environ.get('DATABASE_PATH', '/tmp/realstate.db'))
    cursor = conn.cursor()
    
    query = '''
        SELECT 
            date,
            region_name,
            avg_price,
            price_change_rate
        FROM price_changes
        WHERE 1=1
    '''
    params = []
    
    if region:
        query += ' AND region_name = ?'
        params.append(region)
    
    query += ' ORDER BY date DESC LIMIT ?'
    params.append(int(period))
    
    cursor.execute(query, params)
    price_changes = []
    
    for row in cursor.fetchall():
        price_changes.append({
            'date': row[0],
            'region_name': row[1],
            'avg_price': row[2],
            'price_change_rate': row[3]
        })
    
    conn.close()
    return jsonify(price_changes)

@app.route('/api/crawl', methods=['POST'])
def start_crawling():
    """크롤링 작업 시작 (지역 서비스 범위 제한)"""
    try:
        data = request.get_json()
        sources = data.get('sources', ['reb_api'])
        regions = data.get('regions', [])
        
        # 지역 검증
        if regions:
            valid, unsupported = region_service.validate_region_request(regions)
            if not valid:
                return jsonify({
                    'status': 'error',
                    'message': f'지원하지 않는 지역이 포함되어 있습니다: {unsupported}',
                    'supported_regions': region_service.get_regions_for_api()
                }), 400
        else:
            # 기본 지역 사용
            regions = region_service.get_default_regions()
            print(f"기본 지역 사용: {regions}")
        
        all_results = {}
        
        for source in sources:
            if source == 'reb_api':
                all_results['reb_api'] = {
                    'status': 'disabled',
                    'reason': 'reb api removed'
                }
                
            elif source == 'public_data':
                # 공공데이터포털 API 사용
                public_crawler = PublicDataCrawler()
                results = public_crawler.crawl_all_regions(regions)
                all_results['public_data'] = results
                
            elif source == 'web_scraping':
                # 웹 스크래핑 사용 (선택적, CI/배포 환경에서는 selenium 미설치 가능)
                if WebScraper is None:
                    all_results['web_scraping'] = {
                        'status': 'disabled',
                        'reason': 'selenium not installed in this environment'
                    }
                else:
                    web_scraper = WebScraper()
                    try:
                        results = web_scraper.crawl_all_regions(regions)
                        all_results['web_scraping'] = results
                    finally:
                        web_scraper.close()
                    

                
            elif source == 'asil':
                # 아실 크롤링 사용 (선택적, CI/배포 환경에서는 selenium 미설치 가능)
                if AsilCrawler is None:
                    all_results['asil'] = {
                        'status': 'disabled',
                        'reason': 'selenium not installed in this environment'
                    }
                else:
                    asil_crawler = AsilCrawler()
                    try:
                        results = asil_crawler.crawl_all_regions(regions)
                        all_results['asil'] = results
                    finally:
                        asil_crawler.close()
                    
            elif source == 'molit_api':
                # 국토교통부 API 사용 (선택적, CI 환경에서는 pandas 미설치 가능)
                if MolitAPICrawler is None:
                    all_results['molit_api'] = {
                        'status': 'disabled',
                        'reason': 'pandas/numpy not installed in this environment'
                    }
                else:
                    molit_crawler = MolitAPICrawler()
                    results = molit_crawler.crawl_all_regions(regions)
                    all_results['molit_api'] = results
                
            elif source == 'molit_web':
                # 국토교통부 웹사이트 크롤링 사용 (배포 환경에서는 기본 비활성화)
                if MolitWebCrawler is None:
                    all_results['molit_web'] = {
                        'status': 'disabled',
                        'reason': 'molit web crawler dependencies are not available in this environment'
                    }
                else:
                    molit_web_crawler = MolitWebCrawler()
                    results = {}
                    for region in regions:
                        region_results = molit_web_crawler.crawl_region_data(region, months=24)
                        results[region] = region_results
                    all_results['molit_web'] = results
        
        return jsonify({
            'status': 'success',
            'message': '데이터 수집이 완료되었습니다.',
            'results': all_results
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """통계 데이터 조회"""
    region = request.args.get('region', '')
    
    conn = sqlite3.connect('realstate.db')
    cursor = conn.cursor()
    
    # 전체 거래량
    query = '''
        SELECT 
            COUNT(*) as total_transactions,
            AVG(avg_price) as avg_price,
            SUM(transaction_count) as total_count
        FROM transactions
        WHERE 1=1
    '''
    params = []
    
    if region:
        query += ' AND region_name = ?'
        params.append(region)
    
    cursor.execute(query, params)
    stats = cursor.fetchone()
    
    # 최근 30일 가격변동률
    cursor.execute('''
        SELECT AVG(price_change_rate) 
        FROM price_changes 
        WHERE date >= date('now', '-30 days')
    ''')
    price_change = cursor.fetchone()[0] or 0
    
    conn.close()
    
    return jsonify({
        'total_transactions': stats[0],
        'avg_price': stats[1],
        'total_count': stats[2],
        'price_change_30d': price_change
    })

@app.route('/api/rankings/volume', methods=['GET'])
def get_volume_rankings():
    """거래량 순위 조회"""
    try:
        conn = sqlite3.connect('realstate.db')
        cursor = conn.cursor()
        
        # 간단한 쿼리로 테스트
        cursor.execute('SELECT COUNT(*) FROM transactions')
        count = cursor.fetchone()[0]
        
        if count == 0:
            # 샘플 데이터 반환
            rankings = [
                {
                    'rank': 1,
                    'region_name': '서울 강남구',
                    'total_volume': 150,
                    'avg_price': 800000000,
                    'transaction_count': 1
                },
                {
                    'rank': 2,
                    'region_name': '서울 서초구',
                    'total_volume': 120,
                    'avg_price': 750000000,
                    'transaction_count': 1
                },
                {
                    'rank': 3,
                    'region_name': '부산 해운대구',
                    'total_volume': 100,
                    'avg_price': 500000000,
                    'transaction_count': 1
                }
            ]
        else:
            query = '''
                SELECT 
                    region_name,
                    SUM(transaction_count) as total_volume,
                    AVG(avg_price) as avg_price,
                    COUNT(*) as transaction_count
                FROM transactions
                GROUP BY region_name
                ORDER BY total_volume DESC
                LIMIT 20
            '''
            
            cursor.execute(query)
            rankings = []
            
            for i, row in enumerate(cursor.fetchall(), 1):
                rankings.append({
                    'rank': i,
                    'region_name': row[0],
                    'total_volume': row[1],
                    'avg_price': row[2],
                    'transaction_count': row[3]
                })
        
        conn.close()
        return jsonify(rankings)
        
    except Exception as e:
        print(f"Error in get_volume_rankings: {str(e)}")
        return jsonify([])

@app.route('/api/rankings/price-change', methods=['GET'])
def get_price_change_rankings():
    """가격변동률 순위 조회"""
    try:
        conn = sqlite3.connect('realstate.db')
        cursor = conn.cursor()
        
        # 간단한 쿼리로 테스트
        cursor.execute('SELECT COUNT(*) FROM price_changes')
        count = cursor.fetchone()[0]
        
        if count == 0:
            # 샘플 데이터 반환
            rankings = [
                {
                    'rank': 1,
                    'region_name': '서울 강남구',
                    'avg_change_rate': 2.5,
                    'max_price': 850000000,
                    'min_price': 750000000
                },
                {
                    'rank': 2,
                    'region_name': '서울 서초구',
                    'avg_change_rate': 2.1,
                    'max_price': 800000000,
                    'min_price': 700000000
                },
                {
                    'rank': 3,
                    'region_name': '부산 해운대구',
                    'avg_change_rate': 1.8,
                    'max_price': 550000000,
                    'min_price': 450000000
                }
            ]
        else:
            query = '''
                SELECT 
                    region_name,
                    AVG(price_change_rate) as avg_change_rate,
                    MAX(avg_price) as max_price,
                    MIN(avg_price) as min_price
                FROM price_changes
                GROUP BY region_name
                ORDER BY avg_change_rate DESC
                LIMIT 20
            '''
            
            cursor.execute(query)
            rankings = []
            
            for i, row in enumerate(cursor.fetchall(), 1):
                rankings.append({
                    'rank': i,
                    'region_name': row[0],
                    'avg_change_rate': row[1],
                    'max_price': row[2],
                    'min_price': row[3]
                })
        
        conn.close()
        return jsonify(rankings)
        
    except Exception as e:
        print(f"Error in get_price_change_rankings: {str(e)}")
        return jsonify([])

@app.route('/api/rankings/price', methods=['GET'])
def get_price_rankings():
    """평균 가격 순위 조회"""
    try:
        conn = sqlite3.connect('realstate.db')
        cursor = conn.cursor()
        
        # 간단한 쿼리로 테스트
        cursor.execute('SELECT COUNT(*) FROM transactions')
        count = cursor.fetchone()[0]
        
        if count == 0:
            # 샘플 데이터 반환
            rankings = [
                {
                    'rank': 1,
                    'region_name': '서울 강남구',
                    'avg_price': 800000000,
                    'total_volume': 150,
                    'transaction_count': 1
                },
                {
                    'rank': 2,
                    'region_name': '서울 서초구',
                    'avg_price': 750000000,
                    'total_volume': 120,
                    'transaction_count': 1
                },
                {
                    'rank': 3,
                    'region_name': '부산 해운대구',
                    'avg_price': 500000000,
                    'total_volume': 100,
                    'transaction_count': 1
                }
            ]
        else:
            query = '''
                SELECT 
                    region_name,
                    AVG(avg_price) as avg_price,
                    SUM(transaction_count) as total_volume,
                    COUNT(*) as transaction_count
                FROM transactions
                GROUP BY region_name
                ORDER BY avg_price DESC
                LIMIT 20
            '''
            
            cursor.execute(query)
            rankings = []
            
            for i, row in enumerate(cursor.fetchall(), 1):
                rankings.append({
                    'rank': i,
                    'region_name': row[0],
                    'avg_price': row[1],
                    'total_volume': row[2],
                    'transaction_count': row[3]
                })
        
        conn.close()
        return jsonify(rankings)
        
    except Exception as e:
        print(f"Error in get_price_rankings: {str(e)}")
        return jsonify([])

@app.route('/api/market-overview', methods=['GET'])
def get_market_overview():
    """시장 개요 데이터"""
    conn = sqlite3.connect('realstate.db')
    cursor = conn.cursor()
    
    # 전체 거래량
    cursor.execute('''
        SELECT SUM(transaction_count) 
        FROM transactions 
        WHERE date >= date('now', '-30 days')
    ''')
    total_volume = cursor.fetchone()[0] or 0
    
    # 평균 가격
    cursor.execute('''
        SELECT AVG(avg_price) 
        FROM transactions 
        WHERE date >= date('now', '-30 days')
    ''')
    avg_price = cursor.fetchone()[0] or 0
    
    # 가격변동률
    cursor.execute('''
        SELECT AVG(price_change_rate) 
        FROM price_changes 
        WHERE date >= date('now', '-30 days')
    ''')
    price_change = cursor.fetchone()[0] or 0
    
    # 거래량 변화율 (최근 30일 vs 이전 30일)
    cursor.execute('''
        SELECT SUM(transaction_count) 
        FROM transactions 
        WHERE date >= date('now', '-60 days') AND date < date('now', '-30 days')
    ''')
    prev_volume = cursor.fetchone()[0] or 1  # 0으로 나누기 방지
    
    # 거래량 변화율 계산
    if prev_volume > 0:
        volume_change = ((total_volume - prev_volume) / prev_volume) * 100
    else:
        volume_change = 0
    
    # 거래 활성 지역 수
    cursor.execute('''
        SELECT COUNT(DISTINCT region_name) 
        FROM transactions 
        WHERE date >= date('now', '-30 days')
    ''')
    active_regions = cursor.fetchone()[0] or 0
    
    conn.close()
    
    return jsonify({
        'total_volume': total_volume,
        'avg_price': avg_price,
        'price_change': price_change,
        'volume_change': volume_change,
        'active_regions': active_regions
    })

@app.route('/api/apartments/rankings', methods=['GET'])
def get_apartment_rankings():
    """시군구별 아파트 순위 (30위까지)"""
    try:
        region = request.args.get('region', '')
        period = int(request.args.get('period', 30))
        month = request.args.get('month', '')
        
        print(f"아파트 순위 조회: region={region}, period={period}, month={month}")
        
        conn = sqlite3.connect('realstate.db')
        cursor = conn.cursor()
        
        # 먼저 데이터가 있는지 확인
        cursor.execute('SELECT COUNT(*) FROM transactions')
        total_count = cursor.fetchone()[0]
        print(f"총 거래 데이터: {total_count}건")
        
        # 월별 필터 조건 설정
        if month:
            # 특정 월 데이터 조회
            year = month[:4]
            month_num = month[4:6]
            date_filter = f"AND strftime('%Y%m', date) = '{month}'"
        else:
            # 기간 필터 적용
            date_filter = f"AND date >= date('now', '-' || {period} || ' days')"
        
        if region:
            # 특정 시군구의 아파트 순위
            query = f'''
                SELECT 
                    complex_name,
                    AVG(avg_price) as avg_price,
                    COUNT(*) as transaction_count,
                    0 as avg_area,
                    0 as avg_floor,
                    MAX(latest_transaction_date) as latest_transaction_date
                FROM transactions
                WHERE region_name = ? 
                {date_filter}
                GROUP BY complex_name
                ORDER BY avg_price DESC
                LIMIT 30
            '''
            cursor.execute(query, (region,))
        else:
            # 전체 아파트 순위
            query = f'''
                SELECT 
                    region_name,
                    complex_name,
                    AVG(avg_price) as avg_price,
                    COUNT(*) as transaction_count,
                    0 as avg_area,
                    0 as avg_floor,
                    MAX(latest_transaction_date) as latest_transaction_date
                FROM transactions
                WHERE 1=1
                {date_filter}
                GROUP BY region_name, complex_name
                ORDER BY avg_price DESC
                LIMIT 30
            '''
            cursor.execute(query)
        
        rows = cursor.fetchall()
        print(f"조회된 아파트 데이터: {len(rows)}건")
        
        if len(rows) > 0:
            print(f"첫 번째 행: {rows[0]}")
        
        rankings = []
        for i, row in enumerate(rows, 1):
            try:
                if region:
                    rankings.append({
                        'rank': i,
                        'complex_name': row[0],
                        'avg_price': row[1],
                        'transaction_count': row[2],
                        'avg_area': row[3],
                        'avg_floor': row[4],
                        'latest_transaction_date': row[5]
                    })
                else:
                    rankings.append({
                        'rank': i,
                        'region_name': row[0],
                        'complex_name': row[1],
                        'avg_price': row[2],
                        'transaction_count': row[3],
                        'avg_area': row[4],
                        'avg_floor': row[5],
                        'latest_transaction_date': row[6]
                    })
            except Exception as e:
                print(f"행 처리 오류 (행 {i}): {str(e)}, 데이터: {row}")
        
        conn.close()
        print(f"반환할 순위 데이터: {len(rankings)}건")
        return jsonify(rankings)
        
    except Exception as e:
        print(f"Error in get_apartment_rankings: {str(e)}")
        return jsonify([])

# 새로운 최적화된 API 엔드포인트들 추가
@app.route('/api/metadata', methods=['GET'])
def get_metadata():
    """지역 목록과 메타데이터 조회 - 새로운 최적화된 API"""
    try:
        metadata = {
            'cities': [
                {'code': 'seoul', 'name': '서울시', 'districts': 25, 'file': 'seoul_priority_data.json'},
                {'code': 'busan', 'name': '부산시', 'districts': 16, 'file': 'busan_all_data.json'},
                {'code': 'incheon', 'name': '인천시', 'districts': 10, 'file': 'incheon_all_data.json'},
                {'code': 'daegu', 'name': '대구시', 'districts': 8, 'file': 'daegu_all_data.json'},
                {'code': 'daejeon', 'name': '대전시', 'districts': 5, 'file': 'daejeon_all_data.json'},
                {'code': 'gwangju', 'name': '광주시', 'districts': 5, 'file': 'gwangju_all_data.json'},
                {'code': 'ulsan', 'name': '울산시', 'districts': 5, 'file': 'ulsan_all_data.json'}
            ],
            'last_updated': datetime.now().isoformat(),
            'total_regions': 74,
            'data_size': 'optimized',
            'version': '2.0'
        }
        return jsonify({
            'status': 'success',
            'data': metadata,
            'message': '메타데이터를 성공적으로 조회했습니다.'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'메타데이터 조회 실패: {str(e)}'
        }), 500

def find_city_data_file(city_code):
    """도시 코드에 해당하는 데이터 파일을 동적으로 찾기"""
    import glob
    
    # 도시 코드를 한글명으로 매핑 (확장 가능)
    city_mapping = {
        'seoul': '서울',
        'busan': '부산',
        'incheon': '인천',
        'daegu': '대구',
        'daejeon': '대전',
        'gwangju': '광주',
        'ulsan': '울산',
        'bucheon': '부천',
        'seongnam': '성남',
        'guri': '구리',
        'anyang': '안양',
        'suwon': '수원',
        'yongin': '용인',
        'goyang': '고양',
        'sejong': '세종'
    }
    
    city_name = city_mapping.get(city_code)
    if not city_name:
        return None
    
    # 패턴으로 파일 검색 (우선순위 순)
    patterns = [
        f"{city_code}_priority_data.json",
        f"{city_code}_all_data.json",
        f"{city_code}_all_data_*.json",
        f"{city_name}_all_data.json",
        f"{city_name}_all_data_*.json"
    ]
    
    for pattern in patterns:
        files = glob.glob(os.path.join('collected_data', pattern))
        if files:
            # 가장 최신 파일 선택
            latest_file = max(files, key=os.path.getmtime)
            return latest_file
    
    return None

def get_city_data(city_code):
    """특정 도시의 전체 데이터 조회 - 동적 파일 검색 방식"""
    print(f"🚀 get_city_data 호출됨: {city_code}")
    try:
        # 동적으로 파일 찾기
        filepath = find_city_data_file(city_code)
        
        if filepath and os.path.exists(filepath):
            print(f"개별 파일 로드: {filepath}")
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            # 개별 파일이 없는 경우 통합 파일에서 추출
            print(f"개별 파일 없음, 통합 파일에서 추출: {city_code}")
            data = extract_city_from_integrated_data(city_code)
            if not data:
                print(f"통합 파일에서도 {city_code} 데이터를 찾을 수 없음")
                return jsonify({
                    'status': 'error',
                    'message': f'{city_code} 데이터를 찾을 수 없습니다. 데이터 파일이 존재하지 않거나 도시 코드가 지원되지 않습니다.'
                }), 404
            
        return create_gzipped_response({
            'status': 'success',
            'data': data,
            'city': city_code,
            'message': f'{city_code} 데이터를 성공적으로 로드했습니다.'
        })
        
    except Exception as e:
        print(f"get_city_data 오류: {e}")
        return jsonify({
            'status': 'error',
            'message': f'데이터 로드 중 오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/api/cities/<city_code>', methods=['GET'])
def get_city_data_endpoint(city_code):
    """도시 데이터 조회 API 엔드포인트"""
    return get_city_data(city_code)

@app.route('/api/districts/<city_code>/<district_name>', methods=['GET'])
def get_district_data(city_code, district_name):
    """특정 구/군의 상세 데이터 조회 - 새로운 최적화된 API"""
    try:
        # URL 디코딩
        district_name = urllib.parse.unquote(district_name)
        
        # 파일명 생성 (기존 파일 구조 활용)
        filename = f"{city_code}_{district_name}_data.json"
        filepath = os.path.join('collected_data', filename)
        
        if not os.path.exists(filepath):
            return jsonify({
                'status': 'error',
                'message': f'{district_name} 데이터 파일이 없습니다.'
            }), 404
            
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        return create_gzipped_response({
            'status': 'success',
            'data': data,
            'city': city_code,
            'district': district_name,
            'message': f'{district_name} 데이터를 성공적으로 로드했습니다.'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'구/군 데이터 로드 실패: {str(e)}'
        }), 500

@app.route('/api/regions/summary', methods=['GET'])
def get_regions_summary():
    """지역별 요약 정보 조회 - 빠른 로딩용"""
    try:
        summary = {
            'seoul': {
                'name': '서울시',
                'districts': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
                'total_transactions': 0,
                'avg_price': 0
            },
            'busan': {
                'name': '부산시',
                'districts': ['강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
                'total_transactions': 0,
                'avg_price': 0
            },
            'incheon': {
                'name': '인천시',
                'districts': ['강화군', '계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '옹진군', '중구'],
                'total_transactions': 0,
                'avg_price': 0
            }
        }
        
        return jsonify({
            'status': 'success',
            'data': summary,
            'message': '지역 요약 정보를 성공적으로 조회했습니다.'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'지역 요약 조회 실패: {str(e)}'
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(debug=False, host='0.0.0.0', port=port) 