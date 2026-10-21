import { apiRequest } from "./client";
import type { User } from "./types";

export type AuthResponse = { user: User; token: string };

export function register(payload: {
  name: string;
  email: string;
  phone?: string | null;
  password: string;
}) {
  return apiRequest<AuthResponse>("/register", { method: "POST", body: payload });
}

export function login(payload: { email: string; password: string }) {
  return apiRequest<AuthResponse>("/login", { method: "POST", body: payload });
}

export function loginWithGoogle(payload: {
  credential?: string;
  email?: string;
  name?: string;
  google_id?: string;
  phone?: string | null;
}) {
  return apiRequest<AuthResponse>("/google", { method: "POST", body: payload });
}

export function logout() {
  return apiRequest<{ message: string }>("/logout", { method: "POST", auth: true });
}

export function forgotPassword(email: string) {
  return apiRequest<{ message: string }>("/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function getProfile() {
  return apiRequest<{ user: User }>("/profile", { auth: true });
}

export function updateProfile(payload: { name?: string; phone?: string | null }) {
  return apiRequest<{ user: User }>("/profile", { method: "PUT", body: payload, auth: true });
}
