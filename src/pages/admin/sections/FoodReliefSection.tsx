import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  MapPin,
  Package,
  Phone,
  Warehouse,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Utensils,
} from "lucide-react";

import { API_BASE_URL } from "../../../lib/api";
import { clearAdminSession, getAdminSession } from "../../../lib/adminAuth";

interface ReliefInventory {
  id: string;
  category: string;
  itemName: string;
  itemNameBn: string | null;
  quantity: number;
  unit: string;
  reliefPointId: string;
  createdAt: string;
  updatedAt: string;
}

interface FoodPoint {
  id: string;
  name: string;
  nameBn: string | null;
  address: string;
  districtId: string;
  latitude: number;
  longitude: number;
  contactPhone: string | null;
  dryFoodCapacityKg: number | null;
  dryFoodStockKg: number | null;
  isActive: boolean;
  inventory: ReliefInventory[];
  createdAt: string;
  updatedAt: string;
}

interface FoodPointForm {
  name: string;
  nameBn: string;
  address: string;
  districtId: string;
  latitude: string;
  longitude: string;
  contactPhone: string;
  dryFoodCapacityKg: string;
  dryFoodStockKg: string;
}

interface InventoryForm {
  category: string;
  itemName: string;
  itemNameBn: string;
  quantity: string;
  unit: string;
}

type FilterStatus = "all" | "active" | "inactive";

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

const categories = [
  { value: "FOOD", label: "Food" },
  { value: "WATER", label: "Water" },
  { value: "MEDICINE", label: "Medicine" },
  { value: "CLOTHING", label: "Clothing" },
  { value: "OTHER", label: "Other" },
];

const emptyPointForm: FoodPointForm = {
  name: "",
  nameBn: "",
  address: "",
  districtId: "",
  latitude: "",
  longitude: "",
  contactPhone: "",
  dryFoodCapacityKg: "",
  dryFoodStockKg: "",
};

const emptyInventoryForm: InventoryForm = {
  category: "FOOD",
  itemName: "",
  itemNameBn: "",
  quantity: "",
  unit: "kg",
};

