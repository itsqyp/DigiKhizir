import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  X,
  BellRing,
  MapPin,
  CalendarDays,
  ExternalLink,
  AlertTriangle,
  Info,
  ShieldAlert,
  Save,
} from "lucide-react";

import { API_BASE_URL } from "../../../lib/api";
import { clearAdminSession, getAdminSession } from "../../../lib/adminAuth";

type AlertSeverity = "INFO" | "ADVISORY" | "WATCH" | "WARNING" | "DANGER";
type AlertStatus = "DRAFT" | "ACTIVE" | "EXPIRED" | "CANCELLED";
type StatusFilter = "all" | AlertStatus;

interface DisasterAlert {
  id: string;
  title: string;
  titleBn: string | null;
  message: string;
  messageBn: string | null;
  severity: AlertSeverity;
  status: AlertStatus;
  districtIds: string[];
  source: string | null;
  sourceUrl: string | null;
  issuedAt: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AlertFormData {
  title: string;
  titleBn: string;
  message: string;
  messageBn: string;
  severity: AlertSeverity;
  status: AlertStatus;
  districtIds: string[];
  source: string;
  sourceUrl: string;
  issuedAt: string;
  expiresAt: string;
}

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

const severityOptions: { value: AlertSeverity; label: string }[] = [
  { value: "INFO", label: "Information" },
  { value: "ADVISORY", label: "Advisory" },
  { value: "WATCH", label: "Watch" },
  { value: "WARNING", label: "Warning" },
  { value: "DANGER", label: "Danger" },
];

const statusOptions: { value: AlertStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELLED", label: "Cancelled" },
];

const inputClass =
  "w-full rounded-xl border border-deep-sea-blue/15 bg-white px-3.5 py-2.5 text-sm text-deep-sea-blue outline-none transition focus:border-amethyst focus:ring-2 focus:ring-amethyst/15";

const labelClass = "mb-1.5 block text-sm font-medium text-deep-sea-blue";

function toLocalDateTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function emptyForm(): AlertFormData {
  return {
    title: "",
    titleBn: "",
    message: "",
    messageBn: "",
    severity: "ADVISORY",
    status: "DRAFT",
    districtIds: [],
    source: "",
    sourceUrl: "",
    issuedAt: toLocalDateTime(new Date().toISOString()),
    expiresAt: "",
  };
}

export default function DisasterAlertsSection() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [districtFilter, setDistrictFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<DisasterAlert | null>(null);
  const [form, setForm] = useState<AlertFormData>(emptyForm());

  const getHeaders = () => {
    const session = getAdminSession();

    if (!session) {
      clearAdminSession();
      navigate("/admin/login");
      return null;
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
    };
  };

  // Load alerts whenever the filters change.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchAlerts() {
      const session = getAdminSession();

      if (!session) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      try {
        const params = new URLSearchParams();

        params.set("status", statusFilter);

        if (districtFilter) params.set("districtId", districtFilter);
        if (severityFilter) params.set("severity", severityFilter);

        const response = await fetch(
          `${API_BASE_URL}/api/admin/alerts?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${session.token}`,
            },
            signal: controller.signal,
          },
        );

        if (response.status === 401) {
          clearAdminSession();
          navigate("/admin/login");
          return;
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load disaster alerts.");
        }

