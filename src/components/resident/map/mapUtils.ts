import type { MapCoordinates, MapFacility, MapFeatureType } from "./mapTypes";

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

export function findNearestFacility(
  userLocation: MapCoordinates,
  facilities: MapFacility[],
): MapFacility | null {
  if (facilities.length === 0) return null;

  return facilities.reduce((nearest, facility) => {
    const nearestDistance = calculateDistance(userLocation, nearest);
    const currentDistance = calculateDistance(userLocation, facility);

    return currentDistance < nearestDistance ? facility : nearest;
  });
}

export function getMarkerColor(type: MapFeatureType): string {
  switch (type) {
    case "shelter":
      return "#16a34a";
    case "food":
      return "#ea580c";
    case "animal":
      return "#9333ea";
  }
}
