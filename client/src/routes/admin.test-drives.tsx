import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { EmptyState, ErrorState, RowsSkeleton } from "@/components/common/states";
import { Pager } from "@/components/common/Pagination";
import { TestDriveRow } from "@/routes/account.test-drives";
import * as adminApi from "@/lib/api/admin";

export const Route = createFileRoute("/admin/test-drives")({
  head: () => ({
    meta: [
      { title: "Test drives — Simatei Motorworld admin" },
      { name: "description", content: "Confirm, complete or cancel test-drive requests." },
      { property: "og:title", content: "Test drives — Simatei Motorworld admin" },
      { property: "og:description", content: "Confirm, complete or cancel test-drive requests." },
    ],
  }),
  component: AdminTestDrivesPage,
});

const LIMIT = 20;

function AdminTestDrivesPage() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["test-drives", "admin", page],
    queryFn: () => adminApi.listAllTestDrives({ page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h2 className="text-lg font-semibold">Test-drive requests</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Update each booking as it moves from requested to confirmed, completed or cancelled.
      </p>

      <div className="mt-6">
        {query.isPending ? (
          <RowsSkeleton rows={5} />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : (query.data.test_drives ?? []).length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="size-8" aria-hidden="true" />}
            title="No test drives booked"
            description="Bookings made by buyers will appear here."
          />
        ) : (
          <>
            <ul className="space-y-4">
              {query.data.test_drives.map((testDrive) => (
                <li key={testDrive.id}>
                  <TestDriveRow testDrive={testDrive} />
                </li>
              ))}
            </ul>

            <Pager
              page={query.data.page}
              pages={query.data.pages}
              total={query.data.total}
              onPageChange={setPage}
              label="bookings"
            />
          </>
        )}
      </div>
    </div>
  );
}
