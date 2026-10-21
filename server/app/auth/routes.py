from flask import Blueprint, request, jsonify
from .schemas import RegisterSchema, LoginSchema, GoogleAuthSchema
from .services import register_user, authenticate, google_auth_user, issue_token
from ..accounts.schemas import UserSchema
from ..common.decorators import login_required

auth_bp = Blueprint("auth", __name__)

register_schema = RegisterSchema()
login_schema = LoginSchema()
google_auth_schema = GoogleAuthSchema()
user_schema = UserSchema()


@auth_bp.post("/register")
def register():
    data = register_schema.load(request.get_json() or {})
    user = register_user(data)
    token = issue_token(user)
    return jsonify(user=user_schema.dump(user), token=token), 201


@auth_bp.post("/login")
def login():
    data = login_schema.load(request.get_json() or {})
    user = authenticate(data["email"], data["password"])
    token = issue_token(user)
    return jsonify(user=user_schema.dump(user), token=token)


@auth_bp.post("/google")
@auth_bp.post("/auth/google")
def google_auth():
    data = google_auth_schema.load(request.get_json() or {})
    user = google_auth_user(data)
    token = issue_token(user)
    return jsonify(user=user_schema.dump(user), token=token)


@auth_bp.post("/logout")
@login_required
def logout():
    # JWT is stateless. If you add a blacklist store, revoke here.
    return jsonify(message="Logged out successfully")


@auth_bp.post("/forgot-password")
def forgot_password():
    # Stub — integrate email sending + token table
    return jsonify(message="If the email exists, a reset link has been sent.")


@auth_bp.post("/reset-password")
def reset_password():
    # Stub — verify token, update password
    return jsonify(message="Password reset stub")