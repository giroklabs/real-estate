from flask import Response
import json
from services.region_service import RegionService

def handler(request):
    provinces = RegionService().get_supported_provinces()
    return Response(json.dumps(provinces, ensure_ascii=False), mimetype="application/json")


