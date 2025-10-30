from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, db
from typing import Tuple, List, Dict, Any
from horse_utils import generate_horses, process_horse_data
from driver_utils import compute_drivers_in_range

cred = credentials.Certificate("keys/firebase-key.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://studio-8626045391-660a8-default-rtdb.europe-west1.firebasedatabase.app/'
})

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserData(BaseModel):
    uid: str
    email: str
    location: Tuple[float, float]


class DriverData(BaseModel):
    uid: str
    email: str
    location: Tuple[float, float]


@app.get("/api/hello")
async def hello():
    return {"message": "Hello from FastAPI!"}


@app.get("/api/bye")
async def bye():
    return {"message": "Bye from FastAPI!"}


@app.put("/api/users")
async def save_user(user: UserData):
    try:
        ref = db.reference(f"users/{user.uid}")
        ref.set({"email": user.email,
                 "location": user.location})
        return {"message": f"User  {user.uid} email saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/drivers")
async def save_driver(driver: DriverData):
    try:
        ref = db.reference(f"drivers/{driver.uid}")
        ref.set({"email": driver.email,
                 "location": driver.location})
        return {"message": f"User  {driver.uid} email saved successfully"}
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


@app.get("/api/horses/{lat}/{lon}/{range}")
async def get_horses_in_range(lat: float, lon: float, range: int) -> List[Dict[str, Any]]:
    try:
        db_ref = db.reference("horses")
        all_horses_data = db_ref.get()

        (filtered_horses, new_horses_to_save) = process_horse_data(all_horses_data, lat, lon, range)

        if new_horses_to_save:
            for horse in new_horses_to_save:
                result = db_ref.push({
                    "location": [horse["lat"], horse["lon"]],
                    "name": horse["name"]
                })
                horse["id"] = result.key

            filtered_horses.extend(new_horses_to_save)

        return filtered_horses

    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error fetching/generating horses.")


@app.get("/api/drivers/{lat}/{lon}/{range}")
async def get_drivers_in_range(lat: float, lon: float, range: int) -> List[Dict[str, Any]]:
    try:
        db_ref = db.reference("drivers")
        all_drivers_data = db_ref.get()

        return compute_drivers_in_range(all_drivers_data, lat, lon, range)

    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error fetching drivers.")
