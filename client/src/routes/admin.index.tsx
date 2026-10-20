import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  CarFront,
  CheckCircle2,
  ExternalLink,
  Eye,
  Heart,
  LayoutGrid,
  List,
  MessageSquare,
  Pencil,
  Timer,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CarCard } from "@/components/common/CarCard";
import { CarPhoto } from "@/components/common/CarPhoto";
import { AvailabilityBadge } from "@/components/common/StatusBadge";
import { CarGridSkeleton, EmptyState, ErrorState } from "@/components/common/states";
import * as adminApi from "@/lib/api/admin";
import type { Car } from "@/lib/api/types";
import { formatNumber, formatPhoneDisplay, formatPrice, primaryImageUrl } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin overview — Simatei Motorworld" },
      { name: "description", content: "Marketplace analytics, popular vehicles and enquiry volumes." },
      { property: "og:title", content: "Admin overview — Simatei Motorworld" },
      {
        property: "og:description",
        content: "Marketplace analytics, popular vehicles and enquiry volumes.",
      },
    ],
  }),
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  const analytics = useQuery({ queryKey: ["admin", "analytics"], queryFn: adminApi.getAnalytics });
  const popular = useQuery({ queryKey: ["admin", "popular"], queryFn: adminApi.getPopularCars });
  const [viewMode, setViewMode] = useState<"leaderboard" | "cards">("leaderboard");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 space-y-12">
      {/* ── AT A GLANCE KPI STATS ── */}
      <section aria-labelledby="analytics-heading">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div>
            <h2 id="analytics-heading" className="text-xl font-bold heading-xl">
              Platform Metrics
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live marketplace inventory and enquiry pipeline
            </p>
          </div>
        </div>

        {analytics.isPending ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : analytics.isError ? (
          <div className="mt-4">
            <ErrorState error={analytics.error} onRetry={() => void analytics.refetch()} />
          </div>
        ) : (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={CarFront} label="Total Vehicles" value={analytics.data.total_cars} />
            <StatCard icon={CheckCircle2} label="Available" value={analytics.data.available_cars} highlight="emerald" />
            <StatCard icon={TrendingUp} label="Sold" value={analytics.data.sold_cars} highlight="primary" />
            <StatCard icon={MessageSquare} label="Total Enquiries" value={analytics.data.total_enquiries} />
            <StatCard icon={Timer} label="Pending Enquiries" value={analytics.data.pending_enquiries} highlight="amber" />
          </dl>
        )}
      </section>

      {/* ── POPULAR VEHICLES PERFORMANCE ── */}
      <section aria-labelledby="popular-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <h2 id="popular-heading" className="text-xl font-bold heading-xl">
              Demand &amp; Engagement Leaderboard
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Top trending vehicles ranked by views and customer save actions
            </p>
          </div>

          {/* Clean Tech View Switcher */}
          <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("leaderboard")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-all ${
                viewMode === "leaderboard"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="size-3.5" aria-hidden="true" />
              <span>Leaderboard</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-all ${
                viewMode === "cards"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-3.5" aria-hidden="true" />
              <span>Cards</span>
            </button>
          </div>
        </div>

        {popular.isPending ? (
          <div className="mt-6">
            <CarGridSkeleton count={3} />
          </div>
        ) : popular.isError ? (
          <div className="mt-6">
            <ErrorState error={popular.error} onRetry={() => void popular.refetch()} />
          </div>
        ) : (
          <div className="mt-6 space-y-10">
            <PopularGroup
              icon={<TrendingUp className="size-4 text-primary" aria-hidden="true" />}
              title="Most Viewed Vehicles"
              subtitle="Vehicles capturing the highest buyer search attention"
              metricType="views"
              cars={popular.data.most_viewed}
              viewMode={viewMode}
            />

            <PopularGroup
              icon={<Heart className="size-4 text-rose-500" aria-hidden="true" />}
              title="Most Favourited Vehicles"
              subtitle="Shortlisted vehicles saved by potential buyers for purchase"
              metricType="favourites"
              cars={popular.data.most_favourited}
              viewMode={viewMode}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof CarFront;
  label: string;
  value: number;
  highlight?: "emerald" | "primary" | "amber";
}) {
  const iconColor =
    highlight === "emerald"
      ? "text-emerald-600 bg-emerald-500/10"
      : highlight === "amber"
      ? "text-amber-600 bg-amber-500/10"
      : highlight === "primary"
      ? "text-primary bg-primary/10"
      : "text-muted-foreground bg-muted";

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-primary/30">
      <div className="flex items-center justify-between">
        <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </dt>
        <span className={`flex size-8 items-center justify-center rounded-lg ${iconColor}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <dd className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
        {formatNumber(value)}
      </dd>
    </div>
  );
}

function PopularGroup({
  icon,
  title,
  subtitle,
  metricType,
  cars,
  viewMode,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  metricType: "views" | "favourites";
  cars: Car[];
  viewMode: "leaderboard" | "cards";
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
            {icon}
          </span>
          <div>
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {cars.length} {cars.length === 1 ? "vehicle" : "vehicles"}
        </span>
      </div>

      {cars.length === 0 ? (
        <div className="py-8">
          <EmptyState
            title="Nothing to rank yet"
            description="Once vehicles accumulate views and favourites on the marketplace, they will appear here in real time."
          />
        </div>
      ) : viewMode === "leaderboard" ? (
        <div className="divide-y divide-border/60">
          {cars.map((car, index) => {
            const image = primaryImageUrl(car.images);
            const title = `${car.year} ${car.make} ${car.model}`;
            const sellerPhone = car.contact_phone || car.seller?.phone || null;

            return (
              <div
                key={car.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 px-2 hover:bg-muted/30 rounded-xl transition-colors"
              >
                {/* Left: Rank + Thumbnail + Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Rank Badge */}
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : index === 1
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                        : index === 2
                        ? "bg-muted text-muted-foreground font-semibold"
                        : "text-muted-foreground font-medium"
                    }`}
                  >
                    #{index + 1}
                  </span>

                  {/* Compact Visual Thumbnail (64×48px) */}
                  <div className="relative size-12 sm:w-16 sm:h-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    <CarPhoto url={image} alt={title} className="size-full object-cover" />
                  </div>

                  {/* Vehicle Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to="/cars/$carId"
                        params={{ carId: String(car.id) }}
                        className="font-bold text-foreground text-sm hover:text-primary transition-colors truncate max-w-[260px] sm:max-w-md"
                      >
                        {title}
                      </Link>
                      <AvailabilityBadge car={car} />
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="font-semibold text-foreground">
                        {formatPrice(car.price, car.currency)}
                      </span>
                      <span>•</span>
                      <span>{car.condition}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className="truncate max-w-[120px]">
                          {car.seller?.name || "Dealership"}
                        </span>
                        {sellerPhone ? (
                          <span className="text-[11px] text-muted-foreground/80 font-mono">
                            ({formatPhoneDisplay(sellerPhone)})
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Metric Badge + Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                  {metricType === "views" ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      <Eye className="size-3.5" aria-hidden="true" />
                      <span>{formatNumber(car.views)} views</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                      <Heart className="size-3.5 fill-rose-500/30" aria-hidden="true" />
                      <span>{formatNumber(car.favourites_count ?? car.views)} saves</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Button asChild variant="ghost" size="sm" className="h-8 px-2.5 text-xs">
                      <Link to="/cars/$carId" params={{ carId: String(car.id) }}>
                        <ExternalLink className="size-3.5 mr-1" aria-hidden="true" />
                        <span>Inspect</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-8 px-2.5 text-xs">
                      <Link to="/sell/cars/$carId/edit" params={{ carId: String(car.id) }}>
                        <Pencil className="size-3.5 mr-1" aria-hidden="true" />
                        <span>Edit</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <div key={car.id} className="space-y-2">
              <CarCard car={car} />
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                  <Link to="/sell/cars/$carId/edit" params={{ carId: String(car.id) }}>
                    <Pencil className="size-3.5 mr-1" aria-hidden="true" />
                    Edit listing
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
