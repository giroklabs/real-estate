#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GitHub Actions용 데이터 수집 스크립트
매일 자동으로 서울시, 인천시, 부산시의 부동산 거래 데이터를 수집
"""

import os
import sys
import logging
import json
import time
from datetime import datetime
from pathlib import Path

# 프로젝트 루트 디렉토리를 Python 경로에 추가
project_root = Path(__file__).parent
sys.path.append(str(project_root))

from crawlers.molit_api_crawler import MolitAPICrawler

def setup_logging():
    """로깅 설정"""
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    log_file = os.path.join(log_dir, f"github_actions_{datetime.now().strftime('%Y%m%d')}.log")
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, encoding='utf-8'),
            logging.StreamHandler()
        ]
    )
    
    return logging.getLogger(__name__)

def collect_data():
    """데이터 수집 메인 함수"""
    logger = logging.getLogger(__name__)
    
    try:
        logger.info("=== GitHub Actions 데이터 수집 시작 ===")
        start_time = datetime.now()
        
        # Molit API 크롤러 초기화
        crawler = MolitAPICrawler()
        
        # 데이터 저장 디렉토리
        data_dir = "collected_data"
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
        
        # 수집할 지역들 정의 (서울, 부산, 인천, 대구, 대전, 광주, 울산, 경기도 주요 도시)
        regions_to_collect = {
            'seoul': [
                '서울 강남구', '서울 강동구', '서울 강북구', '서울 강서구', '서울 관악구',
                '서울 광진구', '서울 구로구', '서울 금천구', '서울 노원구', '서울 도봉구',
                '서울 동대문구', '서울 동작구', '서울 마포구', '서울 서대문구', '서울 서초구',
                '서울 성동구', '서울 성북구', '서울 송파구', '서울 양천구', '서울 영등포구',
                '서울 용산구', '서울 은평구', '서울 종로구', '서울 중구', '서울 중랑구'
            ],
            'busan': [
                '부산 강서구', '부산 금정구', '부산 기장군', '부산 남구', '부산 동구',
                '부산 동래구', '부산 부산진구', '부산 북구', '부산 사상구', '부산 사하구',
                '부산 서구', '부산 수영구', '부산 연제구', '부산 영도구', '부산 중구',
                '부산 해운대구'
            ],
            'incheon': [
                '인천 강화군', '인천 계양구', '인천 남동구', '인천 동구', '인천 미추홀구',
                '인천 부평구', '인천 서구', '인천 연수구', '인천 옹진군', '인천 중구'
            ],
            'daegu': [
                '대구 남구', '대구 달서구', '대구 달성군', '대구 동구', '대구 북구',
                '대구 서구', '대구 수성구', '대구 중구', '대구 군위군'
            ],
            'daejeon': [
                '대전 대덕구', '대전 동구', '대전 서구', '대전 유성구', '대전 중구'
            ],
            'gwangju': [
                '광주 광산구', '광주 남구', '광주 동구', '광주 서구', '광주 북구'
            ],
            'ulsan': [
                '울산 남구', '울산 동구', '울산 북구', '울산 울주군', '울산 중구'
            ],
            'gyeonggi': [
                '경기 부천시', '경기 성남시', '경기 구리시'
            ]
        }
        
        all_data = {}
        total_data = 0
        success_count = 0
        error_count = 0
        
        # 각 도시별로 데이터 수집
        for city, city_regions in regions_to_collect.items():
            logger.info(f"\n=== {city.upper()} 데이터 수집 시작 ===")
            
            for region in city_regions:
                try:
                    logger.info(f"{region} 데이터 수집 중...")
                    
                    # 최근 2개월 데이터 수집 (months=8)
                    data = crawler.crawl_region_data(region, months=8)
                    
                    if data and len(data) > 0:
                        all_data[region] = data
                        total_data += len(data)
                        success_count += 1
                        
                        # 개별 지역 데이터 파일로 저장
                        filename = f"{region.replace(' ', '_')}_data.json"
                        filepath = os.path.join(data_dir, filename)
                        
                        with open(filepath, 'w', encoding='utf-8') as f:
                            json.dump(data, f, ensure_ascii=False, indent=2)
                        
                        logger.info(f"{region} 데이터 수집 완료: {len(data)}건")
                        logger.info(f"파일 저장 완료: {filepath}")
                        
                    else:
                        logger.warning(f"{region} 데이터 수집 실패 또는 데이터 없음")
                        all_data[region] = []
                        error_count += 1
                        
                except Exception as e:
                    logger.error(f"{region} 데이터 수집 중 오류 발생: {e}")
                    all_data[region] = []
                    error_count += 1
                
                # API 호출 간격 조절 (1초)
                time.sleep(1)
        
        # 전체 데이터를 하나의 파일로 저장 (모든 도시 통합)
        all_data_filepath = os.path.join(data_dir, 'all_cities_integrated_data.json')
        with open(all_data_filepath, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2)
        
        # 수집 요약 정보 저장
        summary = {
            'collection_date': datetime.now().isoformat(),
            'collection_source': 'GitHub Actions',
            'total_regions': len([r for regions in regions_to_collect.values() for r in regions]),
            'total_transactions': total_data,
            'success_count': success_count,
            'error_count': error_count,
            'regions_summary': {}
        }
        
        # 각 지역별 요약 정보
        for region, data in all_data.items():
            summary['regions_summary'][region] = {
                'transaction_count': len(data),
                'last_updated': datetime.now().isoformat()
            }
        
        summary_filepath = os.path.join(data_dir, 'collection_summary.json')
        with open(summary_filepath, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        end_time = datetime.now()
        duration = end_time - start_time
        
        logger.info(f"\n=== GitHub Actions 데이터 수집 완료 ===")
        logger.info(f"총 지역 수: {summary['total_regions']}")
        logger.info(f"총 거래 건수: {total_data:,}건")
        logger.info(f"성공: {success_count}개 지역")
        logger.info(f"실패: {error_count}개 지역")
        logger.info(f"소요 시간: {duration}")
        logger.info(f"전체 데이터 파일: {all_data_filepath}")
        logger.info(f"요약 파일: {summary_filepath}")
        
        return True
        
    except Exception as e:
        logger.error(f"GitHub Actions 데이터 수집 중 치명적 오류 발생: {e}")
        return False

if __name__ == "__main__":
    # 로깅 설정
    logger = setup_logging()
    
    try:
        success = collect_data()
        if success:
            logger.info("데이터 수집이 성공적으로 완료되었습니다.")
            sys.exit(0)
        else:
            logger.error("데이터 수집에 실패했습니다.")
            sys.exit(1)
    except Exception as e:
        logger.error(f"프로그램 실행 중 오류 발생: {e}")
        sys.exit(1)
