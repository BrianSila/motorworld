import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState, ErrorState, RowsSkeleton } from "@/components/common/states";
import { Pager } from "@/components/common/Pagination";
import * as adminApi from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { Role, User } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — Simatei Motorworld admin" },
      { name: "description", content: "Review registered accounts and manage administrator access." },
      { property: "og:title", content: "Users — Simatei Motorworld admin" },
      {
        property: "og:description",
        content: "Review registered accounts and manage administrator access.",
      },
    ],
  }),
  component: AdminUsersPage,
});

const LIMIT = 20;

function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<{ user: User; role: Role } | null>(null);

  const query = useQuery({
    queryKey: ["admin", "users", page],
    queryFn: () => adminApi.listUsers({ page, limit: LIMIT }),
  });

  const mutation = useMutation({
    mutationFn: ({ user, role }: { user: User; role: Role }) =>
      adminApi.updateUserRole(user.id, role),
    onSuccess: (response) => {
      toast.success(`${response.user.name} is now ${response.user.role === "admin" ? "an administrator" : "a standard user"}`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
    onSettled: () => setPending(null),
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h2 className="text-lg font-semibold">Registered accounts</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Promote trusted staff to administrator, or return them to a standard account.
      </p>

      <div className="mt-6">
        {query.isPending ? (
          <RowsSkeleton rows={6} />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : query.data.users.length === 0 ? (
          <EmptyState
            icon={<Users className="size-8" aria-hidden="true" />}
            title="No accounts to show"
            description="Registered users will appear here."
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.users.map((user) => {
                    const isSelf = user.id === currentUser?.id;
                    const nextRole: Role = user.role === "admin" ? "user" : "admin";
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell className="text-muted-foreground">{user.phone ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role === "admin" ? "Administrator" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button asChild variant="ghost" size="sm">
                              <Link to="/admin/users/$userId" params={{ userId: String(user.id) }}>
                                View details
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSelf || mutation.isPending}
                              onClick={() => setPending({ user, role: nextRole })}
                            >
                              {user.role === "admin" ? "Make standard user" : "Make administrator"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <Pager
              page={query.data.page}
              pages={query.data.pages}
              total={query.data.total}
              onPageChange={setPage}
              label="accounts"
            />
          </>
        )}
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.role === "admin" ? "Grant administrator access?" : "Remove administrator access?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.role === "admin"
                ? `${pending?.user.name} will be able to see every enquiry, change any listing and manage other accounts.`
                : `${pending?.user.name} will lose access to the admin area.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) mutation.mutate(pending);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
