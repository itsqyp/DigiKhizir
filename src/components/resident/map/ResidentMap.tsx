import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { MapCoordinates } from "./mapTypes";

// Fix default Leaflet marker icons in Vite.

const userLocationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #2563eb;
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.2);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface ResidentMapProps {
  userLocation: MapCoordinates;
}

// Automatically move the map when the user's location changes.

function MapController({ userLocation }: ResidentMapProps) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([userLocation.latitude, userLocation.longitude], 14, {
      duration: 1.2,
    });
  }, [map, userLocation]);

  return null;
}

export default function ResidentMap({ userLocation }: ResidentMapProps) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-deep-sea-blue/10 bg-white shadow-lg">
      <div className="border-b border-deep-sea-blue/10 p-4">
        <h2 className="text-lg font-bold text-deep-sea-blue">Your Location</h2>

        <p className="mt-1 text-sm text-deep-sea-blue/60">
          Explore nearby emergency facilities.
        </p>
      </div>

      <MapContainer
        center={[userLocation.latitude, userLocation.longitude]}
        zoom={14}
        scrollWheelZoom
        className="h-[450px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController userLocation={userLocation} />

        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={userLocationIcon}
        >
          <Popup>
            <strong>You are here</strong>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
