from flask import Response, request
import json
import os
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
    
    return Response(json.dumps(response_data, ensure_ascii=False), mimetype='application/json')


