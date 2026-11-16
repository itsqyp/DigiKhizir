import { useState } from "react";
import { API_BASE_URL } from "../../lib/api";
const emergencyTypes = [
  { value: "FLOOD_TRAPPED", label: "Trapped in flood", icon: "🌊" },
  { value: "RESCUE", label: "Need rescue", icon: "🆘" },
  { value: "MEDICAL", label: "Medical emergency", icon: "🚑" },
  { value: "FOOD_WATER", label: "Need food or water", icon: "🍚" },
  { value: "ANIMAL_RESCUE", label: "Animal rescue", icon: "🐄" },
  { value: "OTHER", label: "Other emergency", icon: "⚠️" },
] as const;

type EmergencyType = (typeof emergencyTypes)[number]["value"];

export default function SOSForm() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [locationStatus, setLocationStatus] = useState(
    "Location has not been detected.",
  );

  const [emergencyType, setEmergencyType] = useState<EmergencyType | "">("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function detectLocation() {
    setError("");
    setLocationStatus("Detecting your location...");

    if (!navigator.geolocation) {
      setLocationStatus("Location is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus("Your location has been detected.");
      },
      () => {
        setLocation(null);
        setLocationStatus(
          "Unable to access your location. Please allow location permission.",
        );
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
      setError("Please detect your location before submitting an SOS.");
      return;
    }

    if (!emergencyType) {
      setError("Please select an emergency type.");
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
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to submit your SOS.");
      }

      setSuccess(
        `Your emergency request was received. Reference ID: ${data.data.id}`,
      );

      setEmergencyType("");
      setName("");
      setPhone("");
      setDescription("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
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
          Emergency assistance
        </span>

        <h1 className="mt-3 font-poppins text-3xl font-bold text-deep-sea-blue">
          Emergency SOS
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-deep-sea-blue/70">
          Send an emergency request to the response team. You do not need an
          account.
        </p>
      </div>

      <div className="mb-7 rounded-2xl border border-deep-sea-blue/10 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-poppins font-semibold text-deep-sea-blue">
            Your location
          </h2>
          <span className="text-xl">📍</span>
        </div>

        <p className="mt-2 text-sm text-deep-sea-blue/60">{locationStatus}</p>

        {location && (
          <p className="mt-3 rounded-lg bg-mint-cream p-3 text-xs text-deep-sea-blue/70">
            Latitude: {location.latitude.toFixed(6)}
            <br />
            Longitude: {location.longitude.toFixed(6)}
          </p>
        )}

        <button
          type="button"
          onClick={detectLocation}
          className="mt-4 w-full rounded-xl bg-deep-sea-blue px-4 py-3 font-semibold text-white transition hover:bg-deep-sea-blue/90"
        >
          {location ? "Refresh my location" : "Detect my location"}
        </button>
      </div>

      <form onSubmit={submitSOS} className="space-y-6">
        <div>
          <label className="mb-3 block font-poppins font-semibold text-deep-sea-blue">
            What happened?
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
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-deep-sea-blue">
            Your name (optional)
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className={inputClasses}
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-deep-sea-blue">
            Phone number (optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
            className={inputClasses}
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-deep-sea-blue">
            Additional details (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={4}
            className={`${inputClasses} resize-none`}
            placeholder="Describe your emergency..."
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-cotton-candy/30 p-4 text-sm font-medium text-night-bordeaux"
          >
            {error}
          </p>
        )}

        {success && (
          <p
            role="status"
            className="break-words rounded-xl border border-deep-sea-blue/10 bg-white p-4 text-sm font-medium text-deep-sea-blue"
          >
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-night-bordeaux px-4 py-4 font-poppins text-lg font-bold text-white shadow-lg shadow-night-bordeaux/20 transition hover:bg-night-bordeaux/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending emergency request..." : "SEND SOS"}
        </button>

        <p className="text-center text-xs leading-relaxed text-deep-sea-blue/60">
          Your request is sent to the server. This does not automatically mean
          that rescue has been dispatched.
        </p>
      </form>
    </section>
  );
}
