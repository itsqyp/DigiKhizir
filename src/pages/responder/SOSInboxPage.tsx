import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  Trash2,
} from "lucide-react";

import { API_BASE_URL } from "../../lib/api";
import { getResponderSession } from "../../lib/responderAuth";
import { getAdminSession } from "../../lib/adminAuth";
import type { SOSListResponse, SOSRequest } from "../../types/sos";

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

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

export default function SOSInboxPage() {
  const [requests, setRequests] = useState<SOSRequest[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const session = getSession();
  const token = session?.token;
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    const controller = new AbortController();

    const loadRequests = async () => {
      try {
        if (!token) {
          throw new Error("Your session has expired. Please log in again.");
        }

        const response = await fetch(`${API_BASE_URL}/api/sos?page=${page}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const result = (await response.json()) as SOSListResponse;

        if (!response.ok || !result.success) {
          throw new Error("Could not load SOS requests.");
        }

        setRequests(result.data);
        setTotalPages(Math.max(1, result.totalPages));
        setError("");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading SOS requests.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadRequests();

    return () => controller.abort();
  }, [page, token]);

  async function handleNoted(id: string) {
    if (!token) return;

    setBusyId(id);

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
          result.message || "Could not mark this request as noted.",
        );
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === id ? { ...request, status: "ACKNOWLEDGED" } : request,
        ),
      );
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!token || !isAdmin) return;

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this SOS request?",
    );

    if (!confirmed) return;

    setBusyId(id);

    try {
      const response = await fetch(`${API_BASE_URL}/api/sos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not delete this request.");
      }

      if (requests.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        setRequests((current) =>
          current.filter((request) => request.id !== id),
        );
        setTotalPages((current) => Math.max(1, current));
      }
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-mint-cream px-4 py-8 text-deep-sea-blue sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <Link
            to={isAdmin ? "/admin" : "/responder/login"}
            className="mb-6 inline-flex items-center gap-2 text-sm text-deep-sea-blue/65 transition hover:text-deep-sea-blue"
          >
            <ArrowLeft size={16} />
            {isAdmin ? "Admin dashboard" : "Back"}
          </Link>

          <h1 className="text-3xl font-bold">SOS Inbox</h1>
          <p className="mt-2 text-sm text-deep-sea-blue/65">
            Emergency requests received from residents.
          </p>
        </header>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-deep-sea-blue/10 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-deep-sea-blue/10 px-5 py-4">
            <h2 className="font-semibold">Requests</h2>
            <span className="text-sm text-deep-sea-blue/55">
              Page {page} of {totalPages}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 px-5 py-16 text-sm text-deep-sea-blue/60">
              <LoaderCircle className="animate-spin" size={20} />
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="font-medium">No SOS requests found.</p>
              <p className="mt-2 text-sm text-deep-sea-blue/55">
                New requests will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-deep-sea-blue/10">
              {requests.map((request) => {
                const isNoted = request.status !== "PENDING";
                const isBusy = busyId === request.id;

                return (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 px-4 py-4 transition hover:bg-mint-cream/60 sm:px-5"
                  >
                    <Link
                      to={`/responder/sos/${request.id}`}
                      className="min-w-0 flex-1"
                    >
                      <p
                        className={`truncate font-semibold ${
                          isNoted
                            ? "text-deep-sea-blue/40 line-through"
                            : "text-deep-sea-blue"
                        }`}
                      >
                        {getEmergencyTitle(request.emergencyType)}
                      </p>

                      <p className="mt-1 truncate text-xs text-deep-sea-blue/55">
                        {request.districtId || "Unknown district"} ·{" "}
                        {formatDate(request.createdAt)}
                      </p>
                    </Link>

                    {!isNoted && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleNoted(request.id)}
                        className="shrink-0 rounded-lg border border-deep-sea-blue/15 px-3 py-2 text-xs font-medium transition hover:bg-mint-cream disabled:opacity-50"
                      >
                        {isBusy ? (
                          <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                          <span className="flex items-center gap-1">
                            <Check size={14} />
                            Noted
                          </span>
                        )}
                      </button>
                    )}

                    {isNoted && (
                      <span className="shrink-0 text-xs font-medium text-deep-sea-blue/45">
                        Noted
                      </span>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleDelete(request.id)}
                        title="Delete request"
                        className="shrink-0 rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-deep-sea-blue/10 px-5 py-4">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex items-center gap-2 rounded-lg border border-deep-sea-blue/15 px-3 py-2 text-sm transition hover:bg-mint-cream disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            <span className="text-sm text-deep-sea-blue/55">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              className="inline-flex items-center gap-2 rounded-lg border border-deep-sea-blue/15 px-3 py-2 text-sm transition hover:bg-mint-cream disabled:cursor-not-allowed disabled:opacity-35"
            >
              Next
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
