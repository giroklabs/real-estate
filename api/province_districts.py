from flask import Response
import json
from services.region_service import RegionService

def handler(request):
    name = request.args.get('name') or request.path_params.get('name') if hasattr(request, 'path_params') else None
    if not name:
        return Response(json.dumps([]), mimetype="application/json")
    districts = RegionService().get_districts_by_province(name)
    formatted = []
    for district, code in districts.items():
        formatted.append({
            'name': RegionService().format_region_name(name, district),
            'district': district,
            'code': code
        })
    return Response(json.dumps(formatted, ensure_ascii=False), mimetype="application/json")


