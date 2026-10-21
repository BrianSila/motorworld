from flask_jwt_extended import create_access_token
from ..accounts.models import User
from ..extensions import db
from ..common.errors import ConflictError, UnauthorizedError


def register_user(data: dict) -> User:
    if User.query.filter_by(email=data["email"].lower()).first():
        raise ConflictError("Email already registered")
    user = User(
        name=data["name"],
        email=data["email"].lower(),
        phone=data.get("phone"),
        role="user",
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return user


def authenticate(email: str, password: str) -> User:
    user = User.query.filter_by(email=email.lower()).first()
    if not user or not user.check_password(password):
        raise UnauthorizedError("Invalid credentials")
    if user.is_blocked:
        raise UnauthorizedError("Account blocked")
    return user


def google_auth_user(data: dict) -> User:
    import secrets
    import requests
    import jwt

    email = None
    name = None

    credential = data.get("credential")
    if credential:
        try:
            resp = requests.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": credential},
                timeout=5,
            )
            if resp.status_code == 200:
                payload = resp.json()
                email = payload.get("email")
                name = payload.get("name") or payload.get("given_name")
            else:
                decoded = jwt.decode(credential, options={"verify_signature": False})
                email = decoded.get("email")
                name = decoded.get("name") or decoded.get("given_name")
        except Exception:
            try:
                decoded = jwt.decode(credential, options={"verify_signature": False})
                email = decoded.get("email")
                name = decoded.get("name") or decoded.get("given_name")
            except Exception:
                pass

    if not email and data.get("email"):
        email = data.get("email")
        name = data.get("name") or email.split("@")[0]

    if not email:
        raise UnauthorizedError("Valid Google account information is required")

    email = email.strip().lower()
    user = User.query.filter_by(email=email).first()

    if user:
        if user.is_blocked:
            raise UnauthorizedError("Account blocked")
        if name and (not user.name or user.name == "Google User"):
            user.name = name
            db.session.commit()
        return user

    display_name = name.strip() if name and name.strip() else email.split("@")[0].capitalize()
    random_password = secrets.token_urlsafe(32) + "!A1"

    new_user = User(
        name=display_name,
        email=email,
        phone=data.get("phone"),
        role="user",
    )
    new_user.set_password(random_password)
    db.session.add(new_user)
    db.session.commit()
    return new_user


def issue_token(user: User) -> str:
    return create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "email": user.email},
    )