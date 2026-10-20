import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CarCard } from "@/components/common/CarCard";
import { Pager } from "@/components/common/Pagination";
import { CarGridSkeleton, EmptyState, ErrorState } from "@/components/common/states";
import * as carsApi from "@/lib/api/cars";
import { CONDITIONS, FUEL_TYPES, TRANSMISSIONS } from "@/lib/api/types";

const ANY = "__any__";

type CarSearch = {
  q?: string | undefined;
  make?: string | undefined;
  model?: string | undefined;
  year_min?: string | undefined;
  year_max?: string | undefined;
  price_min?: string | undefined;
  price_max?: string | undefined;
  fuel_type?: string | undefined;
  transmission?: string | undefined;
  condition?: string | undefined;
  location?: string | undefined;
  is_available?: string | undefined;
  sort_by?: string | undefined;
  sort_order?: string | undefined;
  page?: number | undefined;
};

const STRING_KEYS = [
  "q",
  "make",
  "model",
  "year_min",
  "year_max",
  "price_min",
  "price_max",
  "fuel_type",
  "transmission",
  "condition",
  "location",
  "is_available",
  "sort_by",
  "sort_order",
] as const;

export const Route = createFileRoute("/cars/")({
  validateSearch: (search: Record<string, unknown>): CarSearch => {
    const parsed: CarSearch = {};
    for (const key of STRING_KEYS) {
      const value = search[key];
      if (typeof value === "string" && value !== "") parsed[key] = value;
    }
    const page = Number(search["page"]);
    if (Number.isFinite(page) && page > 1) parsed.page = Math.floor(page);
    return parsed;
  },
  head: () => ({
    meta: [
      { title: "Vehicle inventory — Simatei Motorworld" },
      {
        name: "description",
        content:
          "Search and filter our full vehicle inventory by make, model, year, price, fuel type, transmission and location.",
      },
      { property: "og:title", content: "Vehicle inventory — Simatei Motorworld" },
      {
        property: "og:description",
        content:
          "Search and filter our full vehicle inventory by make, model, year, price, fuel type, transmission and location.",
      },
    ],
  }),
  component: CarsPage,
});

function CarsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(search.q ?? "");

  useEffect(() => {
    setTerm(search.q ?? "");
  }, [search.q]);

  const page = search.page ?? 1;

  const options = useQuery({
    queryKey: ["cars", "filters"],
    queryFn: () => carsApi.getFilterOptions(),
  });

  const list = useQuery({
    queryKey: ["cars", "list", search],
    queryFn: () =>
      carsApi.listCars({
        ...search,
        page,
        limit: 12,
        sort_by: search.sort_by ?? "created_at",
        sort_order: search.sort_order ?? "desc",
      }),
    placeholderData: keepPreviousData,
  });

  function update(patch: CarSearch, resetPage = true) {
    const next: Record<string, unknown> = { ...search, ...patch };
    if (resetPage) delete next["page"];
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "" || value === ANY) delete next[key];
    }
    void navigate({ to: "/cars", search: next as CarSearch });
  }

  const activeCount = STRING_KEYS.filter((key) => key !== "sort_by" && key !== "sort_order")
    .filter((key) => Boolean(search[key])).length;

  const filters = (
    <FilterControls
      search={search}
      options={options.data}
      onChange={(patch) => update(patch)}
    />
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">Inventory</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl heading-xl">Vehicle inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.data ? `${list.data.total} vehicles match your search` : "Loading inventory…"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={`${search.sort_by ?? "created_at"}:${search.sort_order ?? "desc"}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split(":");
              update({ sort_by: sortBy, sort_order: sortOrder });
            }}
          >
            <SelectTrigger className="w-[190px]" aria-label="Sort results">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at:desc">Newest first</SelectItem>
              <SelectItem value="price:asc">Price: low to high</SelectItem>
              <SelectItem value="price:desc">Price: high to low</SelectItem>
              <SelectItem value="year:desc">Year: newest</SelectItem>
              <SelectItem value="year:asc">Year: oldest</SelectItem>
              <SelectItem value="views:desc">Most viewed</SelectItem>
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <Filter className="size-4" aria-hidden="true" />
                Filters{activeCount > 0 ? ` (${activeCount})` : ""}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(92vw,22rem)] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter vehicles</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-8">{filters}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Modern Search & Quick Filter Bar */}
      <div className="mt-6 space-y-3">
        <form
          className="flex flex-col sm:flex-row gap-2.5 rounded-2xl border border-border/80 bg-card p-2 shadow-xs"
          onSubmit={(event) => {
            event.preventDefault();
            update({ q: term.trim() || undefined });
          }}
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search make, model, year, trim or keyword..."
              aria-label="Search vehicles"
              className="h-11 pl-10 pr-9 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
            />
            {term ? (
              <button
                type="button"
                onClick={() => {
                  setTerm("");
                  update({ q: undefined });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search query"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          <Button type="submit" className="h-11 px-6 font-semibold shadow-xs">
            Search
          </Button>
        </form>

        {/* Quick Make Chips */}
        {options.data?.makes && options.data.makes.length > 0 ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-muted-foreground font-medium shrink-0 pr-1">Popular:</span>
            <button
              type="button"
              onClick={() => update({ make: undefined })}
              className={`rounded-full px-3 py-1 font-semibold transition-colors shrink-0 ${
                !search.make
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              All Makes
            </button>
            {options.data.makes.slice(0, 7).map((make) => (
              <button
                key={make}
                type="button"
                onClick={() => update({ make: search.make === make ? undefined : make })}
                className={`rounded-full px-3 py-1 font-semibold transition-colors shrink-0 ${
                  search.make === make
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {make}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[18rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Filters</h2>
                {activeCount > 0 ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                    {activeCount}
                  </span>
                ) : null}
              </div>
              {activeCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void navigate({ to: "/cars", search: {} })}
                  className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3 mr-1" aria-hidden="true" />
                  Reset
                </Button>
              ) : null}
            </div>
            <div className="mt-4">{filters}</div>
          </div>
        </aside>

        <div>
          {/* Active filter badges row */}
          {activeCount > 0 ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
              {search.make ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium">
                  Make: {search.make}
                  <button
                    type="button"
                    onClick={() => update({ make: undefined })}
                    aria-label={`Remove make ${search.make}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ) : null}
              {search.model ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium">
                  Model: {search.model}
                  <button
                    type="button"
                    onClick={() => update({ model: undefined })}
                    aria-label={`Remove model ${search.model}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ) : null}
              {search.condition ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium">
                  {search.condition}
                  <button
                    type="button"
                    onClick={() => update({ condition: undefined })}
                    aria-label={`Remove condition ${search.condition}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ) : null}
              {search.fuel_type ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium">
                  {search.fuel_type}
                  <button
                    type="button"
                    onClick={() => update({ fuel_type: undefined })}
                    aria-label={`Remove fuel ${search.fuel_type}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ) : null}
              {search.transmission ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium">
                  {search.transmission}
                  <button
                    type="button"
                    onClick={() => update({ transmission: undefined })}
                    aria-label={`Remove transmission ${search.transmission}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ) : null}
              {search.q ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium">
                  Keyword: &quot;{search.q}&quot;
                  <button
                    type="button"
                    onClick={() => {
                      setTerm("");
                      update({ q: undefined });
                    }}
                    aria-label="Remove search query"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setTerm("");
                  void navigate({ to: "/cars", search: {} });
                }}
                className="text-xs font-semibold text-primary hover:underline ml-1"
              >
                Clear all
              </button>
            </div>
          ) : null}
          {list.isPending ? (
            <CarGridSkeleton count={6} />
          ) : list.isError ? (
            <ErrorState error={list.error} onRetry={() => void list.refetch()} />
          ) : list.data.cars.length === 0 ? (
            <EmptyState
              title="No vehicles match those filters"
              description="Try widening your price or year range, or clear the filters to see everything available."
              action={
                <Button variant="outline" onClick={() => void navigate({ to: "/cars", search: {} })}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {list.data.cars.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
              <Pager
                page={list.data.page}
                pages={list.data.pages}
                total={list.data.total}
                label="vehicles"
                onPageChange={(nextPage) =>
                  update({ page: nextPage }, false)
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterControls({
  search,
  options,
  onChange,
}: {
  search: CarSearch;
  options:
    | { makes: string[]; models: string[]; years: number[]; locations: string[] }
    | undefined;
  onChange: (patch: CarSearch) => void;
}) {
  return (
    <div className="space-y-5">
      <SelectField
        label="Make"
        value={search.make}
        values={options?.makes ?? []}
        onChange={(value) => onChange({ make: value })}
      />
      <SelectField
        label="Model"
        value={search.model}
        values={options?.models ?? []}
        onChange={(value) => onChange({ model: value })}
      />
      <SelectField
        label="Condition"
        value={search.condition}
        values={[...CONDITIONS]}
        onChange={(value) => onChange({ condition: value })}
      />
      <SelectField
        label="Fuel type"
        value={search.fuel_type}
        values={[...FUEL_TYPES]}
        onChange={(value) => onChange({ fuel_type: value })}
      />
      <SelectField
        label="Transmission"
        value={search.transmission}
        values={[...TRANSMISSIONS]}
        onChange={(value) => onChange({ transmission: value })}
      />
      <SelectField
        label="Location"
        value={search.location}
        values={options?.locations ?? []}
        onChange={(value) => onChange({ location: value })}
      />

      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Price range (KES)
        </Label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            aria-label="Minimum price"
            defaultValue={search.price_min ?? ""}
            onBlur={(event) => onChange({ price_min: event.target.value || undefined })}
          />
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            aria-label="Maximum price"
            defaultValue={search.price_max ?? ""}
            onBlur={(event) => onChange({ price_max: event.target.value || undefined })}
          />
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Year range</Label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="From"
            aria-label="Earliest year"
            defaultValue={search.year_min ?? ""}
            onBlur={(event) => onChange({ year_min: event.target.value || undefined })}
          />
          <Input
            type="number"
            inputMode="numeric"
            placeholder="To"
            aria-label="Latest year"
            defaultValue={search.year_max ?? ""}
            onBlur={(event) => onChange({ year_max: event.target.value || undefined })}
          />
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Availability
        </Label>
        <Select
          value={search.is_available ?? ANY}
          onValueChange={(value) => onChange({ is_available: value === ANY ? undefined : value })}
        >
          <SelectTrigger className="mt-1.5 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            <SelectItem value="true">Available only</SelectItem>
            <SelectItem value="false">Not available</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string | undefined;
  values: (string | number)[];
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Select
        value={value ?? ANY}
        onValueChange={(next) => onChange(next === ANY ? undefined : next)}
      >
        <SelectTrigger className="mt-1.5 w-full" aria-label={label}>
          <SelectValue placeholder={`Any ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any {label.toLowerCase()}</SelectItem>
          {values.map((option) => (
            <SelectItem key={String(option)} value={String(option)}>
              {String(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
