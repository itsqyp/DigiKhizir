import { useEffect, useState } from "react";
import { ShieldAlert, CalendarDays, ExternalLink } from "lucide-react";
import { API_BASE_URL } from "../../../lib/api";

interface DisasterAlert {
  id: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  source: string | null;
  sourceUrl: string | null;
  issuedAt: string;
  expiresAt: string | null;
  districtIds: string[];
}

interface AlertsResponse {
  success: boolean;
  count: number;
  data: DisasterAlert[];
  message?: string;
}

interface DisasterAlertsProps {
  districtId: string;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getSeverityStyle(severity: string) {
  switch (severity.toUpperCase()) {
    case "CRITICAL":
      return "bg-red-100 text-red-800";

    case "HIGH":
      return "bg-orange-100 text-orange-800";

    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800";

    case "LOW":
      return "bg-green-100 text-green-800";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function DisasterAlerts({ districtId }: DisasterAlertsProps) {
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAlerts() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/alerts?districtId=${encodeURIComponent(districtId)}`,
          { signal: controller.signal },
        );

        const result: AlertsResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to retrieve disaster alerts.",
          );
        }

        setAlerts(result.data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading alerts.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchAlerts();

    return () => controller.abort();
  }, [districtId]);

  return (
    <section className="mt-8 rounded-3xl border border-deep-sea-blue/10 bg-white p-6 shadow-lg shadow-deep-sea-blue/5 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-cotton-candy/30 p-3 text-night-bordeaux">
          <ShieldAlert size={24} />
        </div>

        <div>
          <h2 className="font-poppins text-xl font-bold text-deep-sea-blue">
            Disaster alerts
          </h2>
          <p className="text-sm text-deep-sea-blue/60">
            Active warnings for your selected district.
          </p>
        </div>
      </div>

      {loading && (
        <div className="mt-6 rounded-xl bg-mint-cream p-5 text-center text-sm text-deep-sea-blue/70">
          Loading disaster alerts...
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && alerts.length === 0 && (
        <div className="mt-6 rounded-xl bg-mint-cream p-6 text-center">
          <ShieldAlert size={32} className="mx-auto text-deep-sea-blue/40" />

          <h3 className="mt-3 font-semibold text-deep-sea-blue">
            No active alerts
          </h3>

          <p className="mt-1 text-sm text-deep-sea-blue/60">
            There are currently no active disaster alerts for this district.
          </p>
        </div>
      )}

      {!loading && !error && alerts.length > 0 && (
        <div className="mt-6 space-y-4">
          {alerts.map((alert) => (
            <article
              key={alert.id}
              className="rounded-2xl border border-deep-sea-blue/10 p-5 transition hover:border-amethyst/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-poppins text-lg font-bold text-deep-sea-blue">
                  {alert.title}
                </h3>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${getSeverityStyle(alert.severity)}`}
                >
                  {alert.severity}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-deep-sea-blue/80">
                {alert.message}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-deep-sea-blue/10 pt-4">
                <div className="flex items-center gap-2 text-xs text-deep-sea-blue/60">
                  <CalendarDays size={15} />
                  Issued: {formatDate(alert.issuedAt)}
                </div>

                {alert.source && (
                  <span className="text-xs text-deep-sea-blue/60">
                    Source: {alert.source}
                  </span>
                )}
              </div>

              {alert.expiresAt && (
                <p className="mt-2 text-xs text-deep-sea-blue/50">
                  Expires: {formatDate(alert.expiresAt)}
                </p>
              )}

              {alert.sourceUrl && (
                <a
                  href={alert.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amethyst hover:underline"
                >
                  View original source
                  <ExternalLink size={15} />
                </a>
              )}
            </article>
          ))}
        </div>
      )}

      <p className="mt-5 text-xs text-deep-sea-blue/50">
        Only active, non-expired alerts returned by the server are displayed.
        Follow verified official instructions during emergencies.
      </p>
    </section>
  );
}
