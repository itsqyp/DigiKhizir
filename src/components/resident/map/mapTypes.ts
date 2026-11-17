export type MapFeatureType = "shelter" | "food" | "animal";

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapFacility extends MapCoordinates {
  id: string;
  name: string;
  nameBn?: string | null;
  address: string;
  type: MapFeatureType;
  distanceKm?: number;
  capacity?: number;
  occupancy?: number | null;
  availableCapacity?: number | null;
  dryFoodStockKg?: number | null;
  animalTypes?: string[];
  facilities?: {
    id: string;
    name: string;
    nameBn?: string | null;
    available?: boolean;
  }[];
}

export interface MapAlert {
  id: string;
  title: string;
  message: string;
  severity: string;
  districtIds: string[];
  source?: string | null;
  expiresAt?: string | null;
}

export interface MapRoute {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
}
