export type SOSStatus =
  | "PENDING"
  | "ACKNOWLEDGED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CANCELLED";

export type EmergencyType =
  | "MEDICAL"
  | "RESCUE"
  | "FLOOD_TRAPPED"
  | "FOOD_WATER"
  | "ANIMAL_RESCUE"
  | "OTHER";

export interface SOSRequest {
  id: string;
  name: string | null;
  phone: string | null;
  districtId: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  description: string | null;
  emergencyType: EmergencyType;
  status: SOSStatus;
  createdAt: string;
}

export interface SOSListResponse {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  data: SOSRequest[];
}
