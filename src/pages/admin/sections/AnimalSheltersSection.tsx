import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  MapPin,
  Phone,
  PawPrint,
  Warehouse,
  Users,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  Save,
} from "lucide-react";

import { API_BASE_URL } from "../../../lib/api";
import { clearAdminSession, getAdminSession } from "../../../lib/adminAuth";

type AnimalType = "PET" | "LIVESTOCK" | "POULTRY" | "OTHER";

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
  availableCapacity: number;
  animalTypes: AnimalType[];
  contactName: string | null;
  contactPhone: string | null;
  isActive: boolean;
  facilities: AnimalShelterFacility[];
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
  animalTypes: AnimalType[];
  contactName: string;
  contactPhone: string;
}

interface FacilityFormData {
  name: string;
  nameBn: string;
  available: boolean;
}

type StatusFilter = "all" | "active" | "inactive";

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

const animalTypeOptions: { value: AnimalType; label: string }[] = [
  { value: "LIVESTOCK", label: "Livestock" },
  { value: "POULTRY", label: "Poultry" },
  { value: "PET", label: "Pets" },
  { value: "OTHER", label: "Other" },
];

const emptyShelterForm: ShelterFormData = {
  name: "",
  nameBn: "",
  address: "",
  districtId: "bhola",
  latitude: "",
  longitude: "",
  capacity: "",
  occupancy: "",
  animalTypes: [],
  contactName: "",
  contactPhone: "",
};

const emptyFacilityForm: FacilityFormData = {
  name: "",
  nameBn: "",
  available: true,
};

const inputClass =
  "w-full rounded-xl border border-deep-sea-blue/15 bg-white px-3.5 py-2.5 text-sm text-deep-sea-blue outline-none transition focus:border-amethyst focus:ring-2 focus:ring-amethyst/15";

const labelClass = "mb-1.5 block text-sm font-medium text-deep-sea-blue";

