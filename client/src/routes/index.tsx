import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, CalendarClock, Search } from "lucide-react";
import { useState } from "react";
import heroImage from "@/assets/hero-showroom.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CarCard } from "@/components/common/CarCard";
import { CarGridSkeleton, EmptyState, ErrorState } from "@/components/common/states";
import * as carsApi from "@/lib/api/cars";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Simatei Motorworld — Buy & Sell Vehicles in Kenya" },
      {
        name: "description",
        content:
          "Browse verified cars, SUVs and pickups, book test drives and list your own vehicle with Simatei Motorworld.",
      },
      { property: "og:title", content: "Simatei Motorworld — Buy & Sell Vehicles in Kenya" },
      {
        property: "og:description",
        content:
          "Browse verified cars, SUVs and pickups, book test drives and list your own vehicle with Simatei Motorworld.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  const featured = useQuery({
    queryKey: ["cars", "featured"],
    queryFn: () =>
      carsApi.listCars({ sort_by: "views", sort_order: "desc", limit: 6, is_available: "true" }),
  });

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border">
        <img
          src={heroImage}
          alt="Premium SUV on a showroom forecourt at dusk"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-24 sm:py-32">
          <p className="eyebrow">Simatei Motorworld · Nairobi</p>
          <h1 className="mt-4 max-w-3xl heading-xl text-4xl sm:text-6xl lg:text-7xl">
            The vehicle you want, without the guesswork.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Explore a curated marketplace of cars, SUVs and pickups. Compare specifications, save
            favourites, send enquiries and book a test drive in minutes.
          </p>

          <form
            className="mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void navigate({ to: "/cars", search: term.trim() ? { q: term.trim() } : {} });
            }}
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search make, model or keyword"
                aria-label="Search vehicles"
                className="h-12 pl-9"
              />
            </div>
            <Button type="submit" size="lg" className="h-12">
              Search inventory
            </Button>
          </form>

          <dl className="mt-12 grid max-w-2xl gap-6 sm:grid-cols-3">
            {[
              { icon: BadgeCheck, label: "Verified listings", value: "Condition & specs upfront" },
              { icon: CalendarClock, label: "Test drives", value: "Book 08:00 – 18:00" },
              { icon: Search, label: "Smart filters", value: "Price, year, fuel & more" },
            ].map((item) => (
              <div key={item.label}>
                <item.icon className="size-5 text-primary" aria-hidden="true" />
                <dt className="mt-2 text-sm font-semibold">{item.label}</dt>
                <dd className="text-sm text-muted-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Most viewed</p>
            <h2 className="mt-1 text-3xl heading-xl">Featured vehicles</h2>
          </div>
          <Button asChild variant="outline">
            <Link to="/cars">
              View all inventory <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="mt-8">
          {featured.isPending ? (
            <CarGridSkeleton count={3} />
          ) : featured.isError ? (
            <ErrorState error={featured.error} onRetry={() => void featured.refetch()} />
          ) : featured.data.cars.length === 0 ? (
            <EmptyState
              title="No vehicles listed yet"
              description="Inventory will appear here as soon as sellers publish their vehicles."
              action={
                <Button asChild>
                  <Link to="/sell/cars/new">List a vehicle</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.data.cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center">
          <div>
            <p className="eyebrow">Sell with us</p>
            <h2 className="mt-1 text-3xl heading-xl">List your vehicle to thousands of buyers</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Publish your listing with uploaded photos, manage availability, mark vehicles as sold
              and track the test-drive requests that come in — all from your seller dashboard.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/sell/cars/new">Add a vehicle</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/sell">How selling works</Link>
              </Button>
            </div>
          </div>
          <ul className="space-y-4 text-sm">
            {[
              "Upload up to 10 photos per listing and choose a primary image.",
              "Availability and sold status controls that buyers see instantly.",
              "Enquiries and test-drive requests tied to each vehicle.",
            ].map((point) => (
              <li key={point} className="flex gap-3 rounded-lg border border-border bg-card p-4">
                <BadgeCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
