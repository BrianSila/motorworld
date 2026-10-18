import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Images, ListChecks, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sell/")({
  head: () => ({
    meta: [
      { title: "Sell your vehicle — Simatei Motorworld" },
      {
        name: "description",
        content:
          "List your car with Simatei Motorworld: upload photos, set your price and manage availability from your seller dashboard.",
      },
      { property: "og:title", content: "Sell your vehicle — Simatei Motorworld" },
      {
        property: "og:description",
        content:
          "List your car with Simatei Motorworld: upload photos, set your price and manage availability from your seller dashboard.",
      },
    ],
  }),
  component: SellLandingPage,
});

const steps = [
  {
    icon: Images,
    title: "Add your listing",
    body: "Enter the make, model, year, price and condition, then upload up to 10 photos and choose the main image.",
  },
  {
    icon: ListChecks,
    title: "Manage availability",
    body: "Mark a vehicle available, unavailable or sold at any time from your inventory.",
  },
  {
    icon: MessageSquare,
    title: "Answer enquiries",
    body: "Buyer enquiries arrive with contact details so you can reply straight away.",
  },
  {
    icon: CalendarClock,
    title: "Host test drives",
    body: "Test-drive requests for your vehicles come in with a preferred date and time.",
  },
];

function SellLandingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-14">
      <p className="eyebrow">Sell with Simatei Motorworld</p>
      <h1 className="mt-2 text-4xl heading-xl sm:text-5xl">
        Put your vehicle in front of serious buyers
      </h1>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
        Listing is free and takes a few minutes. You keep control of pricing, availability and every
        conversation.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/sell/cars/new">Add a vehicle</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/sell/cars">Go to my inventory</Link>
        </Button>
      </div>

      <ol className="mt-14 grid gap-5 sm:grid-cols-2">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <step.icon className="size-5 text-primary" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>

      <p className="mt-10 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Upload up to 10 PNG, JPG, GIF or WebP photos directly with your listing.
      </p>
    </div>
  );
}
