from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel


router = APIRouter(prefix="/auth", tags=["auth"])

DEMO_USERS = {
    "supervisor@example.com": {
        "password": "123456",
        "role": "supervisor",
        "group_id": 1,
        "group_code": "supervisor",
        "group_name": "Süpervizör",
        "name": "Demo Süpervizör",
    },
    "ogrenci@example.com": {
        "password": "123456",
        "role": "student",
        "group_id": 2,
        "group_code": "student",
        "group_name": "Öğrenci",
        "name": "Demo Öğrenci",
    },
    "okul@example.com": {
        "password": "123456",
        "role": "school",
        "group_id": 3,
        "group_code": "school",
        "group_name": "Okul",
        "name": "Demo Okul",
    },
    "isletme@example.com": {
        "password": "123456",
        "role": "company",
        "group_id": 4,
        "group_code": "company",
        "group_name": "İşletme",
        "name": "Demo İşletme",
    },
}


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(data: LoginRequest) -> dict[str, object]:
    email = data.email.strip().lower()
    user = DEMO_USERS.get(email)
    if not user or data.password != user["password"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı",
        )

    return {
        "access_token": f"demo-token-{user['group_code']}",
        "token_type": "bearer",
        "user": {
            "email": email,
            "name": user["name"],
            "role": user["role"],
            "group_id": user["group_id"],
            "group_code": user["group_code"],
            "group_name": user["group_name"],
        },
    }
