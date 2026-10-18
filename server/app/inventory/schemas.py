from marshmallow import Schema, fields, validate, validates_schema, ValidationError, EXCLUDE
from datetime import datetime


# ── Output schema for a single image ──
class CarImageSchema(Schema):
    id = fields.Int(dump_only=True)
    url = fields.Str(dump_only=True)          # now a relative path, not necessarily a URL
    is_primary = fields.Bool(dump_only=True)


# ── INPUT schema (used with car_schema.load on request.form) ──
class CarCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    make = fields.Str(required=True, validate=validate.Length(max=50))
    model = fields.Str(required=True, validate=validate.Length(max=50))
    year = fields.Int(required=True)
    price = fields.Decimal(required=True, as_string=False)
    currency = fields.Str(load_default="KES", validate=validate.Length(equal=3))
    mileage = fields.Int(allow_none=True, validate=validate.Range(min=0))
    condition = fields.Str(
        required=True, validate=validate.OneOf(["New", "Used", "Certified Pre-Owned"])
    )
    fuel_type = fields.Str(
        required=True,
        validate=validate.OneOf(["Petrol", "Diesel", "Electric", "Hybrid"]),
    )
    transmission = fields.Str(
        required=True, validate=validate.OneOf(["Manual", "Automatic", "CVT"])
    )
    color = fields.Str(allow_none=True, validate=validate.Length(max=30))
    description = fields.Str(allow_none=True, validate=validate.Length(max=2000))
    location = fields.Str(required=True, validate=validate.Length(max=100))
    is_negotiable = fields.Bool(load_default=False)

    # NO images field here — files are handled by the route

    @validates_schema
    def validate_year(self, data, **kwargs):
        if "year" in data:
            max_year = datetime.utcnow().year + 1
            if not (1900 <= data["year"] <= max_year):
                raise ValidationError(
                    {"year": [f"Year must be between 1900 and {max_year}"]}
                )


# ── OUTPUT schema (used for jsonify(car.to_dict())) ──
class CarSchema(Schema):
    id = fields.Int()
    make = fields.Str()
    model = fields.Str()
    year = fields.Int()
    price = fields.Decimal(as_string=False)
    currency = fields.Str()
    mileage = fields.Int(allow_none=True)
    condition = fields.Str()
    fuel_type = fields.Str()
    transmission = fields.Str()
    color = fields.Str(allow_none=True)
    description = fields.Str(allow_none=True)
    location = fields.Str()
    is_negotiable = fields.Bool()
    is_available = fields.Bool()
    is_sold = fields.Bool()
    views = fields.Int()
    seller_id = fields.Int()
    created_at = fields.DateTime()
    images = fields.List(fields.Nested(CarImageSchema))


# ── Update schema: same as create but everything optional ──
class CarUpdateSchema(CarCreateSchema):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.required = False


class CarAvailabilityUpdateSchema(Schema):
    is_sold = fields.Bool(load_default=None)
    is_available = fields.Bool(load_default=None)