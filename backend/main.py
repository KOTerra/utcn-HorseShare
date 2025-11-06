from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from datetime import timezone
import firebase_admin
from firebase_admin import credentials, db
from typing import List, Dict, Any # <-- Removed Tuple, added List
from horse_utils import generate_horses, process_horse_data
from driver_utils import compute_drivers_in_range
from starlette.responses import Response
import asyncio
from datetime import timedelta 
from typing import Literal 

LOGOUT_THRESHOLD_INTERVALS = 30 
CLEANUP_INTERVAL_SECONDS = 60

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

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    return response



class UserData(BaseModel):
    uid: str
    email: str
    location: List[float] 
    loggedIn : bool
    lastActiveAt : datetime | None = None

class DriverData(BaseModel):
    uid: str
    email: str
    location: List[float] 
    loggedIn : bool
    lastActiveAt : datetime | None = None

class HeartbeatInput(BaseModel):
    uid: str

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
                 "location": user.location,
                  "loggedIn": user.loggedIn})
        return {"message": f"User  {user.uid} email saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/drivers")
async def save_driver(driver: DriverData):
    try:
        ref = db.reference(f"drivers/{driver.uid}")
        ref.set({"email": driver.email,
                 "location": driver.location,
                 "loggedIn" : driver.loggedIn})
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

@app.post("/api/users/heartbeat")
async def get_users_heartbeat(data: HeartbeatInput):
    """
        Recieves a heartbeat ping from the cliend and updates the lastActiveTime
    """
    try:
        now_utc = datetime.now(timezone.utc)
        ref = db.reference(f"users/{data.uid}")
        ref.update({
            "lastActiveAt": now_utc.isoformat(),
            "loggedIn": True
        })
        
        return {"message" : f"Heartbeat recieved from user {data.uid}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to process heartbeat")

@app.post("/api/drivers/heartbeat")
async def get_drivers_heartbeat(data: HeartbeatInput):
    """
        Recieves a heartbeat ping from the cliend and updates the lastActiveTime
    """
    try:
        now_utc = datetime.now(timezone.utc)
        ref = db.reference(f"drivers/{data.uid}")
        ref.update({
            "lastActiveAt": now_utc.isoformat(),
            "loggedIn": True
        })
        
        return {"message" : f"Heartbeat recieved from user {data.uid}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to process heartbeat")
    
async def db_set_inactive_users(user_type: Literal["users", "drivers"], stale_time: datetime) -> int:
    
    try:
        ref = db.reference(user_type)
        data: Dict[str, Any] = ref.get()
        if not data: return 0
        
        mod_cnt = 0
        updates = {}
        
        for uid, user_data in data.items():
            if user_data.get("loggedIn") is True:
                last_active_str = user_data.get("lastActiveAt")
                if not last_active_str:
                    updates[f"{uid}/loggedIn"] = False 
                    mod_cnt += 1
                    continue
                try: 
                    last_active_time = datetime.fromisoformat(last_active_str)
                    
                    if last_active_time.tzinfo is None:
                        last_active_time = last_active_time.replace(tzinfo=timezone.utc)
                    else:
                        last_active_time = last_active_time.astimezone(timezone.utc)
                    
                    if last_active_time < stale_time:
                        updates[f"{uid}/loggedIn"] = False
                        mod_cnt += 1
                except ValueError:
                    print(f"Warning: Malformed timestamp for {uid} in {user_type}: {last_active_str}")
                    updates[f"{uid}/loggedIn"] = False
                    mod_cnt += 1
        
        if updates: 
            ref.update(updates)
        
        return mod_cnt
                
    
    except Exception as e:
        print(f"Database Cleanup Error for {user_type}: {e}")
        return 0

async def run_cleaup_job_loop():
    """"Main background loop to run the cleanup job periodcially"""
    await asyncio.sleep(5)
    print("Background clean loop starting")
    
    while True:
        try: 
            stale_time = datetime.now(timezone.utc) - timedelta(seconds = LOGOUT_THRESHOLD_INTERVALS)
            
            riders_logged_out = await db_set_inactive_users("users", stale_time)
            drivers_logged_out = await db_set_inactive_users("drivers", stale_time)
            
            current_time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
        except Exception as e:
            print(f"CRITICAL: Cleanup job loop failed: {e}")
            
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(run_cleaup_job_loop())
    print("Cleanup background task scheduled.")

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



@app.get("/")
async def read_root():
    return {"message": "Server is running"}