#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Local imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from crawlers.molit_api_crawler import MolitAPICrawler
from database.models import save_transaction_data
from services.region_service import RegionService

SUWON_GU = [
    '경기 수원시 장안구',
    '경기 수원시 권선구',
    '경기 수원시 팔달구',
    '경기 수원시 영통구',
]

ANYANG_GU = [
    '경기 안양시 만안구',
    '경기 안양시 동안구',
]

def collect_one(region_name: str, months: int = 24):
    crawler = MolitAPICrawler()
    data = crawler.crawl_region_data(region_name, months=months)
    if data:
        save_transaction_data(data)
    return region_name, len(data or [])

if __name__ == '__main__':
    targets = []
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg == 'suwon':
            targets = SUWON_GU
        elif arg == 'anyang':
            targets = ANYANG_GU
        elif arg == 'both':
            targets = SUWON_GU + ANYANG_GU
        else:
            targets = [arg]
    else:
        targets = SUWON_GU + ANYANG_GU

    print(f"구 단위 병렬 수집 시작: {len(targets)}개 지역, 24개월")
    started = time.time()
    results = []
    with ThreadPoolExecutor(max_workers=min(6, len(targets))) as ex:
        futures = {ex.submit(collect_one, r, 24): r for r in targets}
        for fut in as_completed(futures):
            region = futures[fut]
            try:
                rgn, count = fut.result()
                print(f"✅ {rgn}: {count}건 저장")
                results.append((rgn, count))
            except Exception as e:
                print(f"❌ {region}: {e}")
                results.append((region, 0))

    took = time.time() - started
    total = sum(c for _, c in results)
    print(f"완료: {len(results)}개 지역, 총 {total}건, 소요 {took:.1f}s")
