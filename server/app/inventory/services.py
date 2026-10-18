from typing import Optional
from sqlalchemy import or_
from ..extensions import db, cache
from .models import Car, CarImage
from ..common.errors import ForbiddenError, NotFoundError, APIError
from ..common.uploads import save_image, delete_image


def list_cars(filters: dict, page: int, limit: int):
    query = Car.query

    if filters.get("make"):
        query = query.filter(Car.make.ilike(f"%{filters['make']}%"))
    if filters.get("model"):
        query = query.filter(Car.model.ilike(f"%{filters['model']}%"))
    if filters.get("year_min"):
        query = query.filter(Car.year >= filters["year_min"])
    if filters.get("year_max"):
        query = query.filter(Car.year <= filters["year_max"])
    if filters.get("price_min"):
        query = query.filter(Car.price >= filters["price_min"])
    if filters.get("price_max"):
        query = query.filter(Car.price <= filters["price_max"])
    if filters.get("fuel_type"):
        query = query.filter(Car.fuel_type == filters["fuel_type"])
    if filters.get("transmission"):
        query = query.filter(Car.transmission == filters["transmission"])
    if filters.get("condition"):
        query = query.filter(Car.condition == filters["condition"])
    if filters.get("location"):
        query = query.filter(Car.location.ilike(f"%{filters['location']}%"))
    if filters.get("is_available") is not None:
        query = query.filter(Car.is_available == filters["is_available"])
    if filters.get("q"):
        term = f"%{filters['q']}%"
        query = query.filter(
            or_(Car.description.ilike(term), Car.make.ilike(term), Car.model.ilike(term))
        )

    sort_field = filters.get("sort_by", "created_at")
    if sort_field not in {"price", "year", "created_at", "views"}:
        sort_field = "created_at"
    order_col = getattr(Car, sort_field)
    if filters.get("sort_order", "desc").lower() == "asc":
        query = query.order_by(order_col.asc())
    else:
        query = query.order_by(order_col.desc())

    return query.paginate(page=page, per_page=limit, error_out=False)


def get_car_or_404(car_id: int) -> Car:
    car = Car.query.get(car_id)
    if not car:
        raise NotFoundError("Car not found")
    return car


from ..common.uploads import save_image, delete_image

def create_car(seller_id: int, image_files: list, data: dict) -> Car:

    car = Car(seller_id=seller_id, **data)
    db.session.add(car)
    db.session.flush()  # get car.id

    saved_paths = []
    try:
        for i, file in enumerate(image_files):
            rel_path = save_image(file)
            saved_paths.append(rel_path)
            db.session.add(
                CarImage(url=rel_path, is_primary=(i == 0), car_id=car.id)
            )
        db.session.commit()
    except Exception:
        db.session.rollback()
        for p in saved_paths:
            delete_image(p)
        raise

    return car

def update_car(
    car: Car,
    actor,
    data: dict,
    image_files: Optional[list] = None,
    photo_order: Optional[list] = None,
) -> Car:
    if car.seller_id != actor.id and actor.role != "admin":
        raise ForbiddenError("Not authorised to edit this car")

    for field, value in data.items():
        if hasattr(car, field):
            setattr(car, field, value)

    # If photo updates are supplied
    if photo_order is not None or (image_files is not None and len(image_files) > 0):
        new_paths = []
        try:
            # 1. Save all new image files uploaded from library
            if image_files:
                for file in image_files:
                    if file and getattr(file, "filename", None):
                        rel_path = save_image(file)
                        new_paths.append(rel_path)

            # 2. Determine final sequence of URLs
            final_urls = []
            if photo_order:
                for item in photo_order:
                    item_str = str(item).strip()
                    if item_str.startswith("file:"):
                        idx = int(item_str.split(":", 1)[1])
                        if 0 <= idx < len(new_paths):
                            final_urls.append(new_paths[idx])
                    elif item_str.startswith("existing:"):
                        final_urls.append(item_str.split(":", 1)[1])
                    else:
                        final_urls.append(item_str)
            else:
                existing_urls = [img.url for img in car.images]
                final_urls = existing_urls + new_paths

            if not final_urls:
                raise APIError("At least one image is required", status_code=400)
            if len(final_urls) > 10:
                raise APIError("Maximum 10 images allowed", status_code=400)

            # 3. Identify old images no longer used
            current_urls = [img.url for img in car.images]
            old_paths_to_delete = [u for u in current_urls if u not in final_urls]

            # 4. Replace database image records in the exact specified order
            CarImage.query.filter_by(car_id=car.id).delete()
            for i, url in enumerate(final_urls):
                db.session.add(
                    CarImage(url=url, is_primary=(i == 0), car_id=car.id)
                )
            db.session.commit()

            # 5. Delete removed images from disk
            for p in old_paths_to_delete:
                delete_image(p)

        except Exception:
            db.session.rollback()
            for p in new_paths:
                delete_image(p)
            raise
    else:
        db.session.commit()

    return car


def delete_car(car: Car, actor):
    if car.seller_id != actor.id and actor.role != "admin":
        raise ForbiddenError("Not authorised to delete this car")

    paths = [img.url for img in car.images]
    db.session.delete(car)
    db.session.commit()
    for p in paths:
        delete_image(p)


def mark_status(car: Car, actor, is_sold=None, is_available=None) -> Car:
    if car.seller_id != actor.id and actor.role != "admin":
        raise ForbiddenError("Not authorised")

    if is_sold is True and is_available is True:
        raise APIError("Car cannot be both available and sold", status_code=400)

    if is_sold is not None:
        car.is_sold = is_sold
    if is_available is not None:
        car.is_available = is_available
    if car.is_sold:
        car.is_available = False

    db.session.commit()
    return car


def get_filter_options():
    cached = cache.get("car_filter_options")
    if cached:
        return cached

    makes = [r[0] for r in db.session.query(Car.make).distinct().all() if r[0]]
    models = [r[0] for r in db.session.query(Car.model).distinct().all() if r[0]]
    years = [r[0] for r in db.session.query(Car.year).distinct().all() if r[0]]
    locations = [r[0] for r in db.session.query(Car.location).distinct().all() if r[0]]

    result = {
        "makes": sorted(makes),
        "models": sorted(models),
        "years": sorted(years, reverse=True),
        "locations": sorted(locations),
    }
    cache.set("car_filter_options", result, timeout=600)
    return result