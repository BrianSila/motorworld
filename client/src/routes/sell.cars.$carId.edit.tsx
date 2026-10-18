import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/common/guards";
import { CarForm, carToForm, emptyCarForm, type CarFormValues } from "@/components/common/CarForm";
import { EmptyState, ErrorState, FullPageLoader } from "@/components/common/states";
import * as carsApi from "@/lib/api/cars";
import { ApiError, errorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/sell/cars/$carId/edit")({
  head: () => ({
    meta: [
      { title: "Edit listing — Simatei Motorworld" },
      { name: "description", content: "Update the details, photos and pricing of your vehicle listing." },
      { property: "og:title", content: "Edit listing — Simatei Motorworld" },
      {
        property: "og:description",
        content: "Update the details, photos and pricing of your vehicle listing.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <EditCarPage />
    </RequireAuth>
  ),
});

function EditCarPage() {
  const { carId } = Route.useParams();
  const numericId = Number(carId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  const [values, setValues] = useState<CarFormValues>(emptyCarForm());

  const query = useQuery({
    queryKey: ["cars", "detail", numericId],
    queryFn: () => carsApi.getCar(numericId),
    enabled: Number.isFinite(numericId),
    retry: false,
  });

  useEffect(() => {
    if (query.data) setValues(carToForm(query.data.car));
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: ({
      payload,
      imageFiles,
      photoOrder,
    }: {
      payload: carsApi.CarPayload;
      imageFiles: File[];
      photoOrder: string[];
    }) => carsApi.updateCar(numericId, payload, imageFiles, photoOrder),
    onSuccess: () => {
      toast.success("Listing updated");
      void queryClient.invalidateQueries({ queryKey: ["cars"] });
      void navigate({ to: "/sell/cars" });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (!Number.isFinite(numericId)) return <NotFound />;
  if (query.isPending) return <FullPageLoader label="Loading listing" />;
  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) return <NotFound />;
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }

  const car = query.data.car;
  const canEdit = isAdmin || car.seller_id === user?.id;

  if (!canEdit) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          icon={<ShieldAlert className="size-8" aria-hidden="true" />}
          title="You can't edit this listing"
          description="Only the seller who created this vehicle or an administrator can change it."
          action={
            <Button asChild variant="outline">
              <Link to="/cars/$carId" params={{ carId: String(car.id) }}>
                View the listing
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/sell/cars" className="hover:text-foreground">
          My inventory
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">
          {car.year} {car.make} {car.model}
        </span>
      </nav>

      <h1 className="mt-3 text-3xl heading-xl">Edit listing</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage photos from your library, update specifications, and adjust pricing.
      </p>

      <div className="mt-8">
        <CarForm
          values={values}
          onChange={setValues}
          onSubmit={(payload, imageFiles, photoOrder) =>
            mutation.mutate({ payload, imageFiles, photoOrder })
          }
          submitting={mutation.isPending}
          error={mutation.error}
          submitLabel="Save changes"
          secondaryAction={
            <Button asChild variant="ghost">
              <Link to="/sell/cars">Cancel</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <EmptyState
        title="Listing not found"
        description="This vehicle may already have been deleted."
        action={
          <Button asChild>
            <Link to="/sell/cars">Back to my inventory</Link>
          </Button>
        }
      />
    </div>
  );
}
