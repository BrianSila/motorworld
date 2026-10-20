from app import create_app
from app.extensions import db
from app.accounts.models import User
from app.inventory.models import Car, CarImage

app = create_app("development")

with app.app_context():
    db.drop_all()
    db.create_all()

    admin = User(name="Admin", email="admin@simat.com", role="admin", phone="0740892332")
    admin.set_password("Admin123!")
    seller = User(name="John Seller", email="seller@simat.com", role="user", phone="+254712345678")
    seller.set_password("Seller123!")

    db.session.add_all([admin, seller])
    db.session.commit()

    car = Car(
        make="Toyota",
        model="Land Cruiser Prado",
        year=2020,
        price=6500000,
        condition="Used",
        fuel_type="Petrol",
        transmission="Automatic",
        location="Nairobi",
        description="Well maintained, one owner, full service history.",
        seller_id=seller.id,
    )
    db.session.add(car)
    db.session.flush()
    db.session.add_all([
        CarImage(url="https://images.pexels.com/photos/34166839/pexels-photo-34166839.jpeg", is_primary=True, car_id=car.id),
        CarImage(url="https://images.pexels.com/photos/26442876/pexels-photo-26442876.jpeg", car_id=car.id),
    ])
    db.session.commit()

    print("Seeded users and cars.")