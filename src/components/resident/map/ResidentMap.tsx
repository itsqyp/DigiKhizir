import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { AlertCircle, MapPin, Navigation, Route, X } from "lucide-react";

import { API_BASE_URL } from "../../../lib/api";

import type {
  MapAlert,
  MapCoordinates,
  MapFacility,
  MapFeatureType,
  MapRoute,
} from "./mapTypes";

import {
  calculateDistance,
  findNearestFacility,
  getMarkerColor,
} from "./mapUtils";

// --------------------------------------------------
// COMPONENT PROPS AND API TYPES
// --------------------------------------------------

interface ResidentMapProps {
  userLocation: MapCoordinates;
  districtId: string;
  selectedFeatures: string[];
}

interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
  message?: string;
}

interface ShelterApi {
  id: string;
  name: string;
  nameBn?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  occupancy: number | null;
  capacityRemaining: number | null;
  distanceKm?: number;
  facilities: MapFacility["facilities"];
}

interface FoodApi {
  id: string;
  name: string;
  nameBn?: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  dryFoodStockKg: number | null;
}

interface AnimalShelterApi {
  id: string;
  name: string;
  nameBn?: string | null;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  occupancy: number | null;
  availableCapacity: number | null;
  animalTypes: string[];
  facilities: MapFacility["facilities"];
}

// --------------------------------------------------
// MAP MARKER ICONS
// --------------------------------------------------

const createFacilityIcon = (type: MapFeatureType, isNearest: boolean) => {
  const color = isNearest ? "#15803d" : getMarkerColor(type);
  const size = isNearest ? 38 : 30;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: ${isNearest ? "4px solid #bbf7d0" : "3px solid white"};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const userLocationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #2563eb;
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 6px rgba(37,99,235,0.2);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// --------------------------------------------------
// MAP CONTROLLER
// --------------------------------------------------

function MapController({
  userLocation,
  route,
}: {
  userLocation: MapCoordinates;
  route: MapRoute | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!route) {
      map.flyTo([userLocation.latitude, userLocation.longitude], 14, {
        duration: 1,
      });
    } else if (route.coordinates.length > 0) {
      const bounds = L.latLngBounds(route.coordinates);

      map.fitBounds(bounds, {
        padding: [45, 45],
      });
    }
  }, [map, userLocation, route]);

  return null;
}

// --------------------------------------------------
// FETCH FACILITIES
// --------------------------------------------------

async function fetchFacilities(
  districtId: string,
  selectedFeatures: string[],
  signal: AbortSignal,
): Promise<{
  facilities: MapFacility[];
  alerts: MapAlert[];
}> {
  const facilities: MapFacility[] = [];
  let alerts: MapAlert[] = [];

  const requests: Promise<void>[] = [];

  // HUMAN SHELTERS

  if (selectedFeatures.includes("shelters")) {
    requests.push(
      fetch(
        `${API_BASE_URL}/api/shelters?districtId=${encodeURIComponent(
          districtId,
        )}&limit=50`,
        { signal },
      ).then(async (response) => {
        const result: ApiResponse<ShelterApi[]> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load shelters.");
        }

        for (const shelter of result.data) {
          if (
            !Number.isFinite(shelter.latitude) ||
            !Number.isFinite(shelter.longitude)
          ) {
            continue;
          }

          facilities.push({
            id: shelter.id,
            name: shelter.name,
            nameBn: shelter.nameBn,
            address: shelter.address,
            latitude: shelter.latitude,
            longitude: shelter.longitude,
            type: "shelter",
            capacity: shelter.capacity,
            occupancy: shelter.occupancy,
            availableCapacity: shelter.capacityRemaining,
            distanceKm: shelter.distanceKm,
            facilities: shelter.facilities,
          });
        }
      }),
    );
  }

  // FOOD DISTRIBUTION POINTS

  if (selectedFeatures.includes("food")) {
    requests.push(
      fetch(
        `${API_BASE_URL}/api/food?districtId=${encodeURIComponent(districtId)}`,
        { signal },
      ).then(async (response) => {
        const result: ApiResponse<FoodApi[]> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load food points.");
        }

        for (const point of result.data) {
          if (
            point.latitude === null ||
            point.longitude === null ||
            !Number.isFinite(point.latitude) ||
            !Number.isFinite(point.longitude)
          ) {
            continue;
          }

          facilities.push({
            id: point.id,
            name: point.name,
            nameBn: point.nameBn,
            address: point.address,
            latitude: point.latitude,
            longitude: point.longitude,
            type: "food",
            dryFoodStockKg: point.dryFoodStockKg,
          });
        }
      }),
    );
  }

  // ANIMAL SHELTERS

  if (selectedFeatures.includes("animals")) {
    requests.push(
      fetch(
        `${API_BASE_URL}/api/animal-shelters?districtId=${encodeURIComponent(
          districtId,
        )}`,
        { signal },
      ).then(async (response) => {
        const result: ApiResponse<AnimalShelterApi[]> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load animal shelters.");
        }

        for (const shelter of result.data) {
          if (
            !Number.isFinite(shelter.latitude) ||
            !Number.isFinite(shelter.longitude)
          ) {
            continue;
          }

          facilities.push({
            id: shelter.id,
            name: shelter.name,
            nameBn: shelter.nameBn,
            address: shelter.address,
            latitude: shelter.latitude,
            longitude: shelter.longitude,
            type: "animal",
            capacity: shelter.capacity,
            occupancy: shelter.occupancy,
            availableCapacity: shelter.availableCapacity,
            animalTypes: shelter.animalTypes,
            facilities: shelter.facilities,
          });
        }
      }),
    );
  }

  // DISASTER ALERTS

  if (selectedFeatures.includes("alerts")) {
    requests.push(
      fetch(
        `${API_BASE_URL}/api/alerts?districtId=${encodeURIComponent(
          districtId,
        )}`,
        { signal },
      ).then(async (response) => {
        const result: ApiResponse<MapAlert[]> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load alerts.");
        }

        alerts = result.data;
      }),
    );
  }

  await Promise.all(requests);

  return {
    facilities,
    alerts,
  };
}

