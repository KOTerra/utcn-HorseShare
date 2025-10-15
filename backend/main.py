from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, db

# Initialize Firebase Admin
cred = credentials.Certificate("keys/firebase-key.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://studio-8626045391-660a8-default-rtdb.europe-west1.firebasedatabase.app/'
})

# FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model
class UserData(BaseModel):
    uid: str
    email: str

# Test routes
@app.get("/api/hello")
async def hello():
    return {"message": "Hello from FastAPI!"}

@app.get("/api/bye")
async def bye():
    return {"message": "Bye from FastAPI!"}

# POST route to save user
@app.post("/api/users")
async def save_user(user: UserData):
    try:
        ref = db.reference(f"users/{user.uid}")
        ref.set({"email": user.email})
        return {"message": "User email saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