export default function AnimalSheltersSection() {
  const navigate = useNavigate();

  const [shelters, setShelters] = useState<AnimalShelter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [districtFilter, setDistrictFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [animalTypeFilter, setAnimalTypeFilter] = useState("");

  const [showShelterModal, setShowShelterModal] = useState(false);
  const [editingShelter, setEditingShelter] = useState<AnimalShelter | null>(
    null,
  );
  const [shelterForm, setShelterForm] =
    useState<ShelterFormData>(emptyShelterForm);

  const [expandedShelterId, setExpandedShelterId] = useState<string | null>(
    null,
  );

  const [facilityShelter, setFacilityShelter] = useState<AnimalShelter | null>(
    null,
  );
  const [editingFacility, setEditingFacility] =
    useState<AnimalShelterFacility | null>(null);
  const [facilityForm, setFacilityForm] =
    useState<FacilityFormData>(emptyFacilityForm);
  const [showFacilityModal, setShowFacilityModal] = useState(false);

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

  // Fetch shelters whenever a filter changes.
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

        if (districtFilter) params.set("districtId", districtFilter);
        if (animalTypeFilter) params.set("animalType", animalTypeFilter);

        const response = await fetch(
          `${API_BASE_URL}/api/admin/animal-shelters?${params.toString()}`,
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
          throw new Error(result.message || "Failed to load animal shelters.");
        }

        if (!controller.signal.aborted) {
          setShelters(result.data as AnimalShelter[]);
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

    return () => controller.abort();
  }, [districtFilter, statusFilter, animalTypeFilter, navigate]);

  async function loadShelters() {
    const headers = getHeaders();
    if (!headers) return;

    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("status", statusFilter);

      if (districtFilter) params.set("districtId", districtFilter);
      if (animalTypeFilter) params.set("animalType", animalTypeFilter);

      const response = await fetch(
        `${API_BASE_URL}/api/admin/animal-shelters?${params.toString()}`,
        { headers },
      );

      if (response.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load animal shelters.");
      }

      setShelters(result.data as AnimalShelter[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setEditingShelter(null);
    setShelterForm(emptyShelterForm);
    setShowShelterModal(true);
  }

  function openEditModal(shelter: AnimalShelter) {
    setEditingShelter(shelter);
    setShelterForm({
      name: shelter.name,
      nameBn: shelter.nameBn ?? "",
      address: shelter.address,
      districtId: shelter.districtId,
      latitude: String(shelter.latitude),
      longitude: String(shelter.longitude),
      capacity: String(shelter.capacity),
      occupancy: shelter.occupancy === null ? "" : String(shelter.occupancy),
      animalTypes: shelter.animalTypes,
      contactName: shelter.contactName ?? "",
      contactPhone: shelter.contactPhone ?? "",
    });
    setShowShelterModal(true);
  }

  function toggleAnimalType(type: AnimalType) {
    setShelterForm((current) => ({
      ...current,
      animalTypes: current.animalTypes.includes(type)
        ? current.animalTypes.filter((item) => item !== type)
        : [...current.animalTypes, type],
    }));
  }

  async function handleShelterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (shelterForm.animalTypes.length === 0) {
      setError("Select at least one animal type.");
      return;
    }

    const capacity = Number(shelterForm.capacity);
    const occupancy =
      shelterForm.occupancy.trim() === ""
        ? null
        : Number(shelterForm.occupancy);

    if (
      !Number.isFinite(capacity) ||
      capacity < 0 ||
      (occupancy !== null &&
        (!Number.isFinite(occupancy) || occupancy < 0 || occupancy > capacity))
    ) {
      setError("Check the capacity and occupancy values.");
      return;
    }

    const payload = {
      name: shelterForm.name.trim(),
      nameBn: shelterForm.nameBn.trim() || null,
      address: shelterForm.address.trim(),
      districtId: shelterForm.districtId,
      latitude: Number(shelterForm.latitude),
      longitude: Number(shelterForm.longitude),
      capacity,
      occupancy,
      animalTypes: shelterForm.animalTypes,
      contactName: shelterForm.contactName.trim() || null,
      contactPhone: shelterForm.contactPhone.trim() || null,
    };

    if (
      !Number.isFinite(payload.latitude) ||
      !Number.isFinite(payload.longitude) ||
      payload.latitude < -90 ||
      payload.latitude > 90 ||
      payload.longitude < -180 ||
      payload.longitude > 180
    ) {
      setError("Enter valid latitude and longitude coordinates.");
      return;
    }

    const headers = getHeaders();
    if (!headers) return;

    setIsSaving(true);
    setError("");

    try {
      const isEditing = Boolean(editingShelter);

      const response = await fetch(
        isEditing
          ? `${API_BASE_URL}/api/admin/animal-shelters/${editingShelter!.id}`
          : `${API_BASE_URL}/api/admin/animal-shelters`,
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
        throw new Error(result.message || "Failed to save animal shelter.");
      }

      setShowShelterModal(false);
      setEditingShelter(null);
      setShelterForm(emptyShelterForm);
      await loadShelters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save shelter.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleShelterStatus(shelter: AnimalShelter) {
    const headers = getHeaders();
    if (!headers) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/animal-shelters/${shelter.id}/status`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ isActive: !shelter.isActive }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update shelter status.");
      }

      await loadShelters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    }
  }

  async function deleteShelter(shelter: AnimalShelter) {
    if (!window.confirm(`Delete "${shelter.name}" and its facilities?`)) {
      return;
    }

    const headers = getHeaders();
    if (!headers) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/animal-shelters/${shelter.id}`,
        {
          method: "DELETE",
          headers,
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete shelter.");
      }

      await loadShelters();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete shelter.",
      );
    }
  }

  function openCreateFacility(shelter: AnimalShelter) {
    setFacilityShelter(shelter);
    setEditingFacility(null);
    setFacilityForm(emptyFacilityForm);
    setShowFacilityModal(true);
  }

  function openEditFacility(
    shelter: AnimalShelter,
    facility: AnimalShelterFacility,
  ) {
    setFacilityShelter(shelter);
    setEditingFacility(facility);
    setFacilityForm({
      name: facility.name,
      nameBn: facility.nameBn ?? "",
      available: facility.available,
    });
    setShowFacilityModal(true);
  }

  async function handleFacilitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!facilityShelter) return;

    const headers = getHeaders();
    if (!headers) return;

    setIsSaving(true);
    setError("");

    try {
      const isEditing = Boolean(editingFacility);

      const url = isEditing
        ? `${API_BASE_URL}/api/admin/animal-shelters/${facilityShelter.id}/facilities/${editingFacility!.id}`
        : `${API_BASE_URL}/api/admin/animal-shelters/${facilityShelter.id}/facilities`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers,
        body: JSON.stringify({
          name: facilityForm.name.trim(),
          nameBn: facilityForm.nameBn.trim() || null,
          available: facilityForm.available,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save facility.");
      }

      setShowFacilityModal(false);
      setFacilityShelter(null);
      setEditingFacility(null);
      setFacilityForm(emptyFacilityForm);
      await loadShelters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save facility.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleFacility(
    shelter: AnimalShelter,
    facility: AnimalShelterFacility,
  ) {
    const headers = getHeaders();
    if (!headers) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/animal-shelters/${shelter.id}/facilities/${facility.id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ available: !facility.available }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update facility.");
      }

      await loadShelters();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update facility.",
      );
    }
  }

  async function deleteFacility(
    shelter: AnimalShelter,
    facility: AnimalShelterFacility,
  ) {
    if (!window.confirm(`Delete facility "${facility.name}"?`)) return;

    const headers = getHeaders();
    if (!headers) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/animal-shelters/${shelter.id}/facilities/${facility.id}`,
        {
          method: "DELETE",
          headers,
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete facility.");
      }

      await loadShelters();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete facility.",
      );
    }
  }

  const totalCapacity = shelters.reduce(
    (sum, shelter) => sum + shelter.capacity,
    0,
  );

  const totalOccupancy = shelters.reduce(
    (sum, shelter) => sum + (shelter.occupancy ?? 0),
    0,
  );

  const activeShelters = shelters.filter((shelter) => shelter.isActive).length;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-amethyst" />
            <h2 className="text-xl font-bold text-deep-sea-blue">
              Animal Shelters
            </h2>
          </div>
          <p className="text-sm text-deep-sea-blue/60">
            Manage animal-safe shelters, accepted animal types, and facilities.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void loadShelters()}
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
            Add Shelter
          </button>
        </div>
      </div>

      {/* Demo notice */}
      <div className="rounded-xl border border-cotton-candy/40 bg-cotton-candy/10 p-4">
        <p className="text-sm font-semibold text-deep-sea-blue">
          Demo resource data
        </p>
        <p className="mt-1 text-xs leading-relaxed text-deep-sea-blue/70">
          Shelter locations, contact details, capacity, and facility information
          may be illustrative. Verify resources before directing people or
          animals to them during an emergency.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          label="Shelters shown"
          value={shelters.length}
          icon={<Warehouse className="h-5 w-5" />}
        />
        <SummaryCard
          label="Active shelters"
          value={activeShelters}
          icon={<Check className="h-5 w-5" />}
        />
        <SummaryCard
          label="Total capacity"
          value={totalCapacity.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
        />
        <SummaryCard
          label="Current occupancy"
          value={totalOccupancy.toLocaleString()}
          icon={<PawPrint className="h-5 w-5" />}
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
            <label className={labelClass}>Animal type</label>
            <select
              value={animalTypeFilter}
              onChange={(event) => setAnimalTypeFilter(event.target.value)}
              className={inputClass}
            >
              <option value="">All animal types</option>
              {animalTypeOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
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
              <option value="all">All shelters</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Shelter list */}
      {isLoading ? (
        <div className="rounded-2xl border border-deep-sea-blue/10 bg-white p-12 text-center">
          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-amethyst" />
          <p className="mt-3 text-sm text-deep-sea-blue/60">
            Loading animal shelters...
          </p>
        </div>
      ) : shelters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-deep-sea-blue/20 bg-white p-12 text-center">
          <PawPrint className="mx-auto h-9 w-9 text-deep-sea-blue/30" />
          <h3 className="mt-3 font-semibold text-deep-sea-blue">
            No animal shelters found
          </h3>
          <p className="mt-1 text-sm text-deep-sea-blue/55">
            Try changing your filters or add a new shelter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {shelters.map((shelter) => {
            const isExpanded = expandedShelterId === shelter.id;
            const occupancy = shelter.occupancy ?? 0;
            const occupancyPercentage =
              shelter.capacity > 0
                ? Math.min((occupancy / shelter.capacity) * 100, 100)
                : 0;

            return (
              <div
                key={shelter.id}
                className="overflow-hidden rounded-2xl border border-deep-sea-blue/10 bg-white shadow-sm"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-deep-sea-blue">
                          {shelter.name}
                        </h3>
                        <StatusBadge active={shelter.isActive} />
                      </div>

                      {shelter.nameBn && (
                        <p className="mt-0.5 text-sm text-deep-sea-blue/55">
                          {shelter.nameBn}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-deep-sea-blue/60">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {shelter.address},{" "}
                          {districts.find(
                            (district) => district.id === shelter.districtId,
                          )?.name ?? shelter.districtId}
                        </span>

                        {shelter.contactPhone && (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            {shelter.contactPhone}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {shelter.animalTypes.map((type) => (
                          <AnimalTypeBadge key={type} type={type} />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:min-w-64">
                      <div className="rounded-xl bg-mint-cream p-3">
                        <p className="text-xs text-deep-sea-blue/60">
                          Capacity
                        </p>
                        <p className="mt-1 text-xl font-bold text-deep-sea-blue">
                          {shelter.capacity}
                        </p>
                      </div>

                      <div className="rounded-xl bg-amethyst/10 p-3">
                        <p className="text-xs text-deep-sea-blue/60">
                          Available
                        </p>
                        <p className="mt-1 text-xl font-bold text-deep-sea-blue">
                          {shelter.occupancy === null
                            ? "—"
                            : Math.max(0, shelter.capacity - shelter.occupancy)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Occupancy */}
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="font-medium text-deep-sea-blue/70">
                        Occupancy
                      </span>
                      <span className="text-deep-sea-blue/60">
                        {shelter.occupancy === null
                          ? "Not reported"
                          : `${occupancy} / ${shelter.capacity}`}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-deep-sea-blue/10">
                      <div
                        className="h-full rounded-full bg-amethyst transition-all"
                        style={{ width: `${occupancyPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-deep-sea-blue/10 pt-4">
                    <button
                      onClick={() =>
                        setExpandedShelterId(isExpanded ? null : shelter.id)
                      }
                      className="inline-flex items-center gap-2 text-sm font-semibold text-deep-sea-blue transition hover:text-amethyst"
                    >
                      <Warehouse className="h-4 w-4" />
                      Facilities ({shelter.facilities.length})
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openEditModal(shelter)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-deep-sea-blue/15 px-3 py-2 text-xs font-medium text-deep-sea-blue hover:bg-deep-sea-blue/5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      <button
                        onClick={() => void toggleShelterStatus(shelter)}
                        className={`rounded-lg px-3 py-2 text-xs font-medium ${
                          shelter.isActive
                            ? "bg-cotton-candy/15 text-night-bordeaux hover:bg-cotton-candy/25"
                            : "bg-mint-cream text-deep-sea-blue hover:bg-mint-cream/70"
                        }`}
                      >
                        {shelter.isActive ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => void deleteShelter(shelter)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Individual facility manager */}
                {isExpanded && (
                  <div className="border-t border-deep-sea-blue/10 bg-deep-sea-blue/[0.025] p-4 sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-deep-sea-blue">
                          Facility manager
                        </h4>
                        <p className="mt-0.5 text-xs text-deep-sea-blue/55">
                          Manage the services and facilities at this shelter.
                        </p>
                      </div>

                      <button
                        onClick={() => openCreateFacility(shelter)}
                        className="inline-flex items-center gap-2 rounded-lg bg-deep-sea-blue px-3 py-2 text-xs font-medium text-white hover:bg-deep-sea-blue/90"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Add Facility
                      </button>
                    </div>

                    {shelter.facilities.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-deep-sea-blue/20 p-5 text-center text-sm text-deep-sea-blue/55">
                        No facilities have been added to this shelter yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {shelter.facilities.map((facility) => (
                          <div
                            key={facility.id}
                            className="flex flex-col justify-between gap-3 rounded-xl border border-deep-sea-blue/10 bg-white p-3 sm:flex-row sm:items-center"
                          >
                            <div>
                              <p className="text-sm font-semibold text-deep-sea-blue">
                                {facility.name}
                              </p>
                              {facility.nameBn && (
                                <p className="mt-0.5 text-xs text-deep-sea-blue/50">
                                  {facility.nameBn}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge active={facility.available} />

                              <button
                                onClick={() =>
                                  void toggleFacility(shelter, facility)
                                }
                                className="rounded-lg border border-deep-sea-blue/15 px-2.5 py-1.5 text-xs text-deep-sea-blue hover:bg-deep-sea-blue/5"
                              >
                                Toggle
                              </button>

                              <button
                                onClick={() =>
                                  openEditFacility(shelter, facility)
                                }
                                className="rounded-lg border border-deep-sea-blue/15 p-2 text-deep-sea-blue hover:bg-deep-sea-blue/5"
                                aria-label="Edit facility"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() =>
                                  void deleteFacility(shelter, facility)
                                }
                                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                                aria-label="Delete facility"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Shelter modal */}
      {showShelterModal && (
        <Modal
          title={editingShelter ? "Edit Animal Shelter" : "Add Animal Shelter"}
          onClose={() => setShowShelterModal(false)}
        >
          <form onSubmit={handleShelterSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Shelter name" required>
                <input
                  required
                  value={shelterForm.name}
                  onChange={(event) =>
                    setShelterForm({
                      ...shelterForm,
                      name: event.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="Shelter name"
                />
              </FormField>

              <FormField label="Shelter name (Bangla)">
                <input
                  value={shelterForm.nameBn}
                  onChange={(event) =>
                    setShelterForm({
                      ...shelterForm,
                      nameBn: event.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="আশ্রয়কেন্দ্রের নাম"
                />
              </FormField>
            </div>

            <FormField label="Address" required>
              <textarea
                required
                rows={2}
                value={shelterForm.address}
                onChange={(event) =>
                  setShelterForm({
                    ...shelterForm,
                    address: event.target.value,
                  })
                }
                className={inputClass}
                placeholder="Full address"
              />
            </FormField>

            <FormField label="District" required>
              <select
                required
                value={shelterForm.districtId}
                onChange={(event) =>
                  setShelterForm({
                    ...shelterForm,
                    districtId: event.target.value,
                  })
                }
                className={inputClass}
              >
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Latitude" required>
                <input
                  required
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={shelterForm.latitude}
                  onChange={(event) =>
                    setShelterForm({
                      ...shelterForm,
                      latitude: event.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="22.1234"
                />
              </FormField>

              <FormField label="Longitude" required>
                <input
                  required
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={shelterForm.longitude}
                  onChange={(event) =>
                    setShelterForm({
                      ...shelterForm,
                      longitude: event.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="90.1234"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Maximum capacity" required>
                <input
                  required
                  type="number"
                  min="0"
                  value={shelterForm.capacity}
                  onChange={(event) =>
                    setShelterForm({
                      ...shelterForm,
                      capacity: event.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="100"
                />
              </FormField>

              <FormField label="Current occupancy">
                <input
                  type="number"
                  min="0"
                  value={shelterForm.occupancy}
                  onChange={(event) =>
                    setShelterForm({
                      ...shelterForm,
                      occupancy: event.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="Leave empty if unknown"
                />
              </FormField>
            </div>

            <FormField label="Accepted animal types" required>
              <div className="grid grid-cols-2 gap-2">
                {animalTypeOptions.map((type) => (
                  <label
                    key={type.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm transition ${
                      shelterForm.animalTypes.includes(type.value)
                        ? "border-amethyst bg-amethyst/10 text-deep-sea-blue"
                        : "border-deep-sea-blue/15 text-deep-sea-blue/70 hover:bg-deep-sea-blue/5"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={shelterForm.animalTypes.includes(type.value)}
                      onChange={() => toggleAnimalType(type.value)}
                      className="accent-amethyst"
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Contact person">
                <input
                  value={shelterForm.contactName}
                  onChange={(event) =>
                    setShelterForm({
                      ...shelterForm,
                      contactName: event.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="Contact name"
                />
              </FormField>

              <FormField label="Contact phone">
                <input
                  value={shelterForm.contactPhone}
                  onChange={(event) =>
                    setShelterForm({
                      ...shelterForm,
                      contactPhone: event.target.value,
                    })
                  }
                  className={inputClass}
                  placeholder="Phone number"
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-2 border-t border-deep-sea-blue/10 pt-4">
              <button
                type="button"
                onClick={() => setShowShelterModal(false)}
                className="rounded-xl border border-deep-sea-blue/15 px-4 py-2.5 text-sm text-deep-sea-blue hover:bg-deep-sea-blue/5"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-deep-sea-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-deep-sea-blue/90 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSaving
                  ? "Saving..."
                  : editingShelter
                    ? "Save Changes"
                    : "Create Shelter"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Facility modal */}
      {showFacilityModal && (
        <Modal
          title={editingFacility ? "Edit Facility" : "Add Facility"}
          onClose={() => setShowFacilityModal(false)}
        >
          <form onSubmit={handleFacilitySubmit} className="space-y-4">
            <FormField label="Facility name" required>
              <input
                required
                value={facilityForm.name}
                onChange={(event) =>
                  setFacilityForm({
                    ...facilityForm,
                    name: event.target.value,
                  })
                }
                className={inputClass}
                placeholder="e.g. Veterinary first aid"
              />
            </FormField>

            <FormField label="Facility name (Bangla)">
              <input
                value={facilityForm.nameBn}
                onChange={(event) =>
                  setFacilityForm({
                    ...facilityForm,
                    nameBn: event.target.value,
                  })
                }
                className={inputClass}
                placeholder="e.g. পশু চিকিৎসার প্রাথমিক সেবা"
              />
            </FormField>

            <label className="flex items-center gap-3 rounded-xl border border-deep-sea-blue/10 p-3">
              <input
                type="checkbox"
                checked={facilityForm.available}
                onChange={(event) =>
                  setFacilityForm({
                    ...facilityForm,
                    available: event.target.checked,
                  })
                }
                className="h-4 w-4 accent-amethyst"
              />
              <span className="text-sm font-medium text-deep-sea-blue">
                Facility is currently available
              </span>
            </label>

            <div className="flex justify-end gap-2 border-t border-deep-sea-blue/10 pt-4">
              <button
                type="button"
                onClick={() => setShowFacilityModal(false)}
                className="rounded-xl border border-deep-sea-blue/15 px-4 py-2.5 text-sm text-deep-sea-blue hover:bg-deep-sea-blue/5"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-deep-sea-blue px-4 py-2.5 text-sm font-medium text-white hover:bg-deep-sea-blue/90 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Facility"}
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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-mint-cream text-deep-sea-blue"
          : "bg-cotton-candy/20 text-night-bordeaux"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function AnimalTypeBadge({ type }: { type: AnimalType }) {
  const label =
    animalTypeOptions.find((option) => option.value === type)?.label ?? type;

  return (
    <span className="rounded-full bg-amethyst/10 px-2.5 py-1 text-xs font-medium text-deep-sea-blue">
      {label}
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
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
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
