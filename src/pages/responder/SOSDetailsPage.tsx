import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  LoaderCircle,
  MapPin,
  Phone,
  User,
} from "lucide-react";

import { API_BASE_URL } from "../../lib/api";
import { getResponderSession } from "../../lib/responderAuth";
import { getAdminSession } from "../../lib/adminAuth";
import type { SOSRequest } from "../../types/sos";

function getSession() {
  return getResponderSession() ?? getAdminSession();
}

function getEmergencyTitle(type: SOSRequest["emergencyType"]) {
  const titles = {
    MEDICAL: "Medical Emergency",
    RESCUE: "Rescue Request",
    FLOOD_TRAPPED: "Person Trapped in Flood",
    FOOD_WATER: "Food / Water Assistance",
    ANIMAL_RESCUE: "Animal Rescue",
    OTHER: "Other Emergency",
  };

  return titles[type] ?? "Emergency Request";
}

function getStatusLabel(status: SOSRequest["status"]) {
  return status.replaceAll("_", " ");
}

export default function SOSDetailsPage() {
  const { id } = useParams();

  const [request, setRequest] = useState<SOSRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const session = getSession();
  const token = session?.token;

  useEffect(() => {
    const controller = new AbortController();

    const loadRequest = async () => {
      try {
        if (!id || !token) {
          throw new Error(
            "The request could not be found or your session has expired.",
          );
        }

        const response = await fetch(`${API_BASE_URL}/api/sos/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Could not load this SOS request.");
        }

        setRequest(result.data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadRequest();

    return () => controller.abort();
  }, [id, token]);

  async function handleNoted() {
    if (!id || !token || !request) return;

    setSaving(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/sos/${id}/acknowledge`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Could not acknowledge this request.",
        );
      }

      setRequest((current) =>
        current ? { ...current, status: "ACKNOWLEDGED" } : current,
      );
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-mint-cream px-4 py-8 text-deep-sea-blue sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/responder/sos"
          className="mb-6 inline-flex items-center gap-2 text-sm text-deep-sea-blue/65 transition hover:text-deep-sea-blue"
        >
          <ArrowLeft size={16} />
          Back to SOS inbox
        </Link>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-sm text-deep-sea-blue/60">
            <LoaderCircle size={20} className="animate-spin" />
            Loading request...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        ) : request ? (
          <>
            <header className="mb-6">
              <p className="text-sm font-medium text-deep-sea-blue/50">
                SOS REQUEST
              </p>
              <h1 className="mt-2 text-3xl font-bold">
                {getEmergencyTitle(request.emergencyType)}
              </h1>
              <p className="mt-2 text-sm text-deep-sea-blue/55">
                Received {new Date(request.createdAt).toLocaleString()}
              </p>
            </header>

            <section className="space-y-5 rounded-2xl border border-deep-sea-blue/10 bg-white p-5 shadow-sm sm:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-deep-sea-blue/45">
                  Status
                </p>
                <p className="mt-2 font-semibold">
                  {getStatusLabel(request.status)}
                </p>
              </div>

              <div className="border-t border-deep-sea-blue/10 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-deep-sea-blue/45">
                  Contact information
                </p>

                <div className="space-y-3">
                  <p className="flex items-center gap-3 text-sm">
                    <User
                      size={17}
                      className="shrink-0 text-deep-sea-blue/50"
                    />
                    {request.name || "Name not provided"}
                  </p>

                  <p className="flex items-center gap-3 text-sm">
                    <Phone
                      size={17}
                      className="shrink-0 text-deep-sea-blue/50"
                    />
                    {request.phone || "Phone number not provided"}
                  </p>
                </div>
              </div>

              <div className="border-t border-deep-sea-blue/10 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-deep-sea-blue/45">
                  Location
                </p>

                <div className="flex items-start gap-3 text-sm">
                  <MapPin
                    size={17}
                    className="mt-0.5 shrink-0 text-deep-sea-blue/50"
                  />
                  <div>
                    <p>{request.address || "Address not provided"}</p>
                    <p className="mt-1 text-deep-sea-blue/55">
                      District: {request.districtId || "Not provided"}
                    </p>
                    <p className="mt-1 text-deep-sea-blue/55">
                      Coordinates: {request.latitude}, {request.longitude}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-deep-sea-blue/10 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-deep-sea-blue/45">
                  Description
                </p>
                <p className="whitespace-pre-wrap text-sm leading-7">
                  {request.description || "No additional description provided."}
                </p>
              </div>

              {request.status === "PENDING" ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleNoted()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-deep-sea-blue px-5 py-3 font-semibold text-white transition hover:bg-deep-sea-blue/90 disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  Noted
                </button>
              ) : (
                <div className="rounded-xl bg-mint-cream px-4 py-3 text-center text-sm font-medium text-deep-sea-blue/60">
                  This request has been noted.
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
