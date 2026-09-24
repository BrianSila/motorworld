import { apiRequest } from "./client";
import type { Car, Enquiry, Paginated, Role, TestDrive, User } from "./types";

export type Analytics = {
  total_cars: number;
  available_cars: number;
  sold_cars: number;
  total_enquiries: number;
  pending_enquiries: number;
};

export function getAnalytics() {
  return apiRequest<Analytics>("/admin/analytics", { auth: true });
}

export function getPopularCars() {
  return apiRequest<{ most_viewed: Car[]; most_favourited: Car[] }>("/admin/cars/popular", {
    auth: true,
  });
}

export function listUsers(params: { page?: number; limit?: number } = {}) {
  return apiRequest<Paginated<"users", User>>("/admin/users", { auth: true, params });
}

export function updateUserRole(userId: number, role: Role) {
  return apiRequest<{ user: User }>(`/admin/users/${userId}/role`, {
    method: "PUT",
    body: { role },
    auth: true,
  });
}

/**
 * Detailed profile and history for one account.
 * Related collections are optional — the backend may omit any of them.
 */
export type UserDetail = {
  user: User;
  cars?: Car[];
  enquiries?: Enquiry[];
  test_drives?: TestDrive[];
  favourites?: { id: number; car_id: number; created_at: string; car?: Partial<Car> }[];
};

export function getUserDetail(userId: number) {
  return apiRequest<UserDetail>(`/admin/users/${userId}`, { auth: true });
}

export function listAllEnquiries(params: { page?: number; limit?: number } = {}) {
  return apiRequest<Paginated<"enquiries", Enquiry>>("/admin/enquiries", {
    auth: true,
    params,
  });
}

export function listAllTestDrives(params: { page?: number; limit?: number } = {}) {
  return apiRequest<Paginated<"test_drives", TestDrive>>("/admin/test-drives", {
    auth: true,
    params,
  });
}
