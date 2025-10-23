from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, db
from typing import Tuple, List, Dict, Any
from horse_utils import generate_horses
from horse_utils import is_in_range

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
    location : Tuple[float, float]
    
DEFAULT_HORSE_COUNT = 25 



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




@app.get("/api/horses/{lat}/{lon}/{range}")
async def get_horses_in_range(lat : float, lon : float, range : int) -> List[Dict[str, Any]]:
    """
    Fetches horses in range, and if the count is below DEFAULT_HORSE_COUNT, 
    it generates, saves, and includes the new horses in the final returned list.
    """
    try: 
        ref = db.reference("horses")
        all_horses_data = ref.get()
        filtered_horses = []
        
        # 1. FILTER existing horses in range
        if all_horses_data:
            for horse_id, horse_data in all_horses_data.items():
                if is_in_range(horse_data["lat"], horse_data["lon"], lat, lon, range):
                    horse_data["id"] = horse_id
                    filtered_horses.append(horse_data)

        current_no_of_horses = len(filtered_horses)
        
        print(f"Found {current_no_of_horses} horses in range {range}km.")
        
        # 2. CHECK and GENERATE missing horses
        if current_no_of_horses < DEFAULT_HORSE_COUNT:
            horses_to_generate = DEFAULT_HORSE_COUNT - current_no_of_horses
            print(f"Target count is {DEFAULT_HORSE_COUNT}. Generating {horses_to_generate} new horses...")

            
            new_horse_list = generate_horses(lat, lon, range, horses_to_generate)
            
            # Save new horses to DB and add them to the filtered list
            for horse in new_horse_list:
                result = ref.push({
                    "lat": horse["lat"], 
                    "lon": horse["lon"], 
                    "name": horse["name"]
                })
                

                horse["id"] = result.key
                filtered_horses.append(horse)

            print(f"Successfully generated and saved {len(new_horse_list)} horses.")
        return filtered_horses
        
    except Exception as e:
        print(f"FATAL SERVER ERROR in get_horses_in_range: {e}")
        raise HTTPException(status_code=500, detail="Internal server error fetching/generating horses.")