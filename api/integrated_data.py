from flask import Response
import json
import os

def handler(request):
    path = os.path.join('collected_data', 'all_cities_integrated_data.json')
    if not os.path.exists(path):
        return Response(json.dumps({ 'error': 'not_found' }), status=404, mimetype='application/json')
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return Response(json.dumps(data, ensure_ascii=False), mimetype='application/json')


