from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
import os
from datetime import datetime, timedelta
from typing import Dict
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/api/auth", tags=["auth"])

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')
if not MONGO_URL or not DB_NAME:
    # server.py already loads .env and sets db; if not available, attempts to connect to default
    client = AsyncIOMotorClient(MONGO_URL or 'mongodb://localhost:27017')
else:
    client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME or 'test_database']

SECRET_KEY = os.environ.get('MAGIC_SECRET', os.environ.get('SECRET_KEY', 'dev-secret'))
ALGORITHM = 'HS256'


class SignupReq(BaseModel):
    email: EmailStr


class VerifyReq(BaseModel):
    token: str


@router.post('/signup')
async def signup(payload: SignupReq):
    # create user if not exists
    existing = await db.users.find_one({'email': payload.email.lower()})
    if existing:
        user_id = str(existing['_id'])
    else:
        res = await db.users.insert_one({
            'email': payload.email.lower(),
            'created_at': datetime.utcnow(),
        })
        user_id = str(res.inserted_id)

    # generate short-lived magic token (15 minutes)
    exp = datetime.utcnow() + timedelta(minutes=15)
    token = jwt.encode({'sub': user_id, 'exp': int(exp.timestamp())}, SECRET_KEY, algorithm=ALGORITHM)

    # In prod: send email with link. For dev, return token in response.
    return {'user_id': user_id, 'magic_token': token, 'expires_at': exp.isoformat()}


@router.post('/verify')
async def verify(payload: VerifyReq):
    try:
        data = jwt.decode(payload.token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = data.get('sub')
        if not user_id:
            raise HTTPException(status_code=400, detail='Invalid token')
        # Issue a longer-lived access token for API use (7 days)
        access_exp = datetime.utcnow() + timedelta(days=7)
        access_token = jwt.encode({'sub': user_id, 'exp': int(access_exp.timestamp())}, SECRET_KEY, algorithm=ALGORITHM)
        return {'user_id': user_id, 'access_token': access_token, 'access_expires_at': access_exp.isoformat()}
    except JWTError:
        raise HTTPException(status_code=400, detail='Invalid or expired token')
