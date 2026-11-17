import type { MapCoordinates, MapFacility } from "./mapTypes";

// Calculate distance between two coordinates using Haversine formula.
// Returns distance in kilometers.

export function calculateDistance(
  origin: MapCoordinates,
  destination: MapCoordinates,
): number {
  const earthRadiusKm = 6371;

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const latitudeDifference = toRadians(destination.latitude - origin.latitude);

  const longitudeDifference = toRadians(
    destination.longitude - origin.longitude,
  );

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(origin.latitude)) *
      Math.cos(toRadians(destination.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

// Find the nearest facility from the user's current location.

export function findNearestFacility(
  userLocation: MapCoordinates,
  facilities: MapFacility[],
): MapFacility | null {
  if (facilities.length === 0) {
    return null;
  }

  let nearestFacility = facilities[0];
  let shortestDistance = calculateDistance(userLocation, {
    latitude: nearestFacility.latitude,
    longitude: nearestFacility.longitude,
  });

  for (const facility of facilities.slice(1)) {
    const distance = calculateDistance(userLocation, {
      latitude: facility.latitude,
      longitude: facility.longitude,
    });

    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestFacility = facility;
    }
  }

  return nearestFacility;
}
