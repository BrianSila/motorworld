export type Role = "user" | "admin";

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  is_blocked: boolean;
  created_at: string;
};

export type CarImage = {
  id: number;
  url: string;
  is_primary: boolean;
};

export type CarSeller = {
  id: number;
  name: string;
  phone: string | null;
  role?: Role | string;
};

export type Car = {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  mileage: number | null;
  condition: string;
  fuel_type: string;
  transmission: string;
  color: string | null;
  description: string | null;
  location: string | null;
  contact_phone?: string | null;
  seller?: CarSeller | null;
  admin_phone?: string | null;
  is_negotiable: boolean;
  is_available: boolean;
  is_sold: boolean;
  views: number;
  seller_id: number;
  created_at: string;
  images: CarImage[];
};

export type Enquiry = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  enquiry_type: EnquiryType;
  status: EnquiryStatus;
  car_id: number | null;
  user_id: number | null;
  created_at: string;
};

export type TestDrive = {
  id: number;
  preferred_date: string;
  preferred_time: string;
  status: TestDriveStatus;
  user_id: number;
  car_id: number;
  created_at: string;
};

export type Favourite = {
  id: number;
  user_id: number;
  car_id: number;
  created_at: string;
  car?: Partial<Car> & { id: number; make?: string; model?: string; images?: CarImage[] };
};

export type EnquiryType = "Buy" | "Sell" | "Test Drive" | "General";
export type EnquiryStatus = "Pending" | "Replied" | "Closed";
export type TestDriveStatus = "Requested" | "Confirmed" | "Completed" | "Cancelled";

export const CONDITIONS = ["New", "Used", "Certified Pre-Owned"] as const;
export const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid"] as const;
export const TRANSMISSIONS = ["Manual", "Automatic", "CVT"] as const;
export const ENQUIRY_TYPES: EnquiryType[] = ["Buy", "Sell", "Test Drive", "General"];
export const ENQUIRY_STATUSES: EnquiryStatus[] = ["Pending", "Replied", "Closed"];
export const TEST_DRIVE_STATUSES: TestDriveStatus[] = [
  "Requested",
  "Confirmed",
  "Completed",
  "Cancelled",
];

export type Paginated<K extends string, T> = {
  total: number;
  page: number;
  pages: number;
} & Record<K, T[]>;
