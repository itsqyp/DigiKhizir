import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FormEvent, ReactNode } from "react";

import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  MapPin,
  Users,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { API_BASE_URL } from "../../../lib/api";
import { clearAdminSession, getAdminSession } from "../../../lib/adminAuth";

interface ShelterFacility {
  id?: string;
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
  isActive: boolean;
  capacityRemaining: number | null;
  facilities: ShelterFacility[];
  createdAt: string;
  updatedAt: string;
}

interface ShelterFormData {
  name: string;
  nameBn: string;
  address: string;
  districtId: string;
  latitude: string;
  longitude: string;
  capacity: string;
  occupancy: string;
  facilities: ShelterFacility[];
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

const emptyForm: ShelterFormData = {
  name: "",
  nameBn: "",
  address: "",
  districtId: "",
  latitude: "",
  longitude: "",
  capacity: "",
  occupancy: "",
  facilities: [],
};

type FilterStatus = "all" | "active" | "inactive";

export default function HumanSheltersSection() {
  const navigate = useNavigate();

  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [districtFilter, setDistrictFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);
  const [formData, setFormData] = useState<ShelterFormData>(emptyForm);

  const loadShelters = useCallback(
    async (signal?: AbortSignal) => {
      const session = getAdminSession();

      if (!session) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      try {
        setError("");

        const params = new URLSearchParams();
        params.set("status", statusFilter);

        if (districtFilter) {
          params.set("districtId", districtFilter);
        }

        const response = await fetch(
          `${API_BASE_URL}/api/admin/shelters?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${session.token}`,
            },
            signal,
          },
        );

        if (response.status === 401) {
          clearAdminSession();
          navigate("/admin/login");
          return;
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load shelters.");
        }

        setShelters(result.data as Shelter[]);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [districtFilter, statusFilter, navigate],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function fetchShelters() {
      const session = getAdminSession();

      if (!session) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      try {
        const params = new URLSearchParams();
        params.set("status", statusFilter);

        if (districtFilter) {
          params.set("districtId", districtFilter);
        }

        const response = await fetch(
          `${API_BASE_URL}/api/admin/shelters?${params.toString()}`,
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
          throw new Error(result.message || "Failed to load shelters.");
        }

        if (!controller.signal.aborted) {
          setShelters(result.data as Shelter[]);
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

    void fetchShelters();

    return () => {
      controller.abort();
    };
  }, [districtFilter, statusFilter, navigate]);

  function openAddForm() {
    setEditingShelter(null);
    setFormData(emptyForm);
    setActionError("");
    setIsFormOpen(true);
  }

  function openEditForm(shelter: Shelter) {
    setEditingShelter(shelter);
    setActionError("");

    setFormData({
      name: shelter.name,
      nameBn: shelter.nameBn ?? "",
      address: shelter.address,
      districtId: shelter.districtId,
      latitude: String(shelter.latitude),
      longitude: String(shelter.longitude),
      capacity: String(shelter.capacity),
      occupancy: shelter.occupancy === null ? "" : String(shelter.occupancy),
      facilities: shelter.facilities.map((facility) => ({
        id: facility.id,
        name: facility.name,
        nameBn: facility.nameBn ?? "",
        available: facility.available,
      })),
    });

    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;

    setIsFormOpen(false);
    setEditingShelter(null);
    setFormData(emptyForm);
    setActionError("");
  }

  function updateField(
    field: keyof Omit<ShelterFormData, "facilities">,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addFacility() {
    setFormData((current) => ({
      ...current,
      facilities: [
        ...current.facilities,
        { name: "", nameBn: "", available: true },
      ],
    }));
  }

  function updateFacility(
    index: number,
    field: keyof ShelterFacility,
    value: string | boolean,
  ) {
    setFormData((current) => ({
      ...current,
      facilities: current.facilities.map((facility, facilityIndex) =>
        facilityIndex === index ? { ...facility, [field]: value } : facility,
      ),
    }));
  }

  function removeFacility(index: number) {
    setFormData((current) => ({
      ...current,
      facilities: current.facilities.filter(
        (_, facilityIndex) => facilityIndex !== index,
      ),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError("");

    const session = getAdminSession();

    if (!session) {
      clearAdminSession();
      navigate("/admin/login");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      nameBn: formData.nameBn.trim() || null,
      address: formData.address.trim(),
      districtId: formData.districtId,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      capacity: Number(formData.capacity),
      occupancy:
        formData.occupancy.trim() === "" ? null : Number(formData.occupancy),
      facilities: formData.facilities.map((facility) => ({
        name: facility.name.trim(),
        nameBn: facility.nameBn?.trim() || null,
        available: facility.available,
      })),
    };

    if (
      !payload.name ||
      !payload.address ||
      !payload.districtId ||
      !formData.latitude.trim() ||
      !formData.longitude.trim() ||
      !formData.capacity.trim()
    ) {
      setActionError("Please complete all required fields.");
      return;
    }

    if (payload.facilities.some((facility) => !facility.name)) {
      setActionError("Every facility must have a name.");
      return;
    }

    setIsSaving(true);

    try {
      const isEditing = Boolean(editingShelter);
      const url = isEditing
        ? `${API_BASE_URL}/api/admin/shelters/${editingShelter!.id}`
        : `${API_BASE_URL}/api/admin/shelters`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save shelter.");
      }

      setIsFormOpen(false);
      setEditingShelter(null);
      setFormData(emptyForm);

      await loadShelters();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to save shelter.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleShelterStatus(shelter: Shelter) {
    const session = getAdminSession();

    if (!session) {
      clearAdminSession();
      navigate("/admin/login");
      return;
    }

    setChangingStatusId(shelter.id);
    setActionError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/shelters/${shelter.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ isActive: !shelter.isActive }),
        },
      );

      if (response.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update shelter status.");
      }

      await loadShelters();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update status.",
      );
    } finally {
      setChangingStatusId(null);
    }
  }

  async function deleteShelter(shelter: Shelter) {
    const confirmed = window.confirm(
      `Delete "${shelter.name}" permanently? This action cannot be undone.`,
    );

    if (!confirmed) return;

    const session = getAdminSession();

    if (!session) {
      clearAdminSession();
      navigate("/admin/login");
      return;
    }

    setDeletingId(shelter.id);
    setActionError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/shelters/${shelter.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        },
      );

      if (response.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete shelter.");
      }

      setShelters((current) =>
        current.filter((item) => item.id !== shelter.id),
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete shelter.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = shelters.filter((shelter) => shelter.isActive).length;
  const inactiveCount = shelters.length - activeCount;
  const totalCapacity = shelters.reduce(
    (total, shelter) => total + shelter.capacity,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-amethyst">
            RESOURCE MANAGEMENT
          </p>
          <h1 className="mt-1 font-poppins text-2xl font-bold text-deep-sea-blue">
            Human Shelters
          </h1>
          <p className="mt-1 text-sm text-deep-sea-blue/65">
            Manage emergency shelters, capacity, and available facilities.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadShelters()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-deep-sea-blue/15 bg-white px-4 py-2.5 text-sm font-semibold text-deep-sea-blue transition hover:bg-mint-cream disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-deep-sea-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amethyst"
          >
            <Plus size={17} />
            Add Shelter
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<Building2 size={20} />}
          label="Shelters shown"
          value={shelters.length}
        />
        <SummaryCard
          icon={<CheckCircle2 size={20} />}
          label="Active shelters"
          value={activeCount}
        />
        <SummaryCard
          icon={<Users size={20} />}
          label="Total capacity"
          value={totalCapacity.toLocaleString()}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-deep-sea-blue/10 bg-white p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="shelter-district-filter"
            className="mb-1.5 block text-sm font-semibold text-deep-sea-blue"
          >
            District
          </label>
          <select
            id="shelter-district-filter"
            value={districtFilter}
            onChange={(event) => setDistrictFilter(event.target.value)}
            className="w-full rounded-xl border border-deep-sea-blue/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-amethyst"
          >
            <option value="">All districts</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label
            htmlFor="shelter-status-filter"
            className="mb-1.5 block text-sm font-semibold text-deep-sea-blue"
          >
            Status
          </label>
          <select
            id="shelter-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as FilterStatus)
            }
            className="w-full rounded-xl border border-deep-sea-blue/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-amethyst"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <p className="pb-2 text-sm text-deep-sea-blue/60">
          {activeCount} active · {inactiveCount} inactive
        </p>
      </div>

      {/* Action error */}
      {actionError && !isFormOpen && <ErrorMessage message={actionError} />}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-deep-sea-blue/10 bg-white p-12 text-deep-sea-blue/65">
          <RefreshCw size={20} className="animate-spin" />
          <span className="text-sm font-medium">Loading shelters...</span>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="space-y-4 rounded-2xl border border-night-bordeaux/15 bg-white p-8 text-center">
          <AlertCircle className="mx-auto text-night-bordeaux" size={30} />
          <p className="font-semibold text-deep-sea-blue">{error}</p>
          <button
            type="button"
            onClick={() => void loadShelters()}
            className="rounded-xl bg-deep-sea-blue px-4 py-2 text-sm font-semibold text-white hover:bg-amethyst"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && shelters.length === 0 && (
        <div className="rounded-2xl border border-dashed border-deep-sea-blue/20 bg-white p-12 text-center">
          <Building2 className="mx-auto text-deep-sea-blue/35" size={36} />
          <h3 className="mt-3 font-poppins font-semibold text-deep-sea-blue">
            No shelters found
          </h3>
          <p className="mt-1 text-sm text-deep-sea-blue/60">
            Try changing your filters or add a new shelter.
          </p>
          <button
            type="button"
            onClick={openAddForm}
            className="mt-4 rounded-xl bg-deep-sea-blue px-4 py-2 text-sm font-semibold text-white hover:bg-amethyst"
          >
            Add a shelter
          </button>
        </div>
      )}

      {/* Shelter table */}
      {!isLoading && !error && shelters.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-deep-sea-blue/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-mint-cream text-deep-sea-blue">
                <tr>
                  <th className="px-5 py-4 font-semibold">Shelter</th>
                  <th className="px-5 py-4 font-semibold">District</th>
                  <th className="px-5 py-4 font-semibold">Capacity</th>
                  <th className="px-5 py-4 font-semibold">Occupancy</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-deep-sea-blue/10">
                {shelters.map((shelter) => (
                  <tr
                    key={shelter.id}
                    className="transition hover:bg-mint-cream/40"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-deep-sea-blue">
                        {shelter.name}
                      </p>
                      {shelter.nameBn && (
                        <p className="mt-0.5 text-xs text-deep-sea-blue/55">
                          {shelter.nameBn}
                        </p>
                      )}
                      <p className="mt-1 flex items-center gap-1 text-xs text-deep-sea-blue/55">
                        <MapPin size={12} />
                        {shelter.address}
                      </p>
                    </td>

                    <td className="px-5 py-4 capitalize text-deep-sea-blue/75">
                      {districts.find(
                        (district) => district.id === shelter.districtId,
                      )?.name ?? shelter.districtId}
                    </td>

                    <td className="px-5 py-4 font-medium text-deep-sea-blue">
                      {shelter.capacity.toLocaleString()}
                    </td>

                    <td className="px-5 py-4 text-deep-sea-blue/75">
                      {shelter.occupancy === null
                        ? "Not provided"
                        : `${shelter.occupancy.toLocaleString()} / ${shelter.capacity.toLocaleString()}`}
                      {shelter.occupancy !== null && (
                        <p className="mt-1 text-xs text-deep-sea-blue/50">
                          {Math.max(
                            0,
                            shelter.capacity - shelter.occupancy,
                          ).toLocaleString()}{" "}
                          spaces remaining
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge active={shelter.isActive} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          title="Edit shelter"
                          onClick={() => openEditForm(shelter)}
                          className="rounded-lg p-2 text-deep-sea-blue transition hover:bg-mint-cream"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          title={
                            shelter.isActive
                              ? "Deactivate shelter"
                              : "Activate shelter"
                          }
                          onClick={() => void toggleShelterStatus(shelter)}
                          disabled={changingStatusId === shelter.id}
                          className="rounded-lg p-2 text-amethyst transition hover:bg-amethyst/10 disabled:opacity-40"
                        >
                          {changingStatusId === shelter.id ? (
                            <RefreshCw size={17} className="animate-spin" />
                          ) : shelter.isActive ? (
                            <XCircle size={17} />
                          ) : (
                            <CheckCircle2 size={17} />
                          )}
                        </button>

                        <button
                          type="button"
                          title="Delete shelter"
                          onClick={() => void deleteShelter(shelter)}
                          disabled={deletingId === shelter.id}
                          className="rounded-lg p-2 text-night-bordeaux transition hover:bg-cotton-candy/20 disabled:opacity-40"
                        >
                          {deletingId === shelter.id ? (
                            <RefreshCw size={17} className="animate-spin" />
                          ) : (
                            <Trash2 size={17} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit form modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep-sea-blue/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-deep-sea-blue/10 bg-white px-6 py-4">
              <div>
                <h2 className="font-poppins text-xl font-bold text-deep-sea-blue">
                  {editingShelter ? "Edit Shelter" : "Add Shelter"}
                </h2>
                <p className="mt-1 text-xs text-deep-sea-blue/55">
                  {editingShelter
                    ? "Update shelter details and facilities."
                    : "Enter the details for the new shelter."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={isSaving}
                className="rounded-lg p-2 text-deep-sea-blue/60 hover:bg-mint-cream disabled:opacity-40"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {actionError && <ErrorMessage message={actionError} />}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Shelter name" required>
                  <input
                    required
                    value={formData.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="e.g. Bhola Cyclone Shelter"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Shelter name (Bangla)">
                  <input
                    value={formData.nameBn}
                    onChange={(event) =>
                      updateField("nameBn", event.target.value)
                    }
                    placeholder="বাংলায় নাম"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="District" required>
                  <select
                    required
                    value={formData.districtId}
                    onChange={(event) =>
                      updateField("districtId", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">Select district</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Address" required>
                  <input
                    required
                    value={formData.address}
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                    placeholder="Village, union, upazila..."
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Latitude" required>
                  <input
                    required
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={formData.latitude}
                    onChange={(event) =>
                      updateField("latitude", event.target.value)
                    }
                    placeholder="e.g. 22.685"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Longitude" required>
                  <input
                    required
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={formData.longitude}
                    onChange={(event) =>
                      updateField("longitude", event.target.value)
                    }
                    placeholder="e.g. 90.648"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Total capacity" required>
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={formData.capacity}
                    onChange={(event) =>
                      updateField("capacity", event.target.value)
                    }
                    placeholder="e.g. 500"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Current occupancy">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.occupancy}
                    onChange={(event) =>
                      updateField("occupancy", event.target.value)
                    }
                    placeholder="Leave blank if unknown"
                    className={inputClass}
                  />
                </FormField>
              </div>

              {/* Facilities */}
              <div className="border-t border-deep-sea-blue/10 pt-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-poppins font-semibold text-deep-sea-blue">
                      Shelter facilities
                    </h3>
                    <p className="mt-1 text-xs text-deep-sea-blue/55">
                      Add facilities and mark whether each one is available.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addFacility}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amethyst/30 px-3 py-2 text-xs font-semibold text-amethyst hover:bg-amethyst/10"
                  >
                    <Plus size={15} />
                    Add facility
                  </button>
                </div>

                {formData.facilities.length === 0 && (
                  <p className="rounded-xl bg-mint-cream p-4 text-center text-sm text-deep-sea-blue/55">
                    No facilities added yet.
                  </p>
                )}

                <div className="space-y-3">
                  {formData.facilities.map((facility, index) => (
                    <div
                      key={facility.id ?? `new-facility-${index}`}
                      className="grid grid-cols-1 items-end gap-3 rounded-xl border border-deep-sea-blue/10 p-3 sm:grid-cols-[1fr_1fr_auto_auto]"
                    >
                      <FormField label="Facility name">
                        <input
                          value={facility.name}
                          onChange={(event) =>
                            updateFacility(index, "name", event.target.value)
                          }
                          placeholder="e.g. Drinking water"
                          className={inputClass}
                        />
                      </FormField>

                      <FormField label="Facility name (Bangla)">
                        <input
                          value={facility.nameBn ?? ""}
                          onChange={(event) =>
                            updateFacility(index, "nameBn", event.target.value)
                          }
                          placeholder="বাংলায় নাম"
                          className={inputClass}
                        />
                      </FormField>

                      <label className="flex items-center gap-2 pb-2 text-xs font-medium text-deep-sea-blue">
                        <input
                          type="checkbox"
                          checked={facility.available}
                          onChange={(event) =>
                            updateFacility(
                              index,
                              "available",
                              event.target.checked,
                            )
                          }
                          className="accent-amethyst"
                        />
                        Available
                      </label>

                      <button
                        type="button"
                        onClick={() => removeFacility(index)}
                        title="Remove facility"
                        className="mb-1 rounded-lg p-2 text-night-bordeaux hover:bg-cotton-candy/20"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-deep-sea-blue/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                  className="rounded-xl border border-deep-sea-blue/15 px-5 py-2.5 text-sm font-semibold text-deep-sea-blue hover:bg-mint-cream disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-deep-sea-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-amethyst disabled:opacity-60"
                >
                  {isSaving && <RefreshCw size={16} className="animate-spin" />}
                  {isSaving
                    ? "Saving..."
                    : editingShelter
                      ? "Save changes"
                      : "Create shelter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-deep-sea-blue/15 bg-white px-3 py-2.5 text-sm text-deep-sea-blue outline-none transition placeholder:text-deep-sea-blue/35 focus:border-amethyst";

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-deep-sea-blue/10 bg-white p-5">
      <div className="rounded-xl bg-amethyst/10 p-3 text-amethyst">{icon}</div>
      <div>
        <p className="text-xs font-medium text-deep-sea-blue/55">{label}</p>
        <p className="mt-1 font-poppins text-2xl font-bold text-deep-sea-blue">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-mint-cream text-deep-sea-blue"
          : "bg-cotton-candy/20 text-night-bordeaux"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-amethyst" : "bg-night-bordeaux"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-deep-sea-blue">
        {label}
        {required && <span className="ml-1 text-night-bordeaux">*</span>}
      </span>
      {children}
    </label>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-night-bordeaux/15 bg-cotton-candy/10 p-3 text-sm text-night-bordeaux">
      <AlertCircle size={17} className="mt-0.5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
