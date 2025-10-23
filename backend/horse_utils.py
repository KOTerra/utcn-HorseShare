import math
import random
def generate_horses(center_lat_s, center_lon_s, range_km_s, count_s):    
    center_lat = float(center_lat_s)
    center_lon = float(center_lon_s)
    range_km = float(range_km_s)
    count = int(count_s)
    earth_radius_km = 6371.0
    range_degrees = range_km / earth_radius_km * (180 / math.pi)
    
    #cele mai puscate nume de cai 
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
    for i in range(count):
        distance = random.random() * range_degrees
        angle = random.random() * 2 * math.pi
        
        lat = center_lat + distance * math.cos(angle)
        lon = center_lon + distance * math.sin(angle)
        
        if (lat > -90 and lat < 90 and lon > -180 and lon < 180):
            horse_list.append({"lat": lat, "lon": lon, "name": random.choice(names)})

    return horse_list


def is_in_range(horse_lat: float, horse_lon: float, center_lat: float, center_lon: float, max_range_km: float) -> bool:
    """
    Checks if a horse's location is within max_range_km of the center point
    using the Haversine formula for accurate distance in kilometers.
    """
    earth_radius_km = 6371.0 

    lat1_rad = math.radians(center_lat)
    lon1_rad = math.radians(center_lon)
    lat2_rad = math.radians(horse_lat)
    lon2_rad = math.radians(horse_lon)

    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance_km = earth_radius_km * c
    return distance_km < max_range_km

#
