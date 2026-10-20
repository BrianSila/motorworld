import { Link } from "@tanstack/react-router";
import { Fuel, Gauge, MapPin, MessageCircle, Phone, Settings2 } from "lucide-react";
import { CarPhoto } from "./CarPhoto";
import { AvailabilityBadge } from "./StatusBadge";
import { FavouriteButton } from "./FavouriteButton";
import { formatMileage, formatPrice, normalizeKenyaPhone, primaryImageUrl, toWhatsAppUrl } from "@/lib/format";
import type { Car } from "@/lib/api/types";

export function CarCard({ car }: { car: Car }) {
  const image = primaryImageUrl(car.images);
  const title = `${car.year} ${car.make} ${car.model}`;
  const sellerPhone = car.contact_phone || car.seller?.phone || null;
  const adminPhone = car.admin_phone || "0740892332";
  const sellerName = car.seller?.name || "Seller";
  const effectivePhone = sellerPhone || adminPhone;

  const currentUrl = typeof window !== "undefined" ? window.location.origin + `/cars/${car.id}` : "";
  const whatsappMsg = `Hi ${sellerName}, I am interested in your ${title} on Simatei Motorworld (${currentUrl}).`;
  const whatsappUrl = toWhatsAppUrl(sellerPhone || adminPhone, whatsappMsg);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift">
      <Link
        to="/cars/$carId"
        params={{ carId: String(car.id) }}
        className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={title}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <CarPhoto
            url={image}
            alt={title}
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* Subtle vignette gradient on bottom edge of image */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

          <div className="absolute left-3 top-3 z-10">
            <AvailabilityBadge car={car} />
          </div>

          <div className="absolute bottom-2.5 left-3 z-10 text-xs font-medium text-white/95 drop-shadow-sm flex items-center gap-1">
            <MapPin className="size-3.5 text-white/80" aria-hidden="true" />
            <span className="truncate max-w-[180px]">{car.location ?? "Nairobi, Kenya"}</span>
          </div>
        </div>
      </Link>

      <div className="absolute right-3 top-3 z-10">
        <FavouriteButton carId={car.id} />
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            {car.condition}
          </span>
          {car.is_negotiable ? (
            <span className="text-[11px] font-medium text-muted-foreground">Negotiable</span>
          ) : null}
        </div>

        <h3 className="mt-2 text-lg font-bold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors">
          <Link to="/cars/$carId" params={{ carId: String(car.id) }}>
            {title}
          </Link>
        </h3>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold tracking-tight text-foreground">
            {formatPrice(car.price, car.currency)}
          </span>
        </div>

        {/* Specs Pills Grid */}
        <dl className="mt-4 grid grid-cols-3 gap-1.5 text-xs">
          <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-2 text-center transition-colors group-hover:bg-muted/70">
            <Gauge className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Mileage</dt>
            <dd className="mt-1 font-semibold text-foreground truncate w-full">{formatMileage(car.mileage)}</dd>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-2 text-center transition-colors group-hover:bg-muted/70">
            <Fuel className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Fuel</dt>
            <dd className="mt-1 font-semibold text-foreground truncate w-full">{car.fuel_type}</dd>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-2 text-center transition-colors group-hover:bg-muted/70">
            <Settings2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <dt className="sr-only">Transmission</dt>
            <dd className="mt-1 font-semibold text-foreground truncate w-full">{car.transmission}</dd>
          </div>
        </dl>

        {/* Footer with Seller info and Quick Action Call / WhatsApp buttons */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {(car.seller?.name || "S").charAt(0).toUpperCase()}
            </span>
            <span className="truncate text-muted-foreground font-medium">
              {car.seller?.name ? car.seller.name : "Simatei Verified"}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <a
              href={`tel:${normalizeKenyaPhone(effectivePhone)}`}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-600/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/20 transition-all active:scale-95"
              title={`Call ${sellerPhone ? sellerName : "Admin Desk"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="size-3" aria-hidden="true" />
              <span>Call</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-border/80 bg-background p-1 text-muted-foreground hover:text-emerald-600 hover:border-emerald-600/30 transition-all active:scale-95"
              title="Chat on WhatsApp"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="size-3.5" aria-hidden="true" />
              <span className="sr-only">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
