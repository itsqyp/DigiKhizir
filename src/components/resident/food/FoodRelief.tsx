import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../lib/api";
import {
  MapPin,
  Package,
  Utensils,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface FoodInventoryItem {
  id: string;
  itemName: string;
  itemNameBn: string | null;
  quantity: number;
  unit: string;
}

interface FoodPoint {
  id: string;
  name: string;
  nameBn: string | null;
  address: string;
  districtId: string;
  latitude: number | null;
  longitude: number | null;
  dryFoodCapacityKg: number | null;
  dryFoodStockKg: number | null;
  inventory: FoodInventoryItem[];
}

interface FoodResponse {
  success: boolean;
  count: number;
  data: FoodPoint[];
  message?: string;
}

interface FoodReliefProps {
  districtId: string;
}

function FoodRelief({ districtId }: FoodReliefProps) {
  const [foodPoints, setFoodPoints] = useState<FoodPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchFoodPoints() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/food?districtId=${encodeURIComponent(
            districtId,
          )}`,
          { signal: controller.signal },
        );

        const result: FoodResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load food distribution locations.",
          );
        }

        setFoodPoints(result.data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading food locations.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchFoodPoints();

    return () => controller.abort();
  }, [districtId]);

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 text-deep-sea-blue">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <p className="font-medium">Loading food and relief locations...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-8 rounded-2xl border border-red-200 bg-white p-6">
        <div className="flex items-start gap-3 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h2 className="font-semibold">Unable to load food locations</h2>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Utensils className="h-6 w-6 text-amethyst" />
            <h2 className="text-xl font-bold text-deep-sea-blue">
              Food & Relief
            </h2>
          </div>
          <p className="mt-1 text-sm text-deep-sea-blue/65">
            Food distribution points in your selected district.
          </p>
        </div>

        <span className="rounded-full bg-mint-cream px-3 py-1 text-sm font-semibold text-deep-sea-blue">
          {foodPoints.length} locations
        </span>
      </div>

      {foodPoints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-deep-sea-blue/20 bg-white p-8 text-center">
          <Package className="mx-auto h-9 w-9 text-deep-sea-blue/40" />
          <h3 className="mt-3 font-semibold text-deep-sea-blue">
            No food locations found
          </h3>
          <p className="mt-1 text-sm text-deep-sea-blue/60">
            There are currently no listed food distribution points with
            available food in this district.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {foodPoints.map((point) => (
            <article
              key={point.id}
              className="rounded-2xl border border-deep-sea-blue/10 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-mint-cream p-3">
                  <Package className="h-6 w-6 text-deep-sea-blue" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-deep-sea-blue">{point.name}</h3>

                  {point.nameBn && (
                    <p className="mt-0.5 text-sm text-deep-sea-blue/65">
                      {point.nameBn}
                    </p>
                  )}

                  <div className="mt-2 flex items-start gap-1.5 text-sm text-deep-sea-blue/65">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{point.address}</span>
                  </div>
                </div>
              </div>

              {(point.dryFoodStockKg !== null ||
                point.dryFoodCapacityKg !== null) && (
                <div className="mt-5 rounded-xl bg-mint-cream p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-deep-sea-blue/60">
                    Dry food stock
                  </p>

                  <p className="mt-1 text-lg font-bold text-deep-sea-blue">
                    {point.dryFoodStockKg ?? "Not specified"}{" "}
                    {point.dryFoodStockKg !== null ? "kg" : ""}
                    {point.dryFoodCapacityKg !== null && (
                      <span className="text-sm font-medium text-deep-sea-blue/60">
                        {" "}
                        / {point.dryFoodCapacityKg} kg capacity
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div className="mt-5">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-deep-sea-blue">
                  <Utensils className="h-4 w-4" />
                  Available food items
                </h4>

                {point.inventory.length === 0 ? (
                  <p className="text-sm text-deep-sea-blue/55">
                    No individual food items listed.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {point.inventory.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-deep-sea-blue/10 bg-white px-3 py-2"
                      >
                        <p className="text-sm font-medium text-deep-sea-blue">
                          {item.itemName}
                        </p>

                        {item.itemNameBn && (
                          <p className="text-xs text-deep-sea-blue/55">
                            {item.itemNameBn}
                          </p>
                        )}

                        <p className="mt-1 text-xs font-semibold text-amethyst">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-deep-sea-blue/50">
        Demo data: listed locations and stock levels are illustrative and have
        not been verified. Confirm availability before travelling.
      </p>
    </section>
  );
}

export default FoodRelief;
