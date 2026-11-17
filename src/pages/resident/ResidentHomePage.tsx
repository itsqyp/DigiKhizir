import { useState } from "react";
import { Link } from "react-router-dom";
import DisasterAlerts from "../../components/resident/alerts/DisasterAlerts";
import SafeShelters from "../../components/resident/shelters/SafeShelters";
import FoodRelief from "../../components/resident/food/FoodRelief";
import AnimalShelters from "../../components/resident/animals/AnimalShelters";
import ResidentMap from "../../components/resident/map/ResidentMap";
import {
  MapPin,
  Navigation,
  ShieldAlert,
  HeartHandshake,
  Home,
  Package,
} from "lucide-react";

const districts = [
  { id: "bhola", name: "Bhola" },
  { id: "patuakhali", name: "Patuakhali" },
  { id: "barguna", name: "Barguna" },
  { id: "noakhali", name: "Noakhali" },
  { id: "lakshmipur", name: "Lakshmipur" },
  { id: "satkhira", name: "Satkhira" },
  { id: "khulna", name: "Khulna" },
  { id: "bagerhat", name: "Bagerhat" },
  { id: "coxsbazar", name: "Cox's Bazar" },
  { id: "chattogram", name: "Chattogram" },
  { id: "feni", name: "Feni" },
  { id: "barishal", name: "Barishal" },
  { id: "pirojpur", name: "Pirojpur" },
  { id: "jhalokati", name: "Jhalokati" },
  { id: "chandpur", name: "Chandpur" },
  { id: "shariatpur", name: "Shariatpur" },
  { id: "gopalganj", name: "Gopalganj" },
  { id: "narail", name: "Narail" },
  { id: "jashore", name: "Jashore" },
];

const features = [
  {
    id: "alerts",
    title: "Disaster alerts",
    description: "Stay updated about active disaster warnings in your area.",
    icon: ShieldAlert,
  },
  {
    id: "shelters",
    title: "Safe shelters",
    description: "Find nearby human shelters and their available facilities.",
    icon: Home,
  },
  {
    id: "food",
    title: "Food & relief",
    description: "Find food distribution points and essential supplies.",
    icon: Package,
  },
  {
    id: "animals",
    title: "Animal shelters",
    description: "Find safe places for livestock and pets.",
    icon: HeartHandshake,
  },
];

