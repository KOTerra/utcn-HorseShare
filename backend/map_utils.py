import math

EARTH_RADIUS_KM = 6371.0  # Radius of Earth in kilometers


def is_in_range(lat: float, lon: float, center_lat: float, center_lon: float, range_km: int) -> bool:
    """
    Checks if an entity's coordinates are within a given range (in km)
    from a center point using the Haversine formula.
    """
    if lat is None or lon is None:
        return False

    try:
        lat1_rad = math.radians(lat)
        lon1_rad = math.radians(lon)
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
