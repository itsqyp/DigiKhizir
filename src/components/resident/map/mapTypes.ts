export type MapFeatureType = "shelter" | "food" | "animal" | "alert";

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapFacility {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: MapFeatureType;
  nameBn?: string | null;
  availableCapacity?: number | null;
  capacity?: number;
  occupancy?: number | null;
  facilities?: {
    id: string;
    name: string;
    nameBn?: string | null;
    available?: boolean;
  }[];
  animalTypes?: string[];
  dryFoodStockKg?: number | null;
}

export interface MapMarkerProps {
  facility: MapFacility;
  isNearest: boolean;
  onSelect: (facility: MapFacility) => void;
}
