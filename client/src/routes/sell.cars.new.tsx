import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/common/guards";
import { CarForm, emptyCarForm, type CarFormValues } from "@/components/common/CarForm";
import * as carsApi from "@/lib/api/cars";
import { errorMessage } from "@/lib/api/client";

export const Route = createFileRoute("/sell/cars/new")({
  head: () => ({
    meta: [
      { title: "Add a vehicle — Simatei Motorworld" },
      {
        name: "description",
        content: "Create a new vehicle listing with photos, pricing and specifications.",
      },
      { property: "og:title", content: "Add a vehicle — Simatei Motorworld" },
      {
        property: "og:description",
        content: "Create a new vehicle listing with photos, pricing and specifications.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <NewCarPage />
    </RequireAuth>
  ),
});

function NewCarPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<CarFormValues>(emptyCarForm());

  const mutation = useMutation({
    mutationFn: ({ payload, imageFiles }: { payload: carsApi.CarPayload; imageFiles: File[] }) =>
      carsApi.createCar(payload, imageFiles),
    onSuccess: (response) => {
      toast.success("Listing published");
      void queryClient.invalidateQueries({ queryKey: ["cars"] });
      void navigate({ to: "/cars/$carId", params: { carId: String(response.car.id) } });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <Link to="/sell/cars" className="hover:text-foreground">
          My inventory
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">Add a vehicle</span>
      </nav>

      <h1 className="mt-3 text-3xl heading-xl">Add a vehicle</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Listings appear in the public inventory as soon as you publish them.
      </p>

      <div className="mt-8">
        <CarForm
          values={values}
          onChange={setValues}
          onSubmit={(payload, imageFiles) => mutation.mutate({ payload, imageFiles })}
          submitting={mutation.isPending}
          error={mutation.error}
          submitLabel="Publish listing"
          uploadImages
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
