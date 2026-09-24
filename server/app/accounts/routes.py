from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from .schemas import UserSchema, ProfileUpdateSchema, RoleUpdateSchema
from .services import update_profile, change_role, list_users, get_user_or_404, get_user_details
from ..common.decorators import login_required, role_required
from ..common.errors import ForbiddenError
from ..common.pagination import paginate

accounts_bp = Blueprint("accounts", __name__)

user_schema = UserSchema()
profile_update_schema = ProfileUpdateSchema()
role_update_schema = RoleUpdateSchema()


@accounts_bp.get("/profile")
@login_required
def get_profile():
    user = get_user_or_404(int(get_jwt_identity()))
    return jsonify(user=user_schema.dump(user))


@accounts_bp.put("/profile")
@login_required
def put_profile():
    user = get_user_or_404(int(get_jwt_identity()))
    data = profile_update_schema.load(request.get_json() or {})
    update_profile(user, data)
    return jsonify(user=user_schema.dump(user))


@accounts_bp.get("/admin/users")
@role_required("admin")
def admin_list_users():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    result = list_users(page=page, limit=limit)
    return jsonify(
        total=result.total,
        page=result.page,
        pages=result.pages,
        users=[user_schema.dump(u) for u in result.items],
    )


@accounts_bp.put("/admin/users/<int:user_id>/role")
@role_required("admin")
def admin_change_role(user_id):
    actor = get_user_or_404(int(get_jwt_identity()))
    data = role_update_schema.load(request.get_json() or {})
    target = change_role(actor, user_id, data["role"])
    return jsonify(user=user_schema.dump(target))


@accounts_bp.get("/admin/users/<int:user_id>")
@role_required("admin")
def admin_get_user(user_id):
    actor = get_user_or_404(int(get_jwt_identity()))
    details = get_user_details(actor, user_id)

    return jsonify(details), 200