        if (!controller.signal.aborted) {
          setAlerts(result.data as DisasterAlert[]);
          setError("");
        }
      } catch (err) {
        if (
          controller.signal.aborted ||
          (err instanceof Error && err.name === "AbortError")
        ) {
          return;
        }

        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void fetchAlerts();

    return () => controller.abort();
  }, [districtFilter, severityFilter, statusFilter, navigate]);

  async function loadAlerts() {
    const headers = getHeaders();
    if (!headers) return;

    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("status", statusFilter);

      if (districtFilter) params.set("districtId", districtFilter);
      if (severityFilter) params.set("severity", severityFilter);

      const response = await fetch(
        `${API_BASE_URL}/api/admin/alerts?${params.toString()}`,
        { headers },
      );

      if (response.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load disaster alerts.");
      }

      setAlerts(result.data as DisasterAlert[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts.");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setEditingAlert(null);
    setForm(emptyForm());
    setError("");
    setShowModal(true);
  }

  function openEditModal(alert: DisasterAlert) {
    setEditingAlert(alert);

    setForm({
      title: alert.title,
      titleBn: alert.titleBn ?? "",
      message: alert.message,
      messageBn: alert.messageBn ?? "",
      severity: alert.severity,
      status: alert.status,
      districtIds: alert.districtIds,
      source: alert.source ?? "",
      sourceUrl: alert.sourceUrl ?? "",
      issuedAt: toLocalDateTime(alert.issuedAt),
      expiresAt: toLocalDateTime(alert.expiresAt),
    });

    setError("");
    setShowModal(true);
  }

  function toggleDistrict(districtId: string) {
    setForm((current) => ({
      ...current,
      districtIds: current.districtIds.includes(districtId)
        ? current.districtIds.filter((id) => id !== districtId)
        : [...current.districtIds, districtId],
    }));
  }

  function selectAllDistricts() {
    setForm((current) => ({
      ...current,
      districtIds:
        current.districtIds.length === districts.length
          ? []
          : districts.map((district) => district.id),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.districtIds.length === 0) {
      setError("Select at least one affected district.");
      return;
    }

    if (!form.issuedAt) {
      setError("An issue date is required.");
      return;
    }

    const issuedAt = new Date(form.issuedAt);
    const expiresAt = form.expiresAt ? new Date(form.expiresAt) : null;

    if (Number.isNaN(issuedAt.getTime())) {
      setError("Enter a valid issue date.");
      return;
    }

    if (
      expiresAt &&
      (Number.isNaN(expiresAt.getTime()) || expiresAt <= issuedAt)
    ) {
      setError("Expiry date must be later than the issue date.");
      return;
    }

    if (form.sourceUrl.trim()) {
      try {
        const url = new URL(form.sourceUrl.trim());

        if (url.protocol !== "http:" && url.protocol !== "https:") {
          setError("Source URL must use HTTP or HTTPS.");
          return;
        }
      } catch {
        setError("Enter a valid source URL.");
        return;
      }
    }

    const headers = getHeaders();
    if (!headers) return;

    const payload = {
      title: form.title.trim(),
      titleBn: form.titleBn.trim() || null,
      message: form.message.trim(),
      messageBn: form.messageBn.trim() || null,
      severity: form.severity,
      status: form.status,
      districtIds: form.districtIds,
      source: form.source.trim() || null,
      sourceUrl: form.sourceUrl.trim() || null,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    };

    setIsSaving(true);
    setError("");

    try {
      const isEditing = Boolean(editingAlert);

      const response = await fetch(
        isEditing
          ? `${API_BASE_URL}/api/admin/alerts/${editingAlert!.id}`
          : `${API_BASE_URL}/api/admin/alerts`,
        {
          method: isEditing ? "PUT" : "POST",
          headers,
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save alert.");
      }

      setShowModal(false);
      setEditingAlert(null);
      setForm(emptyForm());

      await loadAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save alert.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStatus(alert: DisasterAlert, status: AlertStatus) {
    const headers = getHeaders();
    if (!headers) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/alerts/${alert.id}/status`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status }),
        },
      );

      if (response.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update alert status.");
      }

      await loadAlerts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update alert status.",
      );
    }
  }

  async function deleteAlert(alert: DisasterAlert) {
    if (
      !window.confirm(`Delete "${alert.title}"? This action cannot be undone.`)
    ) {
      return;
    }

    const headers = getHeaders();
    if (!headers) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/alerts/${alert.id}`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (response.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete alert.");
      }

      await loadAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete alert.");
    }
  }

  const activeCount = alerts.filter(
    (alert) => alert.status === "ACTIVE",
  ).length;

  const draftCount = alerts.filter((alert) => alert.status === "DRAFT").length;

  const dangerCount = alerts.filter(
    (alert) => alert.severity === "DANGER" && alert.status === "ACTIVE",
  ).length;

  const warningCount = alerts.filter(
    (alert) => alert.severity === "WARNING" && alert.status === "ACTIVE",
  ).length;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <BellRing className="h-5 w-5 text-amethyst" />
            <h2 className="text-xl font-bold text-deep-sea-blue">
              Disaster Alerts
            </h2>
          </div>
          <p className="text-sm text-deep-sea-blue/60">
            Create, publish, and manage disaster-related alerts.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void loadAlerts()}
            className="inline-flex items-center gap-2 rounded-xl border border-deep-sea-blue/15 bg-white px-4 py-2.5 text-sm font-medium text-deep-sea-blue transition hover:bg-deep-sea-blue/5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-deep-sea-blue px-4 py-2.5 text-sm font-medium text-white transition hover:bg-deep-sea-blue/90"
          >
            <Plus className="h-4 w-4" />
            Create Alert
          </button>
        </div>
      </div>

      {/* Publishing reminder */}
      <div className="rounded-xl border border-cotton-candy/40 bg-cotton-candy/10 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-night-bordeaux" />
          <div>
            <p className="text-sm font-semibold text-deep-sea-blue">
              Verify information before publishing
            </p>
            <p className="mt-1 text-xs leading-relaxed text-deep-sea-blue/70">
              Use reliable sources for warnings and instructions. Only describe
              an alert as an official evacuation order when that order has been
              verified with the responsible authority. Test alerts should remain
              drafts.
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          label="Alerts shown"
          value={alerts.length}
          icon={<BellRing className="h-5 w-5" />}
        />
        <SummaryCard
          label="Active alerts"
          value={activeCount}
          icon={<Info className="h-5 w-5" />}
        />
        <SummaryCard
          label="Draft alerts"
          value={draftCount}
          icon={<Pencil className="h-5 w-5" />}
        />
        <SummaryCard
          label="Active warnings / danger"
          value={warningCount + dangerCount}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-deep-sea-blue/10 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-4 w-4 text-deep-sea-blue/50" />
          <h3 className="text-sm font-semibold text-deep-sea-blue">Filters</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass}>District</label>
            <select
              value={districtFilter}
              onChange={(event) => setDistrictFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">All districts</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Severity</label>
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">All severity levels</option>
              {severityOptions.map((severity) => (
                <option key={severity.value} value={severity.value}>
                  {severity.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className={inputClass}
            >
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Alerts list */}
      {isLoading ? (
        <div className="rounded-2xl border border-deep-sea-blue/10 bg-white p-12 text-center">
          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-amethyst" />
          <p className="mt-3 text-sm text-deep-sea-blue/60">
            Loading disaster alerts...
          </p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-deep-sea-blue/20 bg-white p-12 text-center">
          <BellRing className="mx-auto h-9 w-9 text-deep-sea-blue/30" />
          <h3 className="mt-3 font-semibold text-deep-sea-blue">
            No alerts found
          </h3>
          <p className="mt-1 text-sm text-deep-sea-blue/55">
            Change your filters or create a new disaster alert.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <article
              key={alert.id}
              className="overflow-hidden rounded-2xl border border-deep-sea-blue/10 bg-white shadow-sm"
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={alert.severity} />
                      <StatusBadge status={alert.status} />
                    </div>

                    <h3 className="text-base font-bold text-deep-sea-blue">
                      {alert.title}
                    </h3>

                    {alert.titleBn && (
                      <p className="mt-0.5 text-sm text-deep-sea-blue/55">
                        {alert.titleBn}
                      </p>
                    )}

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-deep-sea-blue/75">
                      {alert.message}
                    </p>

                    {alert.messageBn && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-deep-sea-blue/55">
                        {alert.messageBn}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
                    <button
                      onClick={() => openEditModal(alert)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-deep-sea-blue/15 px-3 py-2 text-xs font-medium text-deep-sea-blue hover:bg-deep-sea-blue/5"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>

                    <button
                      onClick={() => void deleteAlert(alert)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Affected districts */}
                <div className="mt-4 border-t border-deep-sea-blue/10 pt-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-deep-sea-blue/70">
                    <MapPin className="h-3.5 w-3.5" />
                    Affected districts
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {alert.districtIds.map((id) => {
                      const district = districts.find((item) => item.id === id);

                      return (
                        <span
                          key={id}
                          className="rounded-full bg-deep-sea-blue/5 px-2.5 py-1 text-xs text-deep-sea-blue/75"
                        >
                          {district?.name ?? id}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Dates and source */}
                <div className="mt-4 grid gap-3 text-xs text-deep-sea-blue/60 sm:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p>
                        <strong className="text-deep-sea-blue/75">
                          Issued:
                        </strong>{" "}
                        {formatDate(alert.issuedAt)}
                      </p>
                      <p className="mt-1">
                        <strong className="text-deep-sea-blue/75">
                          Expires:
                        </strong>{" "}
                        {formatDate(alert.expiresAt)}
                      </p>
                    </div>
                  </div>

                  <div>
                    {alert.source && (
                      <p>
                        <strong className="text-deep-sea-blue/75">
                          Source:
                        </strong>{" "}
                        {alert.source}
                      </p>
                    )}

                    {alert.sourceUrl && (
                      <a
                        href={alert.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-amethyst hover:underline"
                      >
                        View source
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {!alert.source && !alert.sourceUrl && (
                      <p>No source provided.</p>
                    )}
                  </div>
                </div>

                {/* Status management */}
                <div className="mt-4 flex flex-col justify-between gap-3 border-t border-deep-sea-blue/10 pt-4 sm:flex-row sm:items-center">
                  <p className="text-xs font-medium text-deep-sea-blue/60">
                    Change alert status
                  </p>

                  <select
                    value={alert.status}
                    onChange={(event) =>
                      void updateStatus(
                        alert,
                        event.target.value as AlertStatus,
                      )
                    }
                    className="w-full rounded-lg border border-deep-sea-blue/15 bg-white px-3 py-2 text-xs font-medium text-deep-sea-blue outline-none focus:border-amethyst sm:w-44"
                    aria-label={`Change status for ${alert.title}`}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {showModal && (
        <Modal
          title={editingAlert ? "Edit Disaster Alert" : "Create Disaster Alert"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Alert title" required>
                <input
                  required
                  maxLength={200}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. Cyclone warning for coastal areas"
                />
              </FormField>

              <FormField label="Alert title (Bangla)">
                <input
                  value={form.titleBn}
                  onChange={(event) =>
                    setForm({ ...form, titleBn: event.target.value })
                  }
                  className={inputClass}
                  placeholder="সতর্কবার্তার শিরোনাম"
                />
              </FormField>
            </div>

            <FormField label="Message" required>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(event) =>
                  setForm({ ...form, message: event.target.value })
                }
                className={inputClass}
                placeholder="Describe the situation and recommended safety actions..."
              />
            </FormField>

            <FormField label="Message (Bangla)">
              <textarea
                rows={4}
                value={form.messageBn}
                onChange={(event) =>
                  setForm({ ...form, messageBn: event.target.value })
                }
                className={inputClass}
                placeholder="সতর্কবার্তার বিস্তারিত বাংলায় লিখুন..."
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Severity" required>
                <select
                  value={form.severity}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      severity: event.target.value as AlertSeverity,
                    })
                  }
                  className={inputClass}
                >
                  {severityOptions.map((severity) => (
                    <option key={severity.value} value={severity.value}>
                      {severity.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Initial status" required>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as AlertStatus,
                    })
                  }
                  className={inputClass}
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* District selection */}
            <FormField label="Affected districts" required>
              <div className="rounded-xl border border-deep-sea-blue/15 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-deep-sea-blue/60">
                    {form.districtIds.length} of {districts.length} selected
                  </p>

                  <button
                    type="button"
                    onClick={selectAllDistricts}
                    className="text-xs font-semibold text-amethyst hover:underline"
                  >
                    {form.districtIds.length === districts.length
                      ? "Clear all"
                      : "Select all"}
                  </button>
                </div>

                <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                  {districts.map((district) => (
                    <label
                      key={district.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs transition ${
                        form.districtIds.includes(district.id)
                          ? "border-amethyst bg-amethyst/10 text-deep-sea-blue"
                          : "border-deep-sea-blue/10 text-deep-sea-blue/70 hover:bg-deep-sea-blue/5"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.districtIds.includes(district.id)}
                        onChange={() => toggleDistrict(district.id)}
                        className="accent-amethyst"
                      />
                      {district.name}
                    </label>
                  ))}
                </div>
              </div>
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Issue date and time" required>
                <input
                  required
                  type="datetime-local"
                  value={form.issuedAt}
                  onChange={(event) =>
                    setForm({ ...form, issuedAt: event.target.value })
                  }
                  className={inputClass}
                />
              </FormField>

              <FormField label="Expiry date and time">
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  min={form.issuedAt || undefined}
                  onChange={(event) =>
                    setForm({ ...form, expiresAt: event.target.value })
                  }
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-deep-sea-blue/50">
                  Leave empty if the alert has no scheduled expiry.
                </p>
              </FormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Issuing source">
                <input
                  value={form.source}
                  onChange={(event) =>
                    setForm({ ...form, source: event.target.value })
                  }
                  className={inputClass}
                  placeholder="e.g. Bangladesh Meteorological Department"
                />
              </FormField>

              <FormField label="Source URL">
                <input
                  type="url"
                  value={form.sourceUrl}
                  onChange={(event) =>
                    setForm({ ...form, sourceUrl: event.target.value })
                  }
                  className={inputClass}
                  placeholder="https://example.gov.bd/..."
                />
              </FormField>
            </div>

            {error && <ErrorMessage message={error} />}

            <div className="flex flex-col-reverse justify-end gap-2 border-t border-deep-sea-blue/10 pt-4 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-deep-sea-blue/15 px-4 py-2.5 text-sm text-deep-sea-blue hover:bg-deep-sea-blue/5"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-deep-sea-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-deep-sea-blue/90 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSaving
                  ? "Saving..."
                  : editingAlert
                    ? "Save Changes"
                    : "Create Alert"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-deep-sea-blue/10 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-deep-sea-blue/60">{label}</p>
        <span className="text-amethyst">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-deep-sea-blue">{value}</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const styles: Record<AlertSeverity, string> = {
    INFO: "bg-sky-100 text-sky-800",
    ADVISORY: "bg-mint-cream text-deep-sea-blue",
    WATCH: "bg-yellow-100 text-yellow-800",
    WARNING: "bg-orange-100 text-orange-800",
    DANGER: "bg-red-100 text-red-800",
  };

  const labels: Record<AlertSeverity, string> = {
    INFO: "Information",
    ADVISORY: "Advisory",
    WATCH: "Watch",
    WARNING: "Warning",
    DANGER: "Danger",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[severity]}`}
    >
      {severity === "DANGER" || severity === "WARNING" ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Info className="h-3 w-3" />
      )}
      {labels[severity]}
    </span>
  );
}

function StatusBadge({ status }: { status: AlertStatus }) {
  const styles: Record<AlertStatus, string> = {
    DRAFT: "bg-deep-sea-blue/10 text-deep-sea-blue",
    ACTIVE: "bg-green-100 text-green-800",
    EXPIRED: "bg-orange-100 text-orange-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const labels: Record<AlertStatus, string> = {
    DRAFT: "Draft",
    ACTIVE: "Active",
    EXPIRED: "Expired",
    CANCELLED: "Cancelled",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <X className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep-sea-blue/50 p-3 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-deep-sea-blue/10 bg-white px-5 py-4">
          <h3 className="font-bold text-deep-sea-blue">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-deep-sea-blue/60 hover:bg-deep-sea-blue/5 hover:text-deep-sea-blue"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
