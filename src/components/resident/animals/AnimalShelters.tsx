import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../lib/api";
import {
  PawPrint,
  MapPin,
  Users,
  Phone,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

interface AnimalShelterFacility {
  id: string;
  name: string;
  nameBn: string | null;
  available: boolean;
}

interface AnimalShelter {
  id: string;
  name: string;
  nameBn: string | null;
  address: string;
  districtId: string;
  latitude: number;
  longitude: number;
  capacity: number;
  occupancy: number | null;
  availableCapacity: number | null;
  animalTypes: string[];
  contactName: string | null;
  contactPhone: string | null;
  facilities: AnimalShelterFacility[];
}

interface AnimalSheltersResponse {
  success: boolean;
  count: number;
  data: AnimalShelter[];
  message?: string;
}

interface AnimalSheltersProps {
  districtId: string;
}

const animalTypeOptions = [
  { value: "", label: "All animals" },
  { value: "LIVESTOCK", label: "Livestock" },
  { value: "POULTRY", label: "Poultry" },
  { value: "PET", label: "Pets" },
  { value: "OTHER", label: "Other" },
];

const animalTypeLabels: Record<string, string> = {
  LIVESTOCK: "Livestock",
  POULTRY: "Poultry",
  PET: "Pets",
  OTHER: "Other animals",
};

function AnimalShelters({ districtId }: AnimalSheltersProps) {
  const [shelters, setShelters] = useState<AnimalShelter[]>([]);
  const [animalType, setAnimalType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAnimalShelters() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          districtId,
        });

        if (animalType) {
          params.set("animalType", animalType);
        }

        const response = await fetch(
          `${API_BASE_URL}/api/animal-shelters?${params.toString()}`,
          { signal: controller.signal },
        );

        const result: AnimalSheltersResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load animal shelters.");
        }

        setShelters(result.data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading animal shelters.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchAnimalShelters();

    return () => controller.abort();
  }, [districtId, animalType]);

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <PawPrint className="h-6 w-6 text-amethyst" />
            <h2 className="text-xl font-bold text-deep-sea-blue">
              Animal Shelters
            </h2>
          </div>

          <p className="mt-1 text-sm text-deep-sea-blue/65">
            Find safe places for your animals during disasters.
          </p>
        </div>

        {!loading && !error && (
          <span className="rounded-full bg-mint-cream px-3 py-1 text-sm font-semibold text-deep-sea-blue">
            {shelters.length} shelters
          </span>
        )}
      </div>

      {/* Animal type filter */}
      <div className="mb-5">
        <label
          htmlFor="animal-type-filter"
          className="mb-2 block text-sm font-semibold text-deep-sea-blue"
        >
          Find shelters for
        </label>

        <select
          id="animal-type-filter"
          value={animalType}
          onChange={(event) => setAnimalType(event.target.value)}
          className="w-full max-w-xs rounded-xl border border-deep-sea-blue/15 bg-white px-4 py-3 text-sm text-deep-sea-blue outline-none focus:border-amethyst"
        >
          {animalTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-deep-sea-blue">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <p className="font-medium">Loading animal shelters...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-white p-6">
          <div className="flex items-start gap-3 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="font-semibold">Unable to load animal shelters</h3>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        </div>
      ) : shelters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-deep-sea-blue/20 bg-white p-8 text-center">
          <PawPrint className="mx-auto h-9 w-9 text-deep-sea-blue/40" />

          <h3 className="mt-3 font-semibold text-deep-sea-blue">
            No animal shelters found
          </h3>

          <p className="mt-1 text-sm text-deep-sea-blue/60">
            No listed shelters match this animal type in the selected district.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {shelters.map((shelter) => (
            <article
              key={shelter.id}
              className="rounded-2xl border border-deep-sea-blue/10 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              {/* Shelter heading */}
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-mint-cream p-3">
                  <PawPrint className="h-6 w-6 text-deep-sea-blue" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-deep-sea-blue">
                    {shelter.name}
                  </h3>

                  {shelter.nameBn && (
                    <p className="mt-0.5 text-sm text-deep-sea-blue/65">
                      {shelter.nameBn}
                    </p>
                  )}

                  <div className="mt-2 flex items-start gap-1.5 text-sm text-deep-sea-blue/65">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{shelter.address}</span>
                  </div>
                </div>
              </div>

              {/* Supported animals */}
              <div className="mt-5">
                <h4 className="mb-2 text-sm font-semibold text-deep-sea-blue">
                  Animals supported
                </h4>

                <div className="flex flex-wrap gap-2">
                  {shelter.animalTypes.map((type) => (
                    <span
                      key={type}
                      className="rounded-full bg-mint-cream px-3 py-1 text-xs font-semibold text-deep-sea-blue"
                    >
                      {animalTypeLabels[type] ?? type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Capacity */}
              <div className="mt-5 rounded-xl bg-mint-cream p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-deep-sea-blue" />
                  <h4 className="text-sm font-semibold text-deep-sea-blue">
                    Shelter capacity
                  </h4>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-deep-sea-blue/60">
                      Total capacity
                    </p>
                    <p className="mt-1 text-lg font-bold text-deep-sea-blue">
                      {shelter.capacity}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-deep-sea-blue/60">
                      Available spaces
                    </p>
                    <p className="mt-1 text-lg font-bold text-amethyst">
                      {shelter.availableCapacity ?? "Unknown"}
                    </p>
                  </div>
                </div>

                {shelter.occupancy !== null && (
                  <p className="mt-3 text-xs text-deep-sea-blue/60">
                    Currently occupied: {shelter.occupancy}
                  </p>
                )}
              </div>

              {/* Facilities */}
              <div className="mt-5">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-deep-sea-blue">
                  <ShieldCheck className="h-4 w-4" />
                  Facilities
                </h4>

                {shelter.facilities.length === 0 ? (
                  <p className="text-sm text-deep-sea-blue/55">
                    No facilities listed.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {shelter.facilities.map((facility) => (
                      <div
                        key={facility.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <div>
                          <span className="text-deep-sea-blue">
                            {facility.name}
                          </span>

                          {facility.nameBn && (
                            <span className="ml-1 text-xs text-deep-sea-blue/55">
                              ({facility.nameBn})
                            </span>
                          )}
                        </div>

                        <span
                          className={
                            facility.available
                              ? "shrink-0 text-xs font-semibold text-green-700"
                              : "shrink-0 text-xs font-semibold text-red-600"
                          }
                        >
                          {facility.available ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact */}
              {(shelter.contactName || shelter.contactPhone) && (
                <div className="mt-5 border-t border-deep-sea-blue/10 pt-4">
                  <h4 className="mb-2 text-sm font-semibold text-deep-sea-blue">
                    Contact information
                  </h4>

                  {shelter.contactName && (
                    <p className="text-sm text-deep-sea-blue/70">
                      {shelter.contactName}
                    </p>
                  )}

                  {shelter.contactPhone && (
                    <a
                      href={`tel:${shelter.contactPhone}`}
                      className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-amethyst hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {shelter.contactPhone}
                    </a>
                  )}
                </div>
              )}

              {/* Coordinates */}
              <p className="mt-4 text-xs text-deep-sea-blue/50">
                Coordinates: {shelter.latitude}, {shelter.longitude}
              </p>
            </article>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-deep-sea-blue/50">
        Demo data: shelter locations, capacity, facilities, and contact
        information are illustrative and have not been verified. Confirm
        availability before travelling.
      </p>
    </section>
  );
}

export default AnimalShelters;
