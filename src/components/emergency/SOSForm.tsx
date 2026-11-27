import { useState } from "react";
import { API_BASE_URL } from "../../lib/api";
import { useLanguage } from "../../context/useLanguage";
import { sosFormTranslations } from "../../translations/sosForm";

const emergencyTypes = [
  { value: "FLOOD_TRAPPED", icon: "🌊" },
  { value: "RESCUE", icon: "🆘" },
  { value: "MEDICAL", icon: "🚑" },
  { value: "FOOD_WATER", icon: "🍚" },
  { value: "ANIMAL_RESCUE", icon: "🐄" },
  { value: "OTHER", icon: "⚠️" },
] as const;

const districts = [
  "bhola",
  "patuakhali",
  "barguna",
  "noakhali",
  "lakshmipur",
  "satkhira",
  "khulna",
  "bagerhat",
  "coxsbazar",
  "chattogram",
  "feni",
  "barishal",
  "pirojpur",
  "jhalokati",
  "chandpur",
  "shariatpur",
  "gopalganj",
  "narail",
  "jashore",
] as const;

type EmergencyType = (typeof emergencyTypes)[number]["value"];

type LocationStatus =
  | "idle"
  | "detecting"
  | "unsupported"
  | "detected"
  | "denied";

export default function SOSForm() {
  const { language } = useLanguage();
  const t = sosFormTranslations[language];

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");

  const [emergencyType, setEmergencyType] = useState<EmergencyType | "">("");
  const [districtId, setDistrictId] = useState("");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const locationMessages: Record<LocationStatus, string> = {
    idle: t.locationNotDetected,
    detecting: t.detecting,
    unsupported: t.unsupported,
    detected: t.detected,
    denied: t.denied,
  };

  function detectLocation() {
    setError("");
    setLocationStatus("detecting");

    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setLocationStatus("detected");
      },
      () => {
        setLocation(null);
        setLocationStatus("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      },
    );
  }

  async function submitSOS(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!location) {
      setError(t.locationRequired);
      return;
    }

    if (!emergencyType) {
      setError(t.emergencyRequired);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/sos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          emergencyType,
          districtId: districtId || undefined,
          address: address.trim() || undefined,
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || t.submitError);
      }

      setSuccess(`${t.success} ${data.data.id}`);

      setEmergencyType("");
      setDistrictId("");
      setAddress("");
      setName("");
      setPhone("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
    } finally {
      setLoading(false);
    }
  }

  const inputClasses =
    "w-full rounded-xl border border-deep-sea-blue/20 bg-white px-4 py-3 text-deep-sea-blue placeholder:text-deep-sea-blue/40 outline-none transition focus:border-amethyst focus:ring-2 focus:ring-amethyst/20";

  return (
    <section className="mx-auto w-full max-w-xl rounded-3xl border border-deep-sea-blue/10 bg-mint-cream p-6 shadow-xl shadow-deep-sea-blue/10 sm:p-8">
      <div className="mb-7">
        <span className="inline-block rounded-full bg-cotton-candy/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-night-bordeaux">
          {t.badge}
        </span>

        <h1 className="mt-3 font-poppins text-3xl font-bold text-deep-sea-blue">
          {t.title}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-deep-sea-blue/70">
          {t.intro}
        </p>
      </div>

      {/* Location */}
      <div className="mb-7 rounded-2xl border border-deep-sea-blue/10 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-poppins font-semibold text-deep-sea-blue">
            {t.locationTitle}
          </h2>
          <span className="text-xl">📍</span>
        </div>

        <p className="mt-2 text-sm text-deep-sea-blue/60" role="status">
          {locationMessages[locationStatus]}
        </p>

        {location && (
          <p className="mt-3 rounded-lg bg-mint-cream p-3 text-xs text-deep-sea-blue/70">
            {t.latitude}: {location.latitude.toFixed(6)}
            <br />
            {t.longitude}: {location.longitude.toFixed(6)}
          </p>
        )}

        <button
          type="button"
          onClick={detectLocation}
          disabled={locationStatus === "detecting"}
          className="mt-4 w-full rounded-xl bg-deep-sea-blue px-4 py-3 font-semibold text-white transition hover:bg-deep-sea-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {locationStatus === "detecting"
            ? t.detecting
            : location
              ? t.refreshButton
              : t.detectButton}
        </button>
      </div>

      <form onSubmit={submitSOS} className="space-y-6">
        {/* Emergency type */}
        <div>
          <label className="mb-3 block font-poppins font-semibold text-deep-sea-blue">
            {t.emergencyQuestion}
          </label>

          <div className="grid grid-cols-2 gap-3">
            {emergencyTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                aria-pressed={emergencyType === type.value}
                onClick={() => setEmergencyType(type.value)}
                className={`rounded-2xl border p-4 text-left transition ${
                  emergencyType === type.value
                    ? "border-night-bordeaux bg-cotton-candy/30 ring-2 ring-cotton-candy"
                    : "border-deep-sea-blue/10 bg-white hover:border-amethyst/60"
                }`}
              >
                <span className="block text-2xl">{type.icon}</span>
                <span className="mt-2 block text-sm font-semibold text-deep-sea-blue">
                  {t.emergencyTypes[type.value]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* District */}
        <div>
          <label
            htmlFor="sos-district"
            className="mb-2 block text-sm font-semibold text-deep-sea-blue"
          >
            {t.districtLabel}
          </label>

          <select
            id="sos-district"
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
            className={inputClasses}
          >
            <option value="">{t.selectDistrict}</option>

            {districts.map((id) => (
              <option key={id} value={id}>
                {t.districts[id]}
              </option>
            ))}
          </select>
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="sos-address"
            className="mb-2 block text-sm font-semibold text-deep-sea-blue"
          >
            {t.addressLabel}
          </label>

          <textarea
            id="sos-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={300}
            rows={2}
            className={`${inputClasses} resize-none`}
            placeholder={t.addressPlaceholder}
          />
        </div>

        {/* Name */}
        <div>
          <label
            htmlFor="sos-name"
            className="mb-2 block text-sm font-semibold text-deep-sea-blue"
          >
            {t.nameLabel}
          </label>

          <input
            id="sos-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className={inputClasses}
            placeholder={t.namePlaceholder}
          />
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="sos-phone"
            className="mb-2 block text-sm font-semibold text-deep-sea-blue"
          >
            {t.phoneLabel}
          </label>

          <input
            id="sos-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
            className={inputClasses}
            placeholder={t.phonePlaceholder}
          />
        </div>

        {/* Additional details */}
        <div>
          <label
            htmlFor="sos-description"
            className="mb-2 block text-sm font-semibold text-deep-sea-blue"
          >
            {t.detailsLabel}
          </label>

          <textarea
            id="sos-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={4}
            className={`${inputClasses} resize-none`}
            placeholder={t.detailsPlaceholder}
          />
        </div>

        {/* Error */}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-cotton-candy/30 p-4 text-sm font-medium text-night-bordeaux"
          >
            {error}
          </p>
        )}

        {/* Success */}
        {success && (
          <p
            role="status"
            className="break-words rounded-xl border border-deep-sea-blue/10 bg-white p-4 text-sm font-medium text-deep-sea-blue"
          >
            {success}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-night-bordeaux px-4 py-4 font-poppins text-lg font-bold text-white shadow-lg shadow-night-bordeaux/20 transition hover:bg-night-bordeaux/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t.sending : t.sendButton}
        </button>

        <p className="text-center text-xs leading-relaxed text-deep-sea-blue/60">
          {t.disclaimer}
        </p>
      </form>
    </section>
  );
}
