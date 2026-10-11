from app.core.database import SessionLocal
from app.models import User
from app.core.security import get_password_hash

def ensure_admin():
    db = SessionLocal()
    user = db.query(User).filter(User.email == 'admin@careerpilot.ai').first()
    if not user:
        user = User(
            email='admin@careerpilot.ai',
            hashed_password=get_password_hash('Admin123!'),
            full_name='CareerPilot Admin',
            is_admin=True
        )
        db.add(user)
        db.commit()
        print('Created admin@careerpilot.ai')
    else:
        user.hashed_password = get_password_hash('Admin123!')
        user.is_admin = True
        db.commit()
        print('Updated admin@careerpilot.ai')
    db.close()

if __name__ == '__main__':
    ensure_admin()
