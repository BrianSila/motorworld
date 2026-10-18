// api/car.ts

import { apiRequest, type QueryParams } from "./client";
import type { Car, Paginated } from "./types";

export type CarListResponse = Paginated<"cars", Car>;

export type CarFilters = {
  make?: string | undefined;
  model?: string | undefined;
  year_min?: number | string | undefined;
  year_max?: number | string | undefined;
  price_min?: number | string | undefined;
  price_max?: number | string | undefined;
  fuel_type?: string | undefined;
  transmission?: string | undefined;
  condition?: string | undefined;
  location?: string | undefined;
  is_available?: string | undefined;
  q?: string | undefined;
  sort_by?: string | undefined;
  sort_order?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
};

export function listCars(filters: CarFilters) {
  return apiRequest<CarListResponse>("/cars", { params: filters as QueryParams });
}

export function getFilterOptions() {
  return apiRequest<{
    makes: string[];
    models: string[];
    years: number[];
    locations: string[];
  }>("/cars/filters");
}

export function getCar(carId: number) {
  return apiRequest<{ car: Car }>(`/cars/${carId}`);
}

export type CarPayload = {
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  mileage?: number | null | undefined;
  condition: string;
  fuel_type: string;
  transmission: string;
  color?: string | null | undefined;
  description?: string | null | undefined;
  location?: string | null | undefined;
  is_negotiable: boolean;
  images: string[];
};

export function createCar(payload: CarPayload, imageFiles: File[]) {
  const form = new FormData();
  const { images: _images, ...fields } = payload;
  for (const [key, value] of Object.entries(fields)) {
    if (value !== null && value !== undefined) form.append(key, String(value));
  }
  for (const image of imageFiles) form.append("images", image);
  return apiRequest<{ car: Car }>("/cars", { method: "POST", body: form, auth: true });
}

export function updateCar(carId: number, payload: Partial<CarPayload>) {
  return apiRequest<{ car: Car }>(`/cars/${carId}`, {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

export function deleteCar(carId: number) {
  return apiRequest<{ message: string }>(`/cars/${carId}`, { method: "DELETE", auth: true });
}

export function updateCarStatus(
  carId: number,
  payload: { is_sold?: boolean; is_available?: boolean },
) {
  return apiRequest<{ car: Car }>(`/cars/${carId}/status`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}
