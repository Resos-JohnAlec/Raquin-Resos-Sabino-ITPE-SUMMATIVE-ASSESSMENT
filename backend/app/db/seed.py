import sys
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password
from app.core.config import settings


def seed_database(db: Session) -> None:
    seed_users = [
        {
            "email": settings.SEED_ADMIN_EMAIL,
            "password": settings.SEED_ADMIN_PASSWORD,
            "role": UserRole.ADMIN,
        },
        {
            "email": settings.SEED_HANDLER_EMAIL,
            "password": settings.SEED_HANDLER_PASSWORD,
            "role": UserRole.HANDLER,
        },
        {
            "email": settings.SEED_USER_EMAIL,
            "password": settings.SEED_USER_PASSWORD,
            "role": UserRole.USER,
        },
    ]

    for item in seed_users:
        existing = db.query(User).filter(User.email == item["email"]).first()
        if not existing:
            user = User(
                email=item["email"],
                password_hash=hash_password(item["password"]),
                role=item["role"],
                is_active=True
            )
            db.add(user)
    db.commit()


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
        print("Database seeded successfully.")
    except Exception as e:
        print(f"Error seeding database: {e}", file=sys.stderr)
        db.rollback()
        sys.exit(1)
    finally:
        db.close()
