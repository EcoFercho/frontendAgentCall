import { apiRequest } from "@/shared/api/http-client";
import { ShiftUser } from "@/shared/types";

type ShiftUserPayload = {
  firstName: string;
  lastName: string;
  phone: string;
  shiftDate: string;
  shiftStart: string;
  shiftEnd: string;
  isMaster: boolean;
};

export function listShiftUsers(token: string, shiftDate?: string) {
  const query = shiftDate ? `?shiftDate=${encodeURIComponent(shiftDate)}` : "";
  return apiRequest<ShiftUser[]>(`/shift-users${query}`, "GET", undefined, token);
}

export function createShiftUser(payload: ShiftUserPayload, token: string) {
  return apiRequest<ShiftUser>("/shift-users", "POST", payload, token);
}

export function updateShiftUser(id: string, payload: ShiftUserPayload, token: string) {
  return apiRequest<ShiftUser>(`/shift-users/${id}`, "PUT", payload, token);
}

export function deleteShiftUser(id: string, token: string) {
  return apiRequest<{ ok: true }>(`/shift-users/${id}`, "DELETE", undefined, token);
}
