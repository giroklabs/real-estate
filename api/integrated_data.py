from flask import Response, request
import json
import os
import gzip
from datetime import datetime

def handler(request):
    # 요약 데이터 요청인지 확인
    data_type = request.args.get('type', 'full')
    
    if data_type == 'summary':
        # 요약 데이터만 반환 (빠름)
        path = os.path.join('collected_data', 'integrated_summary_20250811_174025.json')
        if not os.path.exists(path):
            return Response(json.dumps({'error': 'summary_not_found'}), status=404, mimetype='application/json')
        
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        response_data = {
            'status': 'success',
            'data': data,
            'type': 'summary',
            'timestamp': datetime.now().isoformat()
        }
        
    else:
        # 전체 데이터
        path = os.path.join('collected_data', 'all_cities_integrated_data.json')
        if not os.path.exists(path):
            return Response(json.dumps({'error': 'not_found'}), status=404, mimetype='application/json')
        
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        response_data = {
            'status': 'success',
            'data': data,
            'type': 'full',
            'metadata': {
                'collection_date': '2025-08-11 17:40:25',
                'total_cities': len(data),
                'data_size_mb': round(os.path.getsize(path) / (1024 * 1024), 2)
            }
        }
    
    # Gzip 압축 응답 (데이터 크기 대폭 감소)
    json_data = json.dumps(response_data, ensure_ascii=False)
    original_size = len(json_data.encode('utf-8'))
    gzip_data = gzip.compress(json_data.encode('utf-8'))
    compressed_size = len(gzip_data)
    compression_ratio = (1 - compressed_size / original_size) * 100
    
    print(f"📊 Gzip 압축 효과: {original_size / 1024 / 1024:.2f}MB → {compressed_size / 1024 / 1024:.2f}MB ({compression_ratio:.1f}% 압축)")
    
    response = Response(gzip_data, mimetype='application/json')
    response.headers['Content-Encoding'] = 'gzip'
    response.headers['Content-Length'] = len(gzip_data)
    response.headers['Vary'] = 'Accept-Encoding'
    
    return response


