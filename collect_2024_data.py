#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import argparse
from datetime import datetime

from crawlers.molit_api_crawler import MolitAPICrawler
from services.region_service import RegionService


def ensure_dir(path: str):
    if not os.path.exists(path):
        os.makedirs(path)


def collect_year_for_region(crawler: MolitAPICrawler, region_name: str, year: int):
    region_code = crawler.get_region_code(region_name)
    if not region_code:
        print(f"[SKIP] 지역코드를 찾을 수 없습니다: {region_name}")
        return []

    all_rows = []
    for month in range(1, 13):
        deal_ym = f"{year}{month:02d}"
        rows = crawler.get_apartment_data(region_code, deal_ym, page_no=1, num_of_rows=100)
        if isinstance(rows, list):
            all_rows.extend(rows)
        # 추가 페이지 처리 (간단 루프)
        page_no = 2
        while True:
            more = crawler.get_apartment_data(region_code, deal_ym, page_no=page_no, num_of_rows=100)
            if not isinstance(more, list) or len(more) == 0:
                break
            all_rows.extend(more)
            if len(more) < 100:
                break
            page_no += 1
    return all_rows


def main():
    parser = argparse.ArgumentParser(description='Collect 2024 apartment trade data via MOLIT API')
    parser.add_argument('--year', type=int, default=2024, help='target year (default: 2024)')
    parser.add_argument('--regions', type=str, default='', help='comma separated region names (ex: "서울 강남구,부산 해운대구")')
    parser.add_argument('--all', action='store_true', help='collect for all supported regions')
    args = parser.parse_args()

    year = args.year
    crawler = MolitAPICrawler()
    region_service = RegionService()

    if args.all:
        regions = region_service.get_regions_for_api()
    elif args.regions.strip():
        regions = [r.strip() for r in args.regions.split(',') if r.strip()]
    else:
        # 빠른 테스트를 위한 기본 샘플
        regions = ['서울 강남구', '부산 해운대구', '인천 연수구', '대구 수성구', '경기 수원시']

    print(f"수집 대상 연도: {year}, 지역 수: {len(regions)}")

    out_dir = 'collected_data'
    ensure_dir(out_dir)

    integrated = {}
    total_rows = 0

    for region in regions:
        print(f"\n=== {region} {year}년 데이터 수집 시작 ===")
        rows = collect_year_for_region(crawler, region, year)
        integrated[region] = rows
        total_rows += len(rows)

        safe_region = region.replace(' ', '_')
        out_path = os.path.join(out_dir, f"{safe_region}_{year}.json")
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)
        print(f"{region} 저장 완료: {out_path} ({len(rows)}건)")

    # 통합 저장
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    integrated_path = os.path.join(out_dir, f'integrated_{year}_all_data_{ts}.json')
    with open(integrated_path, 'w', encoding='utf-8') as f:
        json.dump(integrated, f, ensure_ascii=False, indent=2)
    print(f"통합 저장 완료: {integrated_path} (총 {total_rows}건)")

    # 요약 저장
    summary = {
        'collection_year': year,
        'collection_time': datetime.now().isoformat(),
        'regions': regions,
        'total_transactions': total_rows,
    }
    summary_path = os.path.join(out_dir, f'summary_{year}_{ts}.json')
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"요약 저장 완료: {summary_path}")


if __name__ == '__main__':
    main()