// --------------------------------------------------
// MAIN RESIDENT MAP
// --------------------------------------------------

export default function ResidentMap({
  userLocation,
  districtId,
  selectedFeatures,
}: ResidentMapProps) {
  const [facilities, setFacilities] = useState<MapFacility[]>([]);
  const [alerts, setAlerts] = useState<MapAlert[]>([]);

  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState("");

  const [selectedFacility, setSelectedFacility] = useState<MapFacility | null>(
    null,
  );

  const [route, setRoute] = useState<MapRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");

  // A unique key for the current district and feature selection.

  const selectedFeaturesKey = [...selectedFeatures].sort().join(",");

  const requestKey = `${districtId}|${selectedFeaturesKey}`;

  // Loading is derived instead of being set inside useEffect.

  const loading = loadedKey !== requestKey;

  // Only display data belonging to the current request.

  const currentFacilities = loadedKey === requestKey ? facilities : [];

  const currentAlerts = loadedKey === requestKey ? alerts : [];

  const currentError = loadedKey === requestKey ? error : "";

  // ------------------------------------------------
  // LOAD FACILITIES
  // ------------------------------------------------

  useEffect(() => {
    if (!districtId) return;

    const controller = new AbortController();

    async function loadFacilities() {
      try {
        const result = await fetchFacilities(
          districtId,
          selectedFeaturesKey.split(",").filter(Boolean),
          controller.signal,
        );

        if (controller.signal.aborted) return;

        setFacilities(result.facilities);
        setAlerts(result.alerts);
        setError("");

        setSelectedFacility(null);
        setRoute(null);
        setRouteError("");

        setLoadedKey(requestKey);
      } catch (err) {
        if (
          controller.signal.aborted ||
          (err instanceof Error && err.name === "AbortError")
        ) {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Unable to load map facilities.",
        );

        setLoadedKey(requestKey);
      }
    }

    loadFacilities();

    return () => {
      controller.abort();
    };
  }, [districtId, selectedFeaturesKey, requestKey]);

  // ------------------------------------------------
  // FIND NEAREST HUMAN SHELTER
  // ------------------------------------------------

  const nearestShelter = useMemo(() => {
    return findNearestFacility(
      userLocation,
      currentFacilities.filter((facility) => facility.type === "shelter"),
    );
  }, [userLocation, currentFacilities]);

  // ------------------------------------------------
  // ROUTE CALCULATION
  // ------------------------------------------------

  async function showRoute(facility: MapFacility) {
    setSelectedFacility(facility);
    setRoute(null);
    setRouteError("");
    setRouteLoading(true);

    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${userLocation.longitude},${userLocation.latitude};` +
        `${facility.longitude},${facility.latitude}` +
        `?overview=full&geometries=geojson`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Unable to retrieve directions.");
      }

      const result = await response.json();

      if (result.code !== "Ok" || !result.routes?.length) {
        throw new Error("No driving route was found for this location.");
      }

      const bestRoute = result.routes[0];

      setRoute({
        coordinates: bestRoute.geometry.coordinates.map(
          ([longitude, latitude]: [number, number]) => [latitude, longitude],
        ),
        distanceKm: bestRoute.distance / 1000,
        durationMinutes: bestRoute.duration / 60,
      });
    } catch (err) {
      setRouteError(
        err instanceof Error ? err.message : "Unable to calculate the route.",
      );
    } finally {
      setRouteLoading(false);
    }
  }

  function clearSelection() {
    setSelectedFacility(null);
    setRoute(null);
    setRouteError("");
  }

  // ------------------------------------------------
  // ALERT STYLING
  // ------------------------------------------------

  function alertSeverity(severity: string) {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";

      case "HIGH":
        return "bg-orange-100 text-orange-800";

      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";

      default:
        return "bg-blue-100 text-blue-800";
    }
  }

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-deep-sea-blue/10 bg-white shadow-lg">
      {/* HEADER */}

      <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-deep-sea-blue">
              Emergency Facilities Map
            </h2>

            <p className="mt-1 text-sm text-deep-sea-blue/60">
              Explore facilities in {districtId}.
            </p>
          </div>

          <span className="rounded-full bg-mint-cream px-3 py-1 text-sm font-semibold text-deep-sea-blue">
            {currentFacilities.length} locations
          </span>
        </div>

        {/* MAP LEGEND */}

        <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-blue-600" />
            Your location
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-green-600" />
            Safe shelters
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-orange-600" />
            Food points
          </span>

          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-purple-600" />
            Animal shelters
          </span>
        </div>
      </div>

      {/* ALERTS */}

      {currentAlerts.length > 0 && (
        <div className="border-y border-red-100 bg-red-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-red-800">
            <AlertCircle className="h-5 w-5" />
            District disaster alerts ({currentAlerts.length})
          </div>

          <div className="mt-3 space-y-2">
            {currentAlerts.map((alert) => (
              <div key={alert.id} className="rounded-lg bg-white p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-deep-sea-blue">
                    {alert.title}
                  </span>

                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${alertSeverity(
                      alert.severity,
                    )}`}
                  >
                    {alert.severity}
                  </span>
                </div>

                <p className="mt-1 text-sm text-deep-sea-blue/70">
                  {alert.message}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-2 text-xs text-red-700/70">
            These are district-level warnings, not exact map locations.
          </p>
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <p className="p-5 text-sm text-deep-sea-blue/65">
          Loading emergency facilities...
        </p>
      )}

      {/* ERROR */}

      {currentError && (
        <p className="flex items-center gap-2 p-5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {currentError}
        </p>
      )}

      {/* EMPTY STATE */}

      {!loading && !currentError && currentFacilities.length === 0 && (
        <p className="p-5 text-sm text-deep-sea-blue/65">
          No facilities with map coordinates were found for your selected
          features in this district.
        </p>
      )}

      {/* MAP */}

      <MapContainer
        center={[userLocation.latitude, userLocation.longitude]}
        zoom={13}
        scrollWheelZoom
        className="h-[480px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController userLocation={userLocation} route={route} />

        {/* USER LOCATION */}

        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={userLocationIcon}
        >
          <Popup>
            <strong>You are here</strong>
          </Popup>
        </Marker>

        {/* FACILITY MARKERS */}

        {currentFacilities.map((facility) => {
          const isNearest = nearestShelter?.id === facility.id;

          return (
            <Marker
              key={`${facility.type}-${facility.id}`}
              position={[facility.latitude, facility.longitude]}
              icon={createFacilityIcon(facility.type, isNearest)}
              eventHandlers={{
                click: () => showRoute(facility),
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <strong>{facility.name}</strong>

                  {facility.nameBn && <p>{facility.nameBn}</p>}

                  <p className="mt-1 text-sm">{facility.address}</p>

                  {isNearest && (
                    <p className="mt-2 font-semibold text-green-700">
                      Nearest safe shelter
                    </p>
                  )}

                  <p className="mt-1 text-xs">
                    {calculateDistance(userLocation, facility).toFixed(1)} km
                    away (straight-line distance)
                  </p>

                  <p className="mt-2 text-xs">
                    Click the marker to calculate a driving route.
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ROUTE LINE */}

        {route && (
          <Polyline
            positions={route.coordinates}
            pathOptions={{
              color: "#2563eb",
              weight: 6,
              opacity: 0.8,
            }}
          />
        )}
      </MapContainer>

      {/* NEAREST SHELTER */}

      {nearestShelter && (
        <div className="border-t border-green-100 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-green-800">
            <MapPin className="h-4 w-4" />
            Nearest safe shelter
          </div>

          <p className="mt-1 font-semibold text-deep-sea-blue">
            {nearestShelter.name}
          </p>

          <p className="mt-1 text-sm text-deep-sea-blue/65">
            {nearestShelter.address}
          </p>

          <p className="mt-1 text-sm text-green-800">
            {calculateDistance(userLocation, nearestShelter).toFixed(1)} km away
            in a straight line
          </p>

          <button
            type="button"
            onClick={() => showRoute(nearestShelter)}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            <Navigation className="h-4 w-4" />
            Show route to nearest shelter
          </button>
        </div>
      )}

      {/* SELECTED FACILITY DETAILS */}

      {selectedFacility && (
        <div className="border-t border-deep-sea-blue/10 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-deep-sea-blue">
                {selectedFacility.name}
              </h3>

              <p className="mt-1 text-sm text-deep-sea-blue/60">
                {selectedFacility.address}
              </p>
            </div>

            <button
              type="button"
              onClick={clearSelection}
              className="rounded-lg p-2 text-deep-sea-blue/60 hover:bg-deep-sea-blue/5"
              aria-label="Clear selected destination"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* HUMAN SHELTER DETAILS */}

          {selectedFacility.type === "shelter" && (
            <div className="mt-3 text-sm text-deep-sea-blue/75">
              Capacity: {selectedFacility.capacity ?? "Unknown"}
              {" · "}
              Available: {selectedFacility.availableCapacity ?? "Unknown"}
            </div>
          )}

          {/* FOOD DETAILS */}

          {selectedFacility.type === "food" &&
            selectedFacility.dryFoodStockKg !== null &&
            selectedFacility.dryFoodStockKg !== undefined && (
              <p className="mt-3 text-sm text-deep-sea-blue/75">
                Dry food stock: {selectedFacility.dryFoodStockKg} kg
              </p>
            )}

          {/* ANIMAL SHELTER DETAILS */}

          {selectedFacility.type === "animal" &&
            selectedFacility.animalTypes && (
              <p className="mt-3 text-sm text-deep-sea-blue/75">
                Animals: {selectedFacility.animalTypes.join(", ")}
              </p>
            )}

          {/* ROUTE LOADING */}

          {routeLoading && (
            <p className="mt-3 text-sm text-blue-700">
              Calculating driving route...
            </p>
          )}

          {/* ROUTE ERROR */}

          {routeError && (
            <p className="mt-3 text-sm text-red-700">{routeError}</p>
          )}

          {/* ROUTE INFORMATION */}

          {route && (
            <div className="mt-4 rounded-xl bg-blue-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-blue-900">
                <Route className="h-4 w-4" />
                Driving route
              </div>

              <div className="mt-2 flex flex-wrap gap-5 text-sm text-blue-900">
                <span>Distance: {route.distanceKm.toFixed(1)} km</span>

                <span>
                  Estimated time: {Math.round(route.durationMinutes)} minutes
                </span>
              </div>

              <p className="mt-2 text-xs text-blue-800/70">
                Route estimates are provided by the OSRM routing service. Actual
                travel time and road conditions may differ.
              </p>
            </div>
          )}
        </div>
      )}

      {/* DEMO DATA DISCLAIMER */}

      <div className="border-t border-deep-sea-blue/10 p-4 text-xs text-deep-sea-blue/50">
        Demo facility coordinates are illustrative and have not been verified.
        Do not rely on these locations for real emergency travel.
      </div>
    </section>
  );
}
