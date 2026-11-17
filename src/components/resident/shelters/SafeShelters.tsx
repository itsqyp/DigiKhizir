import { useEffect, useState } from "react";
import { Home, MapPin, Users, CheckCircle2, Navigation } from "lucide-react";
import { API_BASE_URL } from "../../../lib/api";

interface ShelterFacility {
  id: string;
  name: string;
  nameBn: string | null;
  available: boolean;
}

interface Shelter {
  id: string;
  name: string;
  nameBn: string | null;
  address: string;
  districtId: string;
  latitude: number;
  longitude: number;
  capacity: number;
  occupancy: number | null;
  capacityRemaining: number | null;
  distanceKm?: number;
  facilities: ShelterFacility[];
}

interface SheltersResponse {
  success: boolean;
  count: number;
  sortBy: string;
  data: Shelter[];
  message?: string;
}

interface SafeSheltersProps {
  districtId: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
}

export default function SafeShelters({
  districtId,
  coordinates,
}: SafeSheltersProps) {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchShelters() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          districtId,
          limit: "20",
        });

        if (coordinates) {
          params.set("latitude", String(coordinates.latitude));
          params.set("longitude", String(coordinates.longitude));
        }

        const response = await fetch(
          `${API_BASE_URL}/api/shelters?${params.toString()}`,
          { signal: controller.signal },
        );

        const result: SheltersResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to retrieve shelters.");
        }

        setShelters(result.data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading shelters.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchShelters();

    return () => controller.abort();
  }, [districtId, coordinates]);

  return (
    <section className="mt-8 rounded-3xl border border-deep-sea-blue/10 bg-white p-6 shadow-lg shadow-deep-sea-blue/5 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-amethyst/10 p-3 text-amethyst">
          <Home size={24} />
        </div>

        <div>
          <h2 className="font-poppins text-xl font-bold text-deep-sea-blue">
            Safe shelters
          </h2>

          <p className="text-sm text-deep-sea-blue/60">
            Human shelters available in your selected district.
          </p>
        </div>
      </div>

      {coordinates && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-mint-cream p-3 text-xs text-deep-sea-blue/70">
          <Navigation size={15} />
          Shelters are sorted by distance from your GPS location.
        </div>
      )}

      {loading && (
        <div className="mt-6 rounded-xl bg-mint-cream p-5 text-center text-sm text-deep-sea-blue/70">
          Finding safe shelters...
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && shelters.length === 0 && (
        <div className="mt-6 rounded-xl bg-mint-cream p-6 text-center">
          <Home size={32} className="mx-auto text-deep-sea-blue/40" />

          <h3 className="mt-3 font-semibold text-deep-sea-blue">
            No shelters found
          </h3>

          <p className="mt-1 text-sm text-deep-sea-blue/60">
            No active shelters were found for this district.
          </p>
        </div>
      )}

      {!loading && !error && shelters.length > 0 && (
        <div className="mt-6 space-y-4">
          {shelters.map((shelter) => {
            const availableFacilities = shelter.facilities.filter(
              (facility) => facility.available,
            );

            return (
              <article
                key={shelter.id}
                className="rounded-2xl border border-deep-sea-blue/10 p-5 transition hover:border-amethyst/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-poppins text-lg font-bold text-deep-sea-blue">
                      {shelter.name}
                    </h3>

                    {shelter.nameBn && (
                      <p className="mt-1 text-sm text-deep-sea-blue/60">
                        {shelter.nameBn}
                      </p>
                    )}
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                    Active
                  </span>
                </div>

                <div className="mt-4 flex items-start gap-2 text-sm text-deep-sea-blue/70">
                  <MapPin size={17} className="mt-0.5 shrink-0" />
                  <span>{shelter.address}</span>
                </div>

                {shelter.distanceKm !== undefined && (
                  <p className="mt-2 text-sm font-semibold text-amethyst">
                    {shelter.distanceKm} km away
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-mint-cream p-4">
                    <div className="flex items-center gap-2 text-deep-sea-blue/60">
                      <Users size={17} />
                      <span className="text-xs">Total capacity</span>
                    </div>

                    <p className="mt-2 text-xl font-bold text-deep-sea-blue">
                      {shelter.capacity}
                    </p>
                  </div>

                  <div className="rounded-xl bg-mint-cream p-4">
                    <div className="flex items-center gap-2 text-deep-sea-blue/60">
                      <Home size={17} />
                      <span className="text-xs">Remaining capacity</span>
                    </div>

                    <p className="mt-2 text-xl font-bold text-deep-sea-blue">
                      {shelter.capacityRemaining ?? "Unknown"}
                    </p>
                  </div>
                </div>

                {shelter.occupancy !== null && (
                  <p className="mt-3 text-xs text-deep-sea-blue/60">
                    Current occupancy: {shelter.occupancy} people
                  </p>
                )}

                <div className="mt-5 border-t border-deep-sea-blue/10 pt-4">
                  <h4 className="text-sm font-semibold text-deep-sea-blue">
                    Available facilities
                  </h4>

                  {availableFacilities.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {availableFacilities.map((facility) => (
                        <span
                          key={facility.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-800"
                        >
                          <CheckCircle2 size={13} />
                          {facility.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-deep-sea-blue/50">
                      No facility information is currently available.
                    </p>
                  )}
                </div>

                <p className="mt-4 text-xs text-deep-sea-blue/50">
                  Coordinates: {shelter.latitude.toFixed(5)},{" "}
                  {shelter.longitude.toFixed(5)}
                </p>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-5 text-xs text-deep-sea-blue/50">
        Shelter information is provided by the server. Confirm actual
        availability before travelling.
      </p>
    </section>
  );
}
