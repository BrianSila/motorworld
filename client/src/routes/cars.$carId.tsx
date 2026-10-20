import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Eye,
  Fuel,
  Gauge,
  MapPin,
  Palette,
  Settings2,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CarPhoto } from "@/components/common/CarPhoto";
import { AvailabilityBadge } from "@/components/common/StatusBadge";
import { FavouriteButton } from "@/components/common/FavouriteButton";
import { EnquiryForm } from "@/components/common/EnquiryForm";
import { TestDriveDialog } from "@/components/common/TestDriveDialog";
import { DirectContactCard, SidebarDirectContact } from "@/components/common/DirectContactSection";
import { EmptyState, ErrorState, FullPageLoader } from "@/components/common/states";
import * as carsApi from "@/lib/api/cars";
import { ApiError } from "@/lib/api/client";
import { formatDate, formatMileage, formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cars/$carId")({
  head: () => ({
    meta: [
      { title: "Vehicle details — Simatei Motorworld" },
      {
        name: "description",
        content:
          "Full specifications, photos, pricing and availability for this vehicle, with enquiry and test-drive booking.",
      },
      { property: "og:title", content: "Vehicle details — Simatei Motorworld" },
      {
        property: "og:description",
        content:
          "Full specifications, photos, pricing and availability for this vehicle, with enquiry and test-drive booking.",
      },
    ],
  }),
  component: CarDetailPage,
});

function CarDetailPage() {
  const { carId } = Route.useParams();
  const numericId = Number(carId);

  const query = useQuery({
    queryKey: ["cars", "detail", numericId],
    queryFn: () => carsApi.getCar(numericId),
    enabled: Number.isFinite(numericId),
    retry: false,
  });

  const [activeIndex, setActiveIndex] = useState(0);

  if (!Number.isFinite(numericId)) {
    return <NotFound />;
  }
  if (query.isPending) return <FullPageLoader label="Loading vehicle" />;
  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) return <NotFound />;
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const car = query.data.car;
  const title = `${car.year} ${car.make} ${car.model}`;
  const images = car.images ?? [];
  const ordered = [...images].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary),
  );
  const active = ordered[Math.min(activeIndex, Math.max(ordered.length - 1, 0))];

  const specs = [
    { icon: Calendar, label: "Year", value: String(car.year) },
    { icon: Gauge, label: "Mileage", value: formatMileage(car.mileage) },
    { icon: Fuel, label: "Fuel type", value: car.fuel_type },
    { icon: Settings2, label: "Transmission", value: car.transmission },
    { icon: Tag, label: "Condition", value: car.condition },
    { icon: Palette, label: "Colour", value: car.color ?? "—" },
    { icon: MapPin, label: "Location", value: car.location ?? "—" },
    { icon: Eye, label: "Views", value: formatNumber(car.views) },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <span aria-hidden="true"> / </span>
        <Link to="/cars" className="hover:text-foreground">
          Inventory
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">{title}</span>
      </nav>

      <Button asChild variant="ghost" size="sm" className="mt-3 -ml-2">
        <Link to="/cars">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to inventory
        </Link>
      </Button>

      <div className="mt-4 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="relative overflow-hidden rounded-xl border border-border bg-card">
            <div className="aspect-[16/10]">
              <CarPhoto url={active?.url} alt={title} className="size-full" />
            </div>
            <div className="absolute left-4 top-4">
              <AvailabilityBadge car={car} />
            </div>
          </div>

          {ordered.length > 1 ? (
            <ul className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
              {ordered.map((image, index) => (
                <li key={image.id}>
                  <button
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`View photo ${index + 1} of ${ordered.length}`}
                    aria-current={index === activeIndex}
                    className={cn(
                      "block w-full overflow-hidden rounded-md border-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      index === activeIndex ? "border-primary" : "border-border",
                    )}
                  >
                    <span className="block aspect-[4/3]">
                      <CarPhoto url={image.url} alt={`${title} photo ${index + 1}`} className="size-full" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <section className="mt-10">
            <h2 className="text-xl heading-xl">Specifications</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {specs.map((spec) => (
                <div key={spec.label} className="rounded-lg border border-border bg-card p-4">
                  <spec.icon className="size-4 text-primary" aria-hidden="true" />
                  <dt className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
                    {spec.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {car.description ? (
            <section className="mt-10">
              <h2 className="text-xl heading-xl">About this vehicle</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {car.description}
              </p>
            </section>
          ) : null}

          <DirectContactCard car={car} />

          <section className="mt-10 rounded-xl border border-border bg-card p-6">
            <h2 className="text-xl heading-xl">Enquire about this vehicle</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Send us a message and our team will respond by email.
            </p>
            <div className="mt-6">
              <EnquiryForm carId={car.id} defaultType="Buy" />
            </div>
          </section>
        </div>

        <aside>
          <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
            <p className="eyebrow">{car.condition}</p>
            <h1 className="mt-1 text-3xl heading-xl">{title}</h1>
            <p className="mt-4 text-3xl font-semibold text-primary">
              {formatPrice(car.price, car.currency)}
            </p>
            {car.is_negotiable ? (
              <p className="mt-1 text-sm text-muted-foreground">Price is negotiable</p>
            ) : null}

            <Separator className="my-5" />

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Mileage</dt>
                <dd>{formatMileage(car.mileage)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Location</dt>
                <dd>{car.location ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Listed</dt>
                <dd>{formatDate(car.created_at)}</dd>
              </div>
            </dl>

            {car.is_sold ? (
              <p className="mt-5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                This vehicle has been sold. Browse the inventory for similar options.
              </p>
            ) : !car.is_available ? (
              <p className="mt-5 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                This vehicle is currently unavailable. You can still send an enquiry.
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-3">
              <SidebarDirectContact car={car} />
              <TestDriveDialog carId={car.id} carTitle={title} disabled={car.is_sold} />
              <FavouriteButton carId={car.id} variant="full" className="w-full" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <EmptyState
        title="Vehicle not found"
        description="This listing may have been removed or sold. Browse the current inventory instead."
        action={
          <Button asChild>
            <Link to="/cars">Browse inventory</Link>
          </Button>
        }
      />
    </div>
  );
}