export default function ResidentHomePage() {
  const [districtId, setDistrictId] = useState("");

  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [locationStatus, setLocationStatus] = useState(
    "Your location has not been detected yet.",
  );

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  function toggleFeature(feature: string) {
    setSelectedFeatures((previous) =>
      previous.includes(feature)
        ? previous.filter((item) => item !== feature)
        : [...previous, feature],
    );
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("GPS is not supported by this browser.");
      return;
    }

    setLocationStatus("Detecting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setLocationStatus("Your GPS location was detected.");
      },
      () => {
        setCoordinates(null);
        setLocationStatus(
          "Location permission was not granted. Please select your district manually.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      },
    );
  }

  return (
    <main className="min-h-screen bg-mint-cream px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <p className="font-semibold uppercase tracking-widest text-amethyst">
            DigiKhizir
          </p>

          <h1 className="mt-2 font-poppins text-3xl font-bold text-deep-sea-blue sm:text-4xl">
            Your safety dashboard
          </h1>

          <p className="mt-3 text-deep-sea-blue/70">
            Find safety, stay informed, and get help when you need it.
          </p>
        </header>

        {/* Location section */}
        <section className="rounded-3xl border border-deep-sea-blue/10 bg-white p-6 shadow-lg shadow-deep-sea-blue/5 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cotton-candy/30 p-3 text-night-bordeaux">
              <MapPin size={24} />
            </div>

            <div>
              <h2 className="font-poppins text-xl font-bold text-deep-sea-blue">
                Your location
              </h2>

              <p className="text-sm text-deep-sea-blue/60">
                Choose your district to find relevant services.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-mint-cream p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-deep-sea-blue">
              <Navigation size={17} />
              {locationStatus}
            </div>

            {coordinates && (
              <p className="mt-2 text-xs text-deep-sea-blue/60">
                GPS: {coordinates.latitude.toFixed(5)},{" "}
                {coordinates.longitude.toFixed(5)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={detectLocation}
            className="mt-4 w-full rounded-xl bg-deep-sea-blue px-4 py-3 font-semibold text-white transition hover:bg-deep-sea-blue/90"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Navigation size={18} />
              {coordinates ? "Refresh my location" : "Detect my location"}
            </span>
          </button>

          {coordinates && <ResidentMap userLocation={coordinates} />}

          <label
            htmlFor="district"
            className="mt-6 block text-sm font-semibold text-deep-sea-blue"
          >
            Select your district
          </label>

          <select
            id="district"
            value={districtId}
            onChange={(event) => setDistrictId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-deep-sea-blue/20 bg-white px-4 py-3 text-deep-sea-blue outline-none focus:border-amethyst focus:ring-2 focus:ring-amethyst/20"
          >
            <option value="">Choose your district</option>

            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>

          {districtId && (
            <p className="mt-3 text-sm font-medium text-deep-sea-blue">
              Selected district:{" "}
              {districts.find((district) => district.id === districtId)?.name}
            </p>
          )}
        </section>

        {/* Selectable features */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="font-poppins text-xl font-bold text-deep-sea-blue">
              What are you looking for?
            </h2>

            <p className="mt-1 text-sm text-deep-sea-blue/60">
              Select one or more services you want to explore.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              const isSelected = selectedFeatures.includes(feature.id);

              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => toggleFeature(feature.id)}
                  aria-pressed={isSelected}
                  className={`relative rounded-2xl border p-6 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-amethyst bg-amethyst/10 shadow-md shadow-amethyst/10"
                      : "border-deep-sea-blue/10 bg-white hover:border-amethyst/50 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <Icon
                      size={28}
                      className={
                        isSelected ? "text-amethyst" : "text-deep-sea-blue"
                      }
                    />

                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${
                        isSelected
                          ? "border-amethyst bg-amethyst text-white"
                          : "border-deep-sea-blue/20 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </div>

                  <h3 className="mt-4 font-poppins text-xl font-bold text-deep-sea-blue">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm text-deep-sea-blue/70">
                    {feature.description}
                  </p>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-deep-sea-blue/60">
            {selectedFeatures.length === 0
              ? "No services selected yet."
              : `${selectedFeatures.length} service${
                  selectedFeatures.length > 1 ? "s" : ""
                } selected.`}
          </p>
        </section>

        {selectedFeatures.includes("alerts") &&
          (districtId ? (
            <DisasterAlerts key={districtId} districtId={districtId} />
          ) : (
            <div className="mt-6 rounded-xl bg-white p-5 text-center text-sm text-deep-sea-blue/70">
              Please select your district to view disaster alerts.
            </div>
          ))}

        {selectedFeatures.includes("shelters") &&
          (districtId ? (
            <SafeShelters districtId={districtId} coordinates={coordinates} />
          ) : (
            <div className="mt-6 rounded-xl bg-white p-5 text-center text-sm text-deep-sea-blue/70">
              Please select your district to find safe shelters.
            </div>
          ))}

        {selectedFeatures.includes("food") &&
          (districtId ? (
            <FoodRelief key={districtId} districtId={districtId} />
          ) : (
            <div className="mt-6 rounded-xl bg-white p-5 text-center text-sm text-deep-sea-blue/70">
              Please select your district to view food and relief locations.
            </div>
          ))}
        {selectedFeatures.includes("animals") &&
          (districtId ? (
            <AnimalShelters key={districtId} districtId={districtId} />
          ) : (
            <div className="mt-6 rounded-xl bg-white p-5 text-center text-sm text-deep-sea-blue/70">
              Please select your district to find animal shelters.
            </div>
          ))}

        {/* Emergency SOS */}
        <section className="mt-8 rounded-3xl bg-night-bordeaux p-6 text-white sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-poppins text-2xl font-bold">
                Need emergency help?
              </h2>

              <p className="mt-2 text-sm text-white/75">
                Send your location and emergency request without creating an
                account.
              </p>
            </div>

            <Link
              to="/sos"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-cotton-candy px-6 py-3 font-bold text-night-bordeaux transition hover:brightness-105"
            >
              Send SOS
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
