export function formatPrice(price: number, currency = "KES"): string {
  const amount = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(price);
  return `${currency || "KES"} ${amount}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat().format(value);
}

export function formatMileage(mileage: number | null | undefined): string {
  if (mileage === null || mileage === undefined) return "—";
  return `${new Intl.NumberFormat().format(mileage)} km`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return "—";
  const [h, m] = time.split(":");
  if (h === undefined || m === undefined) return time;
  const date = new Date();
  date.setHours(Number(h), Number(m), 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Business hours accepted by the backend: 08:00 through 17:59. */
export function businessHourSlots(stepMinutes = 30): string[] {
  const slots: string[] = [];
  for (let minutes = 8 * 60; minutes < 18 * 60; minutes += stepMinutes) {
    const h = String(Math.floor(minutes / 60)).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
}

export function primaryImageUrl(
  images: { url: string; is_primary: boolean }[] | undefined,
): string | null {
  if (!images || images.length === 0) return null;
  const primary = images.find((image) => image.is_primary);
  return (primary ?? images[0])?.url ?? null;
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeKenyaPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("0")) return `+254${cleaned.slice(1)}`;
  if (cleaned.startsWith("254")) return `+${cleaned}`;
  return `+254${cleaned}`;
}

export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "—";
  const normalized = normalizeKenyaPhone(phone);
  if (normalized.startsWith("+254") && normalized.length === 13) {
    return `+254 ${normalized.slice(4, 7)} ${normalized.slice(7, 10)} ${normalized.slice(10)}`;
  }
  return phone;
}

export function toWhatsAppNumber(phone: string | null | undefined): string {
  const normalized = normalizeKenyaPhone(phone);
  return normalized.replace(/^\+/, "");
}

export function toWhatsAppUrl(phone: string | null | undefined, text?: string): string {
  const number = toWhatsAppNumber(phone);
  if (!number) return "#";
  const params = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${number}${params}`;
}

