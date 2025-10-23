import math
import random
from typing import List, Dict, Any, Tuple

# --- Constants ---
DEFAULT_HORSE_COUNT = 20
EARTH_RADIUS_KM = 6371.0  # Radius of Earth in kilometers


# --- Geolocation Logic ---

def is_in_range(horse_lat: float, horse_lon: float, center_lat: float, center_lon: float, range_km: int) -> bool:
    """
    Checks if a horse's coordinates are within a given range (in km) 
    from a center point using the Haversine formula.
    """
    if horse_lat is None or horse_lon is None:
        return False

    try:
        lat1_rad = math.radians(horse_lat)
        lon1_rad = math.radians(horse_lon)
        lat2_rad = math.radians(center_lat)
        lon2_rad = math.radians(center_lon)

        dlon = lon2_rad - lon1_rad
        dlat = lat2_rad - lat1_rad

        a = math.sin(dlat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        distance = EARTH_RADIUS_KM * c
        return distance <= range_km

    except Exception as e:
        print(f"Error calculating Haversine distance: {e}")
        return False


# --- Generation Logic ---

def generate_horses(center_lat: float, center_lon: float, range_km: float, count: int) -> List[Dict[str, Any]]:
    """
    Generates a list of new horses within a specified range.
    """
    range_degrees = range_km / EARTH_RADIUS_KM * (180 / math.pi)

    names = ["Afrodita", "Elektra", "Harmony", "Athena", "Daphne",
             "Gaia", "Hebe", "Hera", "Kaliope", "Pandora",
             "Penelope", "Isis", "Juno", "Venus", "Luna", "Ahile", "Ares", "Zeus", "Apollo", "Hector",
             "Helios", "Icarus", "Castor", "Laius", "Midas",
             "Orfeu", "Pallas", "Zefir", "Horus", "Amon",
             "Hapi", "Aton", "Bachus", "Heracles", "Saturn", "Joey", "Spirit", "Ed", "Maximus", "Tornado",
             "Pegasus", "Mustang", "Angus", "Seabiscuit",
             "Asterix", "Bella", "Elsa", "Bond", "Romeo", "Majestic", "Eclipse", "Stardust", "Velvet", "Noble",
             "Aramis", "Caspian", "Sterling", "Silhouette", "Raven",
             "Obsidian", "Sapphire", "Aurora"
             ]

    horse_list = []
    for _ in range(count):
        distance = math.sqrt(random.random()) * range_degrees
        angle = random.random() * 2 * math.pi

        lat = center_lat + distance * math.cos(angle)
        lon = center_lon + distance * math.sin(angle)

        if -90 < lat < 90 and -180 < lon < 180:
            horse_list.append({"lat": lat, "lon": lon, "name": random.choice(names)})

    return horse_list


# --- Internal Logic Function ---

def _filter_existing_horses(all_horses_data: Dict[str, Any], lat: float, lon: float, range_km: int) -> List[
    Dict[str, Any]]:
    """Filters horses from the DB data based on range."""
    filtered_list = []
    if not all_horses_data:
        return filtered_list

    for horse_id, horse_data in all_horses_data.items():
        if is_in_range(horse_data.get("lat"), horse_data.get("lon"), lat, lon, range_km):
            horse_data["id"] = horse_id
            filtered_list.append(horse_data)
    return filtered_list


# --- Main Service Function ---

def process_horse_data(all_horses_data: Dict[str, Any], lat: float, lon: float, range_km: int) \
        -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Processes horse data to filter existing and determine new horses to create.
    
    Returns a tuple:
    1. List of existing filtered horses (with their original IDs).
    2. List of new horses to be generated without IDs
    """

    # filter existing horses
    filtered_horses = _filter_existing_horses(all_horses_data, lat, lon, range_km)
    current_no_of_horses = len(filtered_horses)

    new_horses_to_generate = []

    # gen missing horses
    if current_no_of_horses < DEFAULT_HORSE_COUNT:
        horses_to_generate_count = DEFAULT_HORSE_COUNT - current_no_of_horses

        new_horses_to_generate = generate_horses(
            lat, lon, float(range_km), horses_to_generate_count
        )

    return filtered_horses, new_horses_to_generate
