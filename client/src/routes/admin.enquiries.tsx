import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { EmptyState, ErrorState, RowsSkeleton } from "@/components/common/states";
import { Pager } from "@/components/common/Pagination";
import { EnquiryRow } from "@/routes/account.enquiries";
import * as adminApi from "@/lib/api/admin";

export const Route = createFileRoute("/admin/enquiries")({
  head: () => ({
    meta: [
      { title: "Enquiries — Simatei Motorworld admin" },
      {
        name: "description",
        content: "Review every customer enquiry across the platform and update its status.",
      },
      { property: "og:title", content: "Enquiries — Simatei Motorworld admin" },
      {
        property: "og:description",
        content: "Review every customer enquiry across the platform and update its status.",
      },
    ],
  }),
  component: AdminEnquiriesPage,
});

const LIMIT = 20;

function AdminEnquiriesPage() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin", "enquiries", page],
    queryFn: () => adminApi.listAllEnquiries({ page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h2 className="text-lg font-semibold">All enquiries</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every enquiry sent through the platform, newest first. Change a status as you work through
        them.
      </p>

      <div className="mt-6">
        {query.isPending ? (
          <RowsSkeleton rows={5} />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : (query.data.enquiries ?? []).length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="size-8" aria-hidden="true" />}
            title="No enquiries yet"
            description="Enquiries from buyers and sellers will appear here."
          />
        ) : (
          <>
            <ul className="space-y-4">
              {query.data.enquiries.map((enquiry) => (
                <li key={enquiry.id}>
                  <EnquiryRow enquiry={enquiry} />
                </li>
              ))}
            </ul>

            <Pager
              page={query.data.page}
              pages={query.data.pages}
              total={query.data.total}
              onPageChange={setPage}
              label="enquiries"
            />
          </>
        )}
      </div>
    </div>
  );
}
