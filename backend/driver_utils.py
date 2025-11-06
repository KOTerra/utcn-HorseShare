from map_utils import is_in_range


def compute_drivers_in_range(all_drivers_data, lat, lon, range):
    drivers_in_range = []

    for driver_data in all_drivers_data.values():
        #if driver_data.get("loggedIn") == True:
        location = driver_data.get("location")

        driver_lat = location[0]
        driver_lon = location[1]

        if is_in_range(driver_lat, driver_lon, lat, lon, range): 
            drivers_in_range.append(driver_data)

    return drivers_in_range
