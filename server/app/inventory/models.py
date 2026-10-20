from datetime import datetime
from sqlalchemy import CheckConstraint, Index
from ..extensions import db


class Car(db.Model):
    __tablename__ = "cars"

    id = db.Column(db.Integer, primary_key=True)
    make = db.Column(db.String(50), nullable=False, index=True)
    model = db.Column(db.String(50), nullable=False, index=True)
    year = db.Column(db.Integer, nullable=False, index=True)
    price = db.Column(db.Numeric(12, 2), nullable=False, index=True)
    currency = db.Column(db.String(3), default="KES", nullable=False)
    mileage = db.Column(db.Integer, nullable=True)
    condition = db.Column(db.String(30), nullable=False)
    fuel_type = db.Column(db.String(20), nullable=False)
    transmission = db.Column(db.String(20), nullable=False)
    color = db.Column(db.String(30), nullable=True)
    description = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(100), nullable=False, index=True)
    is_negotiable = db.Column(db.Boolean, default=False, nullable=False)
    is_available = db.Column(db.Boolean, default=True, nullable=False, index=True)
    is_sold = db.Column(db.Boolean, default=False, nullable=False)
    views = db.Column(db.Integer, default=0, nullable=False)
    seller_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    contact_phone = db.Column(db.String(30), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    seller = db.relationship("User", back_populates="cars")
    images = db.relationship(
        "CarImage", back_populates="car", cascade="all, delete-orphan", lazy="joined"
    )
    enquiries = db.relationship(
        "Enquiry", back_populates="car", cascade="all, delete-orphan"
    )
    test_drives = db.relationship(
        "TestDrive", back_populates="car", cascade="all, delete-orphan"
    )
    favourites = db.relationship(
        "Favourite", back_populates="car", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "NOT (is_available = true AND is_sold = true)",
            name="ck_car_not_available_and_sold",
        ),
        Index("ix_cars_make_model_year", "make", "model", "year"),
        Index("ix_cars_price_available", "price", "is_available"),
        Index("ix_cars_location_available", "location", "is_available"),
    )

    def to_dict(self, include_images=True):
        from flask import current_app

        admin_phone = "+254 740 892 332"
        try:
            admin_phone = current_app.config.get("ADMIN_CONTACT_PHONE", "+254 740 892 332")
        except Exception:
            pass

        data = {
            "id": self.id,
            "make": self.make,
            "model": self.model,
            "year": self.year,
            "price": float(self.price),
            "currency": self.currency,
            "mileage": self.mileage,
            "condition": self.condition,
            "fuel_type": self.fuel_type,
            "transmission": self.transmission,
            "color": self.color,
            "description": self.description,
            "location": self.location,
            "contact_phone": self.contact_phone,
            "is_negotiable": self.is_negotiable,
            "is_available": self.is_available,
            "is_sold": self.is_sold,
            "views": self.views,
            "seller_id": self.seller_id,
            "seller": (
                {
                    "id": self.seller.id,
                    "name": self.seller.name,
                    "phone": self.seller.phone,
                    "role": self.seller.role,
                }
                if self.seller
                else None
            ),
            "admin_phone": admin_phone,
            "created_at": self.created_at.isoformat(),
        }
        if include_images:
            data["images"] = [img.to_dict() for img in self.images]
        return data


class CarImage(db.Model):
    __tablename__ = "car_images"

    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(500), nullable=False)
    is_primary = db.Column(db.Boolean, default=False, nullable=False)
    car_id = db.Column(
        db.Integer, db.ForeignKey("cars.id", ondelete="CASCADE"), nullable=False
    )

    car = db.relationship("Car", back_populates="images")

    def to_dict(self):
        return {"id": self.id, "url": self.url, "is_primary": self.is_primary}