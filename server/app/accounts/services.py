from ..extensions import db
from .models import User
from ..common.errors import ForbiddenError, NotFoundError
from ..enquiries.models import Enquiry
from ..favourites.models import Favourite
from ..inventory.models import Car
from ..test_drives.models import TestDrive


def get_user_or_404(user_id: int) -> User:
    user = User.query.get(user_id)
    if not user:
        raise NotFoundError("User not found")
    return user


def update_profile(user: User, data: dict) -> User:
    if "name" in data and data["name"]:
        user.name = data["name"]
    if "phone" in data:
        user.phone = data["phone"]
    from ..extensions import db

    db.session.commit()
    return user


def change_role(actor: User, target_id: int, new_role: str) -> User:
    if actor.role != "admin":
        raise ForbiddenError("Only admins can change roles")
    target = get_user_or_404(target_id)
    target.role = new_role
    from ..extensions import db

    db.session.commit()
    return target


def list_users(page=1, limit=20):
    return User.query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=limit, error_out=False
    )
    
    
def get_user_details(actor: User, user_id: int) -> dict:
    user = db.get_or_404(User, user_id, description=f"User with ID {user_id} not found")

    return {
        "user": user.to_dict(),
        "cars": [car.to_dict() for car in Car.query.filter_by(seller_id=user.id).all()],
        "enquiries": [
            enquiry.to_dict()
            for enquiry in Enquiry.query.filter_by(user_id=user.id).all()
        ],
        "test_drives": [
            test_drive.to_dict()
            for test_drive in TestDrive.query.filter_by(user_id=user.id).all()
        ],
        "favourites": [
            {
                **favourite.to_dict(),
                "car": {
                    "id": favourite.car.id,
                    "make": favourite.car.make,
                    "model": favourite.car.model,
                }
                if favourite.car
                else None,
            }
            for favourite in Favourite.query.filter_by(user_id=user.id).all()
        ],
    }