import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ArrowLeft, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, FullPageLoader } from "@/components/common/states";
import { EnquiryRow } from "@/routes/account.enquiries";
import { TestDriveRow } from "@/routes/account.test-drives";
import { CarCard } from "@/components/common/CarCard";
import * as adminApi from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { Car } from "@/lib/api/types";

export const Route = createFileRoute("/admin/users/$userId")({
  head: () => ({
    meta: [
      { title: "Account detail — Simatei Motorworld admin" },
      {
        name: "description",
        content: "View one customer's profile, listings, enquiries and test-drive history.",
      },
      { property: "og:title", content: "Account detail — Simatei Motorworld admin" },
      {
        property: "og:description",
        content: "View one customer's profile, listings, enquiries and test-drive history.",
      },
    ],
  }),
  component: AdminUserDetailPage,
});

function AdminUserDetailPage() {
  const { userId } = Route.useParams();
  const numericId = Number(userId);

  const query = useQuery({
    queryKey: ["admin", "users", "detail", numericId],
    queryFn: () => adminApi.getUserDetail(numericId),
    enabled: Number.isFinite(numericId),
    retry: false,
  });

  if (!Number.isFinite(numericId)) return <NotFound />;
  if (query.isPending) return <FullPageLoader label="Loading account" />;
  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) return <NotFound />;
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const { user, cars, enquiries, test_drives, favourites } = query.data;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/users">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to accounts
        </Link>
      </Button>

      <header className="mt-4 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl heading-xl">{user.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground break-all">{user.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
              {user.role === "admin" ? "Administrator" : "User"}
            </Badge>
            {user.is_blocked ? <Badge variant="destructive">Blocked</Badge> : null}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Phone</dt>
            <dd className="mt-1">{user.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Joined</dt>
            <dd className="mt-1">{formatDate(user.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Account ID</dt>
            <dd className="mt-1">{user.id}</dd>
          </div>
        </dl>
      </header>

      <Section title="Listings" count={cars?.length}>
        {cars && cars.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => (
              <CarCard key={car.id} car={car as Car} />
            ))}
          </div>
        ) : (
          <Muted>No vehicles listed by this account.</Muted>
        )}
      </Section>

      <Section title="Enquiries" count={enquiries?.length}>
        {enquiries && enquiries.length > 0 ? (
          <ul className="space-y-4">
            {enquiries.map((enquiry) => (
              <li key={enquiry.id}>
                <EnquiryRow enquiry={enquiry} />
              </li>
            ))}
          </ul>
        ) : (
          <Muted>No enquiries from this account.</Muted>
        )}
      </Section>

      <Section title="Test drives" count={test_drives?.length}>
        {test_drives && test_drives.length > 0 ? (
          <ul className="space-y-4">
            {test_drives.map((testDrive) => (
              <li key={testDrive.id}>
                <TestDriveRow testDrive={testDrive} />
              </li>
            ))}
          </ul>
        ) : (
          <Muted>No test drives booked by this account.</Muted>
        )}
      </Section>

      {favourites ? (
        <Section title="Saved vehicles" count={favourites.length}>
          {favourites.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {favourites.map((favourite) => (
                <li key={favourite.id}>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/cars/$carId" params={{ carId: String(favourite.car_id) }}>
                      <Heart className="size-4" aria-hidden="true" />
                      {favourite.car?.make && favourite.car?.model
                        ? `${favourite.car.make} ${favourite.car.model}`
                        : `Vehicle #${favourite.car_id}`}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <Muted>No saved vehicles.</Muted>
          )}
        </Section>
      ) : null}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number | undefined;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h3 className="text-lg font-semibold">
        {title}
        {typeof count === "number" ? (
          <span className="ml-2 text-sm font-normal text-muted-foreground">{count}</span>
        ) : null}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <EmptyState
        title="Account not found"
        description="This account may have been removed."
        action={
          <Button asChild>
            <Link to="/admin/users">Back to accounts</Link>
          </Button>
        }
      />
    </div>
  );
}
