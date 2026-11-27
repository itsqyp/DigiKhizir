import { useState } from "react";
import { Link } from "react-router-dom";

import DisasterAlerts from "../../components/resident/alerts/DisasterAlerts";
import SafeShelters from "../../components/resident/shelters/SafeShelters";
import FoodRelief from "../../components/resident/food/FoodRelief";
import AnimalShelters from "../../components/resident/animals/AnimalShelters";
import ResidentMap from "../../components/resident/map/ResidentMap";
import LanguageToggle from "../../components/LanguageToggle";

import { useLanguage } from "../../context/useLanguage";
import {
  residentHomeTranslations,
  districtTranslations,
} from "../../translations/residentHome";

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
] as const;

const features = [
  {
    id: "alerts",
    icon: ShieldAlert,
  },
  {
    id: "shelters",
    icon: Home,
  },
  {
    id: "food",
    icon: Package,
  },
  {
    id: "animals",
    icon: HeartHandshake,
  },
] as const;

type LocationStatus =
  | "idle"
  | "detecting"
  | "success"
  | "unsupported"
  | "denied";

export default function ResidentHomePage() {
  const { language } = useLanguage();
  const t = residentHomeTranslations[language];

  const [districtId, setDistrictId] = useState("");

  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");

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
      setLocationStatus("unsupported");
      return;
    }

    setLocationStatus("detecting");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setLocationStatus("success");
      },
      () => {
        setCoordinates(null);
        setLocationStatus("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      },
    );
  }

  const selectedDistrict = districts.find(
    (district) => district.id === districtId,
  );

  return (
    <main className="min-h-screen bg-mint-cream px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold uppercase tracking-widest text-amethyst">
              DigiKhizir
            </p>

            <h1 className="mt-2 font-poppins text-3xl font-bold text-deep-sea-blue sm:text-4xl">
              {t.dashboard}
            </h1>

            <p className="mt-3 text-deep-sea-blue/70">{t.subtitle}</p>
          </div>

          <LanguageToggle />
        </header>

        {/* Location section */}
        <section className="rounded-3xl border border-deep-sea-blue/10 bg-white p-6 shadow-lg shadow-deep-sea-blue/5 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cotton-candy/30 p-3 text-night-bordeaux">
              <MapPin size={24} />
            </div>

            <div>
              <h2 className="font-poppins text-xl font-bold text-deep-sea-blue">
                {t.location}
              </h2>

              <p className="text-sm text-deep-sea-blue/60">
                {t.locationDescription}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-mint-cream p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-deep-sea-blue">
              <Navigation size={17} />
              {t.locationStatus[locationStatus]}
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
              {coordinates ? t.refreshLocation : t.detectLocation}
            </span>
          </button>

          {coordinates && districtId && (
            <ResidentMap
              userLocation={coordinates}
              districtId={districtId}
              selectedFeatures={selectedFeatures}
            />
          )}

          <label
            htmlFor="district"
            className="mt-6 block text-sm font-semibold text-deep-sea-blue"
          >
            {t.selectDistrict}
          </label>

          <select
            id="district"
            value={districtId}
            onChange={(event) => setDistrictId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-deep-sea-blue/20 bg-white px-4 py-3 text-deep-sea-blue outline-none focus:border-amethyst focus:ring-2 focus:ring-amethyst/20"
          >
            <option value="">{t.chooseDistrict}</option>

            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {language === "bn"
                  ? districtTranslations[district.id]
                  : district.name}
              </option>
            ))}
          </select>

          {selectedDistrict && (
            <p className="mt-3 text-sm font-medium text-deep-sea-blue">
              {t.selectedDistrict}{" "}
              {language === "bn"
                ? districtTranslations[selectedDistrict.id]
                : selectedDistrict.name}
            </p>
          )}
        </section>

        {/* Selectable features */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="font-poppins text-xl font-bold text-deep-sea-blue">
              {t.servicesHeading}
            </h2>

            <p className="mt-1 text-sm text-deep-sea-blue/60">
              {t.servicesDescription}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              const isSelected = selectedFeatures.includes(feature.id);
              const featureText = t.features[feature.id];

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
                    {featureText.title}
                  </h3>

                  <p className="mt-2 text-sm text-deep-sea-blue/70">
                    {featureText.description}
                  </p>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-deep-sea-blue/60">
            {selectedFeatures.length === 0
              ? t.noServices
              : `${selectedFeatures.length} ${
                  language === "bn"
                    ? t.serviceSelected
                    : selectedFeatures.length > 1
                      ? t.servicesSelected
                      : t.serviceSelected
                }`}
          </p>
        </section>

        {/* Disaster alerts */}
        {selectedFeatures.includes("alerts") &&
          (districtId ? (
            <DisasterAlerts key={districtId} districtId={districtId} />
          ) : (
            <div className="mt-6 rounded-xl bg-white p-5 text-center text-sm text-deep-sea-blue/70">
              {t.prompts.alerts}
            </div>
          ))}

        {/* Safe shelters */}
        {selectedFeatures.includes("shelters") &&
          (districtId ? (
            <SafeShelters districtId={districtId} coordinates={coordinates} />
          ) : (
            <div className="mt-6 rounded-xl bg-white p-5 text-center text-sm text-deep-sea-blue/70">
              {t.prompts.shelters}
            </div>
          ))}

        {/* Food and relief */}
        {selectedFeatures.includes("food") &&
          (districtId ? (
            <FoodRelief key={districtId} districtId={districtId} />
          ) : (
            <div className="mt-6 rounded-xl bg-white p-5 text-center text-sm text-deep-sea-blue/70">
              {t.prompts.food}
            </div>
          ))}

        {/* Animal shelters */}
        {selectedFeatures.includes("animals") &&
          (districtId ? (
            <AnimalShelters key={districtId} districtId={districtId} />
          ) : (
            <div className="mt-6 rounded-xl bg-white p-5 text-center text-sm text-deep-sea-blue/70">
              {t.prompts.animals}
            </div>
          ))}

        {/* Emergency SOS */}
        <section className="mt-8 rounded-3xl bg-night-bordeaux p-6 text-white sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-poppins text-2xl font-bold">
                {t.emergencyHeading}
              </h2>

              <p className="mt-2 text-sm text-white/75">
                {t.emergencyDescription}
              </p>
            </div>

            <Link
              to="/sos"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-cotton-candy px-6 py-3 font-bold text-night-bordeaux transition hover:brightness-105"
            >
              {t.sendSOS}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
