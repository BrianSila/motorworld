import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Car,
  CheckCircle2,
  ChevronRight,
  Filter,
  MessageCircle,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import heroImage from "@/assets/hero-showroom.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CarCard } from "@/components/common/CarCard";
import { CarGridSkeleton, EmptyState, ErrorState } from "@/components/common/states";
import * as carsApi from "@/lib/api/cars";

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

const PRICE_RANGES = [
  { label: "Any Price", value: "all" },
  { label: "Under KES 2,000,000", value: "2000000" },
  { label: "Under KES 5,000,000", value: "5000000" },
  { label: "Under KES 10,000,000", value: "10000000" },
  { label: "Under KES 15,000,000", value: "15000000" },
] as const;

function HomePage() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [selectedMake, setSelectedMake] = useState<string>("all");
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<string>("all");

  const filterOptions = useQuery({
    queryKey: ["cars", "filter-options"],
    queryFn: () => carsApi.getFilterOptions(),
  });

  const featured = useQuery({
    queryKey: ["cars", "featured"],
    queryFn: () =>
      carsApi.listCars({ sort_by: "views", sort_order: "desc", limit: 6, is_available: "true" }),
  });

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const search: Record<string, string | number> = {};
    if (term.trim()) search.q = term.trim();
    if (selectedCondition !== "all") search.condition = selectedCondition;
    if (selectedMake !== "all") search.make = selectedMake;
    if (selectedMaxPrice !== "all") search.price_max = Number(selectedMaxPrice);

    void navigate({
      to: "/cars",
      search,
    });
  }

  const makes = filterOptions.data?.makes ?? [];

  return (
    <div className="flex flex-col gap-12 sm:gap-20 pb-16">
      {/* ── MODERN CLEAN TECH HERO SECTION ── */}
      <section className="relative isolate overflow-hidden border-b border-border/80 bg-background pt-12 sm:pt-20 pb-16 sm:pb-28 surface-grid">
        {/* Ambient hero backdrop image with soft gradient blending */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-20 dark:opacity-10 mix-blend-multiply">
          <img
            src={heroImage}
            alt="Showroom forecourt"
            className="size-full object-cover object-center filter blur-xs"
          />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Clean Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary shadow-xs transition-all hover:bg-primary/15">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              <span>Kenya&apos;s Verified Automotive Marketplace</span>
            </div>

            {/* Hero Main Heading */}
            <h1 className="mt-5 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground heading-xl">
              The smart way to buy &amp; sell <span className="text-primary">in Kenya.</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl font-normal leading-relaxed">
              Explore verified inventory with direct seller contact, instant WhatsApp chat, official dealership concierge inspections, and transparent KES pricing.
            </p>
          </div>

          {/* ── INTERACTIVE QUICK FINDER BAR (CLEAN TECH FLOATING CARD) ── */}
          <div className="mt-10 max-w-4xl mx-auto rounded-2xl border border-border/80 bg-card/95 p-4 sm:p-6 shadow-lift backdrop-blur-xl">
            {/* Condition Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-border/60">
              {[
                { label: "All Vehicles", value: "all" },
                { label: "Used", value: "Used" },
                { label: "Brand New", value: "New" },
                { label: "Certified Pre-Owned", value: "Certified Pre-Owned" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setSelectedCondition(tab.value)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    selectedCondition === tab.value
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter Inputs Grid */}
            <form onSubmit={handleSearch} className="mt-4 grid gap-3 sm:grid-cols-12 items-center">
              {/* Keyword / Make Search */}
              <div className="sm:col-span-5 relative">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Keyword, model or location..."
                  className="h-11 pl-10 text-sm bg-muted/40 border-border/80 focus-visible:bg-background"
                />
              </div>

              {/* Make Dropdown */}
              <div className="sm:col-span-3">
                <Select value={selectedMake} onValueChange={setSelectedMake}>
                  <SelectTrigger className="h-11 bg-muted/40 border-border/80 text-sm">
                    <SelectValue placeholder="All Makes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Makes</SelectItem>
                    {makes.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Dropdown */}
              <div className="sm:col-span-2">
                <Select value={selectedMaxPrice} onValueChange={setSelectedMaxPrice}>
                  <SelectTrigger className="h-11 bg-muted/40 border-border/80 text-sm">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((pr) => (
                      <SelectItem key={pr.value} value={pr.value}>
                        {pr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit CTA */}
              <div className="sm:col-span-2">
                <Button type="submit" className="w-full h-11 gap-1.5 font-bold shadow-sm">
                  <span>Search</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </form>
          </div>

          {/* ── TRUST METRICS ROW ── */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-xs backdrop-blur-xs">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-foreground">Verified Listings</h4>
                <p className="text-xs text-muted-foreground">Clear specs &amp; title transparency</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-xs backdrop-blur-xs">
              <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600">
                <PhoneCall className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-foreground">Direct Seller &amp; Admin Calls</h4>
                <p className="text-xs text-muted-foreground">Call directly or chat on WhatsApp</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3.5 shadow-xs backdrop-blur-xs">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarClock className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-foreground">Test Drive Bookings</h4>
                <p className="text-xs text-muted-foreground">Convenient scheduling Mon – Sat</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED VEHICLES SECTION ── */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              <p className="eyebrow">Handpicked Inventory</p>
            </div>
            <h2 className="mt-1 text-3xl sm:text-4xl heading-xl text-foreground">
              Featured Vehicles
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Popular cars inspected and available for immediate viewings.
            </p>
          </div>

          <Button asChild variant="outline" className="gap-2 self-start sm:self-auto">
            <Link to="/cars">
              <span>Explore all inventory</span>
              <ArrowRight className="size-4" aria-hidden="true" />
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.data.cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── SELL WITH SIMATEI SPOTLIGHT (CLEAN TECH SHOWCASE) ── */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 p-8 sm:p-12 shadow-card">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Zap className="size-3.5" aria-hidden="true" />
                <span>Sell Your Car Fast</span>
              </div>
              <h2 className="mt-3 text-3xl sm:text-4xl heading-xl text-foreground">
                Reach genuine Kenyan buyers without middlemen.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                Publish your car with high-resolution photos, receive direct calls and WhatsApp inquiries from verified buyers, and track test-drive requests directly from your seller dashboard.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="font-bold">
                  <Link to="/sell/cars/new">
                    <span>List a vehicle for sale</span>
                    <ArrowRight className="size-4 ml-1" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/sell">How selling works</Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <ul className="space-y-3">
                {[
                  {
                    title: "Direct Buyer Connection",
                    desc: "Buyers can call your direct phone number or reach you on WhatsApp instantly.",
                  },
                  {
                    title: "Full Availability Control",
                    desc: "Mark vehicles as reserved, available, or sold in real time with 1 tap.",
                  },
                  {
                    title: "Dealership Escrow & Verification",
                    desc: "Optional Simatei admin concierge assistance for secure payment and logbook transfer.",
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="flex items-start gap-3.5 rounded-xl border border-border/70 bg-background/90 p-4 shadow-xs"
                  >
                    <CheckCircle2 className="size-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
