import { apiRequest } from "@/shared/api/http-client";
import { AdminUser, LoginResponse } from "@/shared/types";

export function loginAdmin(email: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", "POST", { email, password });
}

export function getCurrentAdmin(token: string) {
  return apiRequest<AdminUser>("/auth/me", "GET", undefined, token);
}
