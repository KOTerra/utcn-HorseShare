from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, db
from typing import Tuple
from horse_utils import generate_horses
from horse_utils import is_in_range
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
    location : Tuple[float, float]
    

# Test routes
@app.get("/api/hello")
async def hello():
    return {"message": "Hello from FastAPI!"}

@app.get("/api/bye")
async def bye():
    return {"message": "Bye from FastAPI!"}

# PUT endpoint to save user
@app.put("/api/users")
async def save_user(user: UserData):
    try:
        ref = db.reference(f"users/{user.uid}")
        ref.set({"email": user.email,
                 "location" : user.location})
        return {"message": f"User  {user.uid} email saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/{uid}")
async def get_user(uid: str):
    try:
        ref = db.reference(f"users/{uid}")
        user_data = ref.get()
        if not user_data:
            raise HTTPException(status_code=404, detail="User not found")
        return user_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/horses/{lat}/{lon}/{range}/{count}")
async def generate_horses_in_range(lat, lon, range, count):
    """
    Generate count horses in a given range. Puts them in the db
    """    
    horse_list = generate_horses(lat, lon, range, count)
    try: 
        ref = db.reference(f"horses/")
        horse_list = generate_horses(lat, lon, range, count)
        saved_ids = []
        for horse in horse_list:
            result = ref.push({"lat": horse["lat"],
                     "lon": horse["lon"],
                     "name": horse["name"]})
            horse_id = result.key
            saved_ids.append(horse_id)
        return {"message": f"{len(horse_list)} horses  added!",
                "saved_ids": saved_ids}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/horses/{lat}/{lon}/{range}")
async def get_horses_in_range(lat, lon, range):
    lat = float(lat)
    lon = float(lon)
    range = int(range)
    try: 
        ref = db.reference("horses")
        all_horses_data = ref.get()
        filtered_horses = []
        if all_horses_data:
            for horse_id, horse_data in all_horses_data.items():
                if(is_in_range(horse_data["lat"], horse_data["lon"], lat, lon, range)):
                    horse_data["id"] = horse_id
                    filtered_horses.append(horse_data)
        return filtered_horses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


        
        
    