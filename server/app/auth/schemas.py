from marshmallow import Schema, fields, validate, validates, ValidationError
from ..common.validators import (
    is_valid_phone,
    is_strong_password,
)


class RegisterSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True)
    phone = fields.Str(allow_none=True)
    password = fields.Str(required=True, load_only=True)

    @validates("phone")
    def validate_phone(self, value, **kwargs):
        if value and not is_valid_phone(value):
            raise ValidationError("Invalid phone number format")

    @validates("password")
    def validate_password(self, value, **kwargs):
        if not is_strong_password(value):
            raise ValidationError(
                "Password must be at least 8 chars, include a number and a special character"
            )


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)


class GoogleAuthSchema(Schema):
    credential = fields.Str(allow_none=True)
    email = fields.Email(allow_none=True)
    name = fields.Str(allow_none=True)
    google_id = fields.Str(allow_none=True)
    phone = fields.Str(allow_none=True)