export default function FoodReliefSection() {
  const navigate = useNavigate();

  const [foodPoints, setFoodPoints] = useState<FoodPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [districtFilter, setDistrictFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<FoodPoint | null>(null);
  const [pointForm, setPointForm] = useState<FoodPointForm>(emptyPointForm);

  const [selectedPoint, setSelectedPoint] = useState<FoodPoint | null>(null);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] =
    useState<ReliefInventory | null>(null);
  const [inventoryForm, setInventoryForm] =
    useState<InventoryForm>(emptyInventoryForm);

  const [expandedPointId, setExpandedPointId] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const session = getAdminSession();

    if (!session) {
      clearAdminSession();
      navigate("/admin/login");
      return null;
    }

    return {
      Authorization: `Bearer ${session.token}`,
      "Content-Type": "application/json",
    };
  };

  // Used by buttons and form submissions.
  async function loadFoodPoints() {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const params = new URLSearchParams();
      params.set("status", statusFilter);

      if (districtFilter) {
        params.set("districtId", districtFilter);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/food?${params.toString()}`,
        { headers },
      );

      if (response.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load food points.");
      }

      setFoodPoints(result.data as FoodPoint[]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  // Fetch when filters change. Keep the async work inside the effect.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchFoodPoints() {
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
          `${API_BASE_URL}/api/admin/food?${params.toString()}`,
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
          throw new Error(result.message || "Failed to load food points.");
        }

        if (!controller.signal.aborted) {
          setFoodPoints(result.data as FoodPoint[]);
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

    void fetchFoodPoints();

    return () => controller.abort();
  }, [districtFilter, statusFilter, navigate]);

  function openCreatePointModal() {
    setEditingPoint(null);
    setPointForm(emptyPointForm);
    setIsPointModalOpen(true);
  }

  function openEditPointModal(point: FoodPoint) {
    setEditingPoint(point);
    setPointForm({
      name: point.name,
      nameBn: point.nameBn ?? "",
      address: point.address,
      districtId: point.districtId,
      latitude: String(point.latitude),
      longitude: String(point.longitude),
      contactPhone: point.contactPhone ?? "",
      dryFoodCapacityKg:
        point.dryFoodCapacityKg != null ? String(point.dryFoodCapacityKg) : "",
      dryFoodStockKg:
        point.dryFoodStockKg != null ? String(point.dryFoodStockKg) : "",
    });
    setIsPointModalOpen(true);
  }

  async function handlePointSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const headers = getAuthHeaders();
    if (!headers) return;

    const latitude = Number(pointForm.latitude);
    const longitude = Number(pointForm.longitude);

    if (
      !pointForm.name.trim() ||
      !pointForm.address.trim() ||
      !pointForm.districtId ||
      !pointForm.latitude ||
      !pointForm.longitude ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      setError("Please complete all required fields with valid coordinates.");
      return;
    }

    const capacity =
      pointForm.dryFoodCapacityKg.trim() === ""
        ? null
        : Number(pointForm.dryFoodCapacityKg);

    const stock =
      pointForm.dryFoodStockKg.trim() === ""
        ? null
        : Number(pointForm.dryFoodStockKg);

    if (
      (capacity !== null && (!Number.isInteger(capacity) || capacity < 0)) ||
      (stock !== null && (!Number.isInteger(stock) || stock < 0))
    ) {
      setError(
        "Dry food capacity and stock must be non-negative whole numbers.",
      );
      return;
    }

    if (capacity !== null && stock !== null && stock > capacity) {
      setError("Dry food stock cannot exceed capacity.");
      return;
    }

    const body = {
      name: pointForm.name.trim(),
      nameBn: pointForm.nameBn.trim() || null,
      address: pointForm.address.trim(),
      districtId: pointForm.districtId,
      latitude,
      longitude,
      contactPhone: pointForm.contactPhone.trim() || null,
      dryFoodCapacityKg: capacity,
      dryFoodStockKg: stock,
    };

    setIsSaving(true);
    setError("");

    try {
      const isEditing = Boolean(editingPoint);

      const response = await fetch(
        isEditing
          ? `${API_BASE_URL}/api/admin/food/${editingPoint!.id}`
          : `${API_BASE_URL}/api/admin/food`,
        {
          method: isEditing ? "PUT" : "POST",
          headers,
          body: JSON.stringify(body),
        },
      );

      if (response.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save food point.");
      }

      setIsPointModalOpen(false);
      setEditingPoint(null);
      setPointForm(emptyPointForm);
      await loadFoodPoints();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save food point.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function togglePointStatus(point: FoodPoint) {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/food/${point.id}/status`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ isActive: !point.isActive }),
        },
      );

      if (response.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update status.");
      }

      await loadFoodPoints();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    }
  }

  async function deletePoint(point: FoodPoint) {
    const confirmed = window.confirm(
      `Delete "${point.name}" and all its inventory records? This action cannot be undone.`,
    );

    if (!confirmed) return;

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/food/${point.id}`,
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
        throw new Error(result.message || "Failed to delete food point.");
      }

      if (expandedPointId === point.id) {
        setExpandedPointId(null);
      }

      await loadFoodPoints();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete food point.",
      );
    }
  }

  function openAddInventory(point: FoodPoint) {
    setSelectedPoint(point);
    setEditingInventory(null);
    setInventoryForm(emptyInventoryForm);
    setIsInventoryModalOpen(true);
  }

  function openEditInventory(point: FoodPoint, item: ReliefInventory) {
    setSelectedPoint(point);
    setEditingInventory(item);
    setInventoryForm({
      category: item.category,
      itemName: item.itemName,
      itemNameBn: item.itemNameBn ?? "",
      quantity: String(item.quantity),
      unit: item.unit,
    });
    setIsInventoryModalOpen(true);
  }

  async function handleInventorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPoint) return;

    const headers = getAuthHeaders();
    if (!headers) return;

    const quantity = Number(inventoryForm.quantity);

    if (
      !inventoryForm.itemName.trim() ||
      !inventoryForm.unit.trim() ||
      inventoryForm.quantity.trim() === "" ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      setError("Enter a valid item name, quantity, and unit.");
      return;
    }

    const body = {
      category: inventoryForm.category,
      itemName: inventoryForm.itemName.trim(),
      itemNameBn: inventoryForm.itemNameBn.trim() || null,
      quantity,
      unit: inventoryForm.unit.trim(),
    };

    setIsSaving(true);
    setError("");

    try {
      const isEditing = Boolean(editingInventory);

      const url = isEditing
        ? `${API_BASE_URL}/api/admin/food/${selectedPoint.id}/inventory/${editingInventory!.id}`
        : `${API_BASE_URL}/api/admin/food/${selectedPoint.id}/inventory`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        clearAdminSession();
        navigate("/admin/login");
        return;
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save inventory item.");
      }

      setIsInventoryModalOpen(false);
      setSelectedPoint(null);
      setEditingInventory(null);
      setInventoryForm(emptyInventoryForm);
      await loadFoodPoints();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save inventory item.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteInventoryItem(point: FoodPoint, item: ReliefInventory) {
    const confirmed = window.confirm(
      `Delete "${item.itemName}" from ${point.name}?`,
    );

    if (!confirmed) return;

    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/food/${point.id}/inventory/${item.id}`,
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
        throw new Error(result.message || "Failed to delete inventory item.");
      }

      await loadFoodPoints();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete inventory item.",
      );
    }
  }

  const activeCount = foodPoints.filter((point) => point.isActive).length;

  const totalStock = foodPoints.reduce(
    (total, point) => total + (point.dryFoodStockKg ?? 0),
    0,
  );

  const totalInventoryItems = foodPoints.reduce(
    (total, point) => total + point.inventory.length,
    0,
  );

  function getDistrictName(id: string) {
    return districts.find((district) => district.id === id)?.name ?? id;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cotton-candy/20 text-night-bordeaux">
              <Utensils size={21} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-deep-sea-blue">
                Food & Relief
              </h2>
              <p className="text-sm text-slate-500">
                Manage distribution points and relief inventory
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadFoodPoints()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreatePointModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-deep-sea-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1c3048]"
          >
            <Plus size={17} />
            Add Food Point
          </button>
        </div>
      </div>

      {/* Demo data notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <AlertCircle size={19} className="mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold">Demo resource data</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            Distribution points and stock figures may be illustrative sample
            data. Verify availability and contact details before relying on them
            during an emergency.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<Warehouse size={20} />}
          label="Food Points Shown"
          value={foodPoints.length}
          detail="Matching current filters"
          iconColor="bg-blue-50 text-blue-700"
        />

        <SummaryCard
          icon={<CheckCircle2 size={20} />}
          label="Active Points"
          value={activeCount}
          detail="Currently enabled"
          iconColor="bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          icon={<Package size={20} />}
          label="Dry Food Stock"
          value={`${totalStock.toLocaleString()} kg`}
          detail="Combined recorded stock"
          iconColor="bg-amber-50 text-amber-700"
        />

        <SummaryCard
          icon={<Utensils size={20} />}
          label="Inventory Records"
          value={totalInventoryItems}
          detail="Across displayed points"
          iconColor="bg-purple-50 text-purple-700"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label
            htmlFor="food-district-filter"
            className="mb-1.5 block text-xs font-semibold text-slate-500"
          >
            DISTRICT
          </label>
          <select
            id="food-district-filter"
            value={districtFilter}
            onChange={(event) => setDistrictFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-deep-sea-blue"
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
            htmlFor="food-status-filter"
            className="mb-1.5 block text-xs font-semibold text-slate-500"
          >
            STATUS
          </label>
          <select
            id="food-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as FilterStatus)
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-deep-sea-blue"
          >
            <option value="all">All points</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
      </div>

      {/* Food point list */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-deep-sea-blue">
              Distribution Points
            </h3>
            <p className="text-xs text-slate-500">
              View locations and manage their inventory
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {foodPoints.length} point{foodPoints.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading food distribution points...
          </div>
        ) : foodPoints.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Package size={25} />
            </div>
            <h3 className="font-semibold text-slate-700">
              No food points found
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Try changing your filters or add a new food distribution point.
            </p>
            <button
              type="button"
              onClick={openCreatePointModal}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-deep-sea-blue px-4 py-2 text-sm font-semibold text-white hover:bg-[#1c3048]"
            >
              <Plus size={16} />
              Add Food Point
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {foodPoints.map((point) => {
              const isExpanded = expandedPointId === point.id;

              return (
                <div key={point.id}>
                  <div className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-deep-sea-blue">
                          {point.name}
                        </h4>
                        <StatusBadge isActive={point.isActive} />
                      </div>

                      {point.nameBn && (
                        <p className="mt-0.5 text-sm text-slate-500">
                          {point.nameBn}
                        </p>
                      )}

                      <div className="mt-2 flex flex-col gap-1.5 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-4">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={13} />
                          {point.address}, {getDistrictName(point.districtId)}
                        </span>

                        {point.contactPhone && (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone size={13} />
                            {point.contactPhone}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-xs">
                        <span className="text-slate-500">
                          Dry food stock:{" "}
                          <strong className="text-slate-700">
                            {point.dryFoodStockKg ?? "—"} kg
                          </strong>
                        </span>
                        <span className="text-slate-500">
                          Capacity:{" "}
                          <strong className="text-slate-700">
                            {point.dryFoodCapacityKg ?? "—"} kg
                          </strong>
                        </span>
                        <span className="text-slate-500">
                          Inventory:{" "}
                          <strong className="text-slate-700">
                            {point.inventory.length} items
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPointId(isExpanded ? null : point.id)
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <Package size={14} />
                        Inventory
                        {isExpanded ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditPointModal(point)}
                        title="Edit food point"
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => void togglePointStatus(point)}
                        title={point.isActive ? "Deactivate" : "Activate"}
                        className={`rounded-lg border p-2 ${
                          point.isActive
                            ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {point.isActive ? (
                          <XCircle size={15} />
                        ) : (
                          <CheckCircle2 size={15} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => void deletePoint(point)}
                        title="Delete food point"
                        className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Inventory expansion */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h5 className="font-semibold text-deep-sea-blue">
                            Inventory at {point.name}
                          </h5>
                          <p className="text-xs text-slate-500">
                            Manage the stock records for this location
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openAddInventory(point)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-deep-sea-blue px-3 py-2 text-xs font-semibold text-white hover:bg-[#1c3048]"
                        >
                          <Plus size={14} />
                          Add Inventory Item
                        </button>
                      </div>

                      {point.inventory.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                          No inventory records at this location yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                          <table className="w-full min-w-[650px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                              <tr>
                                <th className="px-4 py-3 font-semibold">
                                  Item
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  Category
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  Quantity
                                </th>
                                <th className="px-4 py-3 font-semibold">
                                  Unit
                                </th>
                                <th className="px-4 py-3 text-right font-semibold">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {point.inventory.map((item) => (
                                <tr key={item.id}>
                                  <td className="px-4 py-3">
                                    <p className="font-medium text-slate-700">
                                      {item.itemName}
                                    </p>
                                    {item.itemNameBn && (
                                      <p className="text-xs text-slate-500">
                                        {item.itemNameBn}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <CategoryBadge category={item.category} />
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-slate-700">
                                    {item.quantity.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500">
                                    {item.unit}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openEditInventory(point, item)
                                        }
                                        title="Edit inventory item"
                                        className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void deleteInventoryItem(point, item)
                                        }
                                        title="Delete inventory item"
                                        className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Food point modal */}
      {isPointModalOpen && (
        <Modal
          title={editingPoint ? "Edit Food Point" : "Add Food Point"}
          onClose={() => {
            setIsPointModalOpen(false);
            setEditingPoint(null);
            setError("");
          }}
        >
          <form onSubmit={handlePointSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Point Name" required>
                <input
                  required
                  value={pointForm.name}
                  onChange={(event) =>
                    setPointForm({ ...pointForm, name: event.target.value })
                  }
                  placeholder="e.g. Bhola Relief Center"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Name in Bangla">
                <input
                  value={pointForm.nameBn}
                  onChange={(event) =>
                    setPointForm({ ...pointForm, nameBn: event.target.value })
                  }
                  placeholder="বাংলা নাম"
                  className={inputClass}
                />
              </FormField>
            </div>

            <FormField label="Address" required>
              <input
                required
                value={pointForm.address}
                onChange={(event) =>
                  setPointForm({ ...pointForm, address: event.target.value })
                }
                placeholder="Full address"
                className={inputClass}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="District" required>
                <select
                  required
                  value={pointForm.districtId}
                  onChange={(event) =>
                    setPointForm({
                      ...pointForm,
                      districtId: event.target.value,
                    })
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

              <FormField label="Contact Phone">
                <input
                  value={pointForm.contactPhone}
                  onChange={(event) =>
                    setPointForm({
                      ...pointForm,
                      contactPhone: event.target.value,
                    })
                  }
                  placeholder="01XXXXXXXXX"
                  className={inputClass}
                />
              </FormField>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Location Coordinates
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Latitude" required>
                  <input
                    required
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={pointForm.latitude}
                    onChange={(event) =>
                      setPointForm({
                        ...pointForm,
                        latitude: event.target.value,
                      })
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
                    value={pointForm.longitude}
                    onChange={(event) =>
                      setPointForm({
                        ...pointForm,
                        longitude: event.target.value,
                      })
                    }
                    placeholder="e.g. 90.648"
                    className={inputClass}
                  />
                </FormField>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Dry Food Storage (kg)
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Storage Capacity">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={pointForm.dryFoodCapacityKg}
                    onChange={(event) =>
                      setPointForm({
                        ...pointForm,
                        dryFoodCapacityKg: event.target.value,
                      })
                    }
                    placeholder="e.g. 500"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Current Stock">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={pointForm.dryFoodStockKg}
                    onChange={(event) =>
                      setPointForm({
                        ...pointForm,
                        dryFoodStockKg: event.target.value,
                      })
                    }
                    placeholder="e.g. 250"
                    className={inputClass}
                  />
                </FormField>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Leave either field blank if the information is not available.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsPointModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-deep-sea-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1c3048] disabled:opacity-60"
              >
                {isSaving && <RefreshCw size={15} className="animate-spin" />}
                {editingPoint ? "Save Changes" : "Create Food Point"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Inventory modal */}
      {isInventoryModalOpen && selectedPoint && (
        <Modal
          title={
            editingInventory ? "Edit Inventory Item" : "Add Inventory Item"
          }
          onClose={() => {
            setIsInventoryModalOpen(false);
            setSelectedPoint(null);
            setEditingInventory(null);
            setError("");
          }}
        >
          <form onSubmit={handleInventorySubmit} className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">
                DISTRIBUTION POINT
              </p>
              <p className="mt-1 font-semibold text-deep-sea-blue">
                {selectedPoint.name}
              </p>
            </div>

            <FormField label="Category" required>
              <select
                required
                value={inventoryForm.category}
                onChange={(event) =>
                  setInventoryForm({
                    ...inventoryForm,
                    category: event.target.value,
                  })
                }
                className={inputClass}
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Item Name" required>
                <input
                  required
                  value={inventoryForm.itemName}
                  onChange={(event) =>
                    setInventoryForm({
                      ...inventoryForm,
                      itemName: event.target.value,
                    })
                  }
                  placeholder="e.g. Chira"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Name in Bangla">
                <input
                  value={inventoryForm.itemNameBn}
                  onChange={(event) =>
                    setInventoryForm({
                      ...inventoryForm,
                      itemNameBn: event.target.value,
                    })
                  }
                  placeholder="e.g. চিড়া"
                  className={inputClass}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Quantity" required>
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={inventoryForm.quantity}
                  onChange={(event) =>
                    setInventoryForm({
                      ...inventoryForm,
                      quantity: event.target.value,
                    })
                  }
                  placeholder="e.g. 100"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Unit" required>
                <input
                  required
                  value={inventoryForm.unit}
                  onChange={(event) =>
                    setInventoryForm({
                      ...inventoryForm,
                      unit: event.target.value,
                    })
                  }
                  placeholder="e.g. kg, packets, litres"
                  className={inputClass}
                />
              </FormField>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsInventoryModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-deep-sea-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1c3048] disabled:opacity-60"
              >
                {isSaving && <RefreshCw size={15} className="animate-spin" />}
                {editingInventory ? "Save Changes" : "Add Inventory"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#253d5b] focus:ring-2 focus:ring-[#253d5b]/10";

function SummaryCard({
  icon,
  label,
  value,
  detail,
  iconColor,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  detail: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-deep-sea-blue">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconColor}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        isActive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    FOOD: "bg-amber-50 text-amber-700",
    WATER: "bg-blue-50 text-blue-700",
    MEDICINE: "bg-purple-50 text-purple-700",
    CLOTHING: "bg-pink-50 text-pink-700",
    OTHER: "bg-slate-100 text-slate-600",
  };

  const label =
    categories.find((item) => item.value === category)?.label ?? category;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        colors[category] ?? colors.OTHER
      }`}
    >
      {label}
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
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-deep-sea-blue">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
