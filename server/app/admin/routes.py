from flask import Blueprint, jsonify, request
from .services import dashboard_stats, popular_cars, all_enquiries, all_test_drives
from ..common.decorators import role_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/admin/analytics")
@role_required("admin")
def analytics():
    return jsonify(dashboard_stats())


@admin_bp.get("/admin/cars/popular")
@role_required("admin")
def popular():
    return jsonify(popular_cars())


@admin_bp.get("/admin/enquiries")
@role_required("admin")
def enquiries():
    page = request.args.get('page', default=1, type=int)
    limit = request.args.get('limit', default=20, type=int)
    
    data = all_enquiries(page=page, limit=limit)
    
    return jsonify(data)
    
    
@admin_bp.get("/admin/test-drives")
@role_required("admin")
def test_drives():
    page = request.args.get('page', default=1, type=int)
    limit = request.args.get('limit', default=20, type=int)

    data = all_test_drives(page=page, limit=limit)
    
    return jsonify(data)