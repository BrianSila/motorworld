import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CarPhoto } from "./CarPhoto";
import { FieldError } from "./states";
import type { CarPayload } from "@/lib/api/cars";
import { ApiError, errorMessage, fieldErrorsOf } from "@/lib/api/client";
import { CONDITIONS, FUEL_TYPES, TRANSMISSIONS, type Car } from "@/lib/api/types";

export type FormPhotoItem = {
  id: string;
  type: "existing" | "file";
  url: string;
  file?: File;
  name: string;
};

export type CarFormValues = {
  make: string;
  model: string;
  year: string;
  price: string;
  currency: string;
  mileage: string;
  condition: string;
  fuel_type: string;
  transmission: string;
  color: string;
  description: string;
  location: string;
  contact_phone: string;
  is_negotiable: boolean;
  photos: FormPhotoItem[];
  images?: string[];
  imageFiles?: File[];
};

export function emptyCarForm(): CarFormValues {
  return {
    make: "",
    model: "",
    year: String(new Date().getFullYear()),
    price: "",
    currency: "KES",
    mileage: "",
    condition: "Used",
    fuel_type: "Petrol",
    transmission: "Automatic",
    color: "",
    description: "",
    location: "",
    contact_phone: "",
    is_negotiable: false,
    photos: [],
    images: [],
    imageFiles: [],
  };
}

export function carToForm(car: Car): CarFormValues {
  const ordered = [...(car.images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary),
  );
  const photos: FormPhotoItem[] = ordered.map((image, index) => ({
    id: `existing-${image.id || index}-${image.url}`,
    type: "existing",
    url: image.url,
    name: `Photo ${index + 1}`,
  }));

  return {
    make: car.make,
    model: car.model,
    year: String(car.year),
    price: String(car.price),
    currency: car.currency || "KES",
    mileage: car.mileage === null ? "" : String(car.mileage),
    condition: car.condition,
    fuel_type: car.fuel_type,
    transmission: car.transmission,
    color: car.color ?? "",
    description: car.description ?? "",
    location: car.location ?? "",
    contact_phone: car.contact_phone ?? "",
    is_negotiable: car.is_negotiable,
    photos,
    images: ordered.map((image) => image.url),
    imageFiles: [],
  };
}

export function CarForm({
  values,
  onChange,
  onSubmit,
  submitting,
  error,
  submitLabel,
  secondaryAction,
}: {
  values: CarFormValues;
  onChange: (values: CarFormValues) => void;
  onSubmit: (payload: CarPayload, imageFiles: File[], photoOrder: string[]) => void;
  submitting: boolean;
  error: unknown;
  submitLabel: string;
  secondaryAction?: React.ReactNode;
  uploadImages?: boolean;
}) {
  const [localError, setLocalError] = useState<ApiError | null>(null);

  const photos = values.photos ?? [];

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo.type === "file" && photo.url.startsWith("blob:")) {
          URL.revokeObjectURL(photo.url);
        }
      });
    };
  }, []);

  const fieldErrors = { ...fieldErrorsOf(localError), ...fieldErrorsOf(error) };

  function set<K extends keyof CarFormValues>(key: K, value: CarFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  function addPhotosFromLibrary(files: FileList | null) {
    if (!files?.length) return;
    const acceptedExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp"]);
    const selected = Array.from(files);
    const invalid = selected.find((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return !extension || !acceptedExtensions.has(extension);
    });

    if (invalid) {
      setLocalError(
        new ApiError("Please fix the highlighted fields.", 400, {
          images: [`"${invalid.name}" is not a supported image format. Supported formats: PNG, JPG, JPEG, WebP, GIF.`],
        }),
      );
      return;
    }

    if (photos.length + selected.length > 10) {
      setLocalError(
        new ApiError("Please fix the highlighted fields.", 400, {
          images: ["You can have a maximum of 10 photos per vehicle."],
        }),
      );
      return;
    }

    setLocalError(null);
    const newItems: FormPhotoItem[] = selected.map((file, i) => ({
      id: `file-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      type: "file",
      url: URL.createObjectURL(file),
      file,
      name: file.name,
    }));

    const nextPhotos = [...photos, ...newItems];
    onChange({
      ...values,
      photos: nextPhotos,
      images: nextPhotos.map((p) => p.url),
      imageFiles: nextPhotos
        .filter((p): p is FormPhotoItem & { file: File } => p.type === "file" && !!p.file)
        .map((p) => p.file),
    });
  }

  function removePhoto(index: number) {
    const photo = photos[index];
    if (photo && photo.type === "file" && photo.url.startsWith("blob:")) {
      URL.revokeObjectURL(photo.url);
    }
    const nextPhotos = photos.filter((_, i) => i !== index);
    onChange({
      ...values,
      photos: nextPhotos,
      images: nextPhotos.map((p) => p.url),
      imageFiles: nextPhotos
        .filter((p): p is FormPhotoItem & { file: File } => p.type === "file" && !!p.file)
        .map((p) => p.file),
    });
  }

  function move(index: number, delta: number) {
    const next = [...photos];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const current = next[index]!;
    next[index] = next[target]!;
    next[target] = current;

    onChange({
      ...values,
      photos: next,
      images: next.map((p) => p.url),
      imageFiles: next
        .filter((p): p is FormPhotoItem & { file: File } => p.type === "file" && !!p.file)
        .map((p) => p.file),
    });
  }

  function makePrimary(index: number) {
    if (index === 0) return;
    const next = [...photos];
    const [picked] = next.splice(index, 1);
    if (picked) next.unshift(picked);

    onChange({
      ...values,
      photos: next,
      images: next.map((p) => p.url),
      imageFiles: next
        .filter((p): p is FormPhotoItem & { file: File } => p.type === "file" && !!p.file)
        .map((p) => p.file),
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const problems: Record<string, string[]> = {};
    if (!values.make.trim()) problems["make"] = ["Enter the make"];
    if (!values.model.trim()) problems["model"] = ["Enter the model"];
    const year = Number(values.year);
    if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1)
      problems["year"] = ["Enter a valid year"];
    const price = Number(values.price);
    if (!Number.isFinite(price) || price <= 0) problems["price"] = ["Enter a price above zero"];
    if (values.mileage.trim() && Number(values.mileage) < 0)
      problems["mileage"] = ["Mileage cannot be negative"];
    if (photos.length === 0) {
      problems["images"] = ["Please choose at least one photo from your library."];
    }

    if (Object.keys(problems).length > 0) {
      setLocalError(new ApiError("Please fix the highlighted fields.", 400, problems));
      return;
    }
    setLocalError(null);

    const imageFiles: File[] = [];
    const photoOrder: string[] = [];

    for (const photo of photos) {
      if (photo.type === "file" && photo.file) {
        const fileIdx = imageFiles.length;
        imageFiles.push(photo.file);
        photoOrder.push(`file:${fileIdx}`);
      } else if (photo.type === "existing") {
        photoOrder.push(`existing:${photo.url}`);
      }
    }

    onSubmit(
      {
        make: values.make.trim(),
        model: values.model.trim(),
        year,
        price,
        currency: values.currency.trim() || "KES",
        mileage: values.mileage.trim() ? Number(values.mileage) : null,
        condition: values.condition,
        fuel_type: values.fuel_type,
        transmission: values.transmission,
        color: values.color.trim() ? values.color.trim() : null,
        description: values.description.trim() ? values.description.trim() : null,
        location: values.location.trim() ? values.location.trim() : null,
        contact_phone: values.contact_phone.trim() ? values.contact_phone.trim() : null,
        is_negotiable: values.is_negotiable,
        images: photos.map((p) => p.url),
      },
      imageFiles,
      photoOrder,
    );
  }

  const visibleError = error ?? localError;

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {visibleError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(visibleError)}</AlertDescription>
        </Alert>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg heading-xl">Vehicle details</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="car-make">Make</Label>
            <Input
              id="car-make"
              value={values.make}
              onChange={(event) => set("make", event.target.value)}
              className="mt-1.5"
              placeholder="Toyota"
            />
            <FieldError messages={fieldErrors["make"]} />
          </div>
          <div>
            <Label htmlFor="car-model">Model</Label>
            <Input
              id="car-model"
              value={values.model}
              onChange={(event) => set("model", event.target.value)}
              className="mt-1.5"
              placeholder="Land Cruiser Prado"
            />
            <FieldError messages={fieldErrors["model"]} />
          </div>
          <div>
            <Label htmlFor="car-year">Year</Label>
            <Input
              id="car-year"
              type="number"
              inputMode="numeric"
              value={values.year}
              onChange={(event) => set("year", event.target.value)}
              className="mt-1.5"
            />
            <FieldError messages={fieldErrors["year"]} />
          </div>
          <div>
            <Label htmlFor="car-mileage">
              Mileage in km <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="car-mileage"
              type="number"
              inputMode="numeric"
              value={values.mileage}
              onChange={(event) => set("mileage", event.target.value)}
              className="mt-1.5"
            />
            <FieldError messages={fieldErrors["mileage"]} />
          </div>
          <div>
            <Label htmlFor="car-price">Price</Label>
            <Input
              id="car-price"
              type="number"
              inputMode="numeric"
              value={values.price}
              onChange={(event) => set("price", event.target.value)}
              className="mt-1.5"
              placeholder="6500000"
            />
            <FieldError messages={fieldErrors["price"]} />
          </div>
          <div>
            <Label htmlFor="car-currency">Currency</Label>
            <Input
              id="car-currency"
              value={values.currency}
              onChange={(event) => set("currency", event.target.value.toUpperCase())}
              className="mt-1.5"
              maxLength={5}
            />
            <FieldError messages={fieldErrors["currency"]} />
          </div>

          <FormSelect
            id="car-condition"
            label="Condition"
            value={values.condition}
            options={[...CONDITIONS]}
            onChange={(value) => set("condition", value)}
            messages={fieldErrors["condition"]}
          />
          <FormSelect
            id="car-fuel"
            label="Fuel type"
            value={values.fuel_type}
            options={[...FUEL_TYPES]}
            onChange={(value) => set("fuel_type", value)}
            messages={fieldErrors["fuel_type"]}
          />
          <FormSelect
            id="car-transmission"
            label="Transmission"
            value={values.transmission}
            options={[...TRANSMISSIONS]}
            onChange={(value) => set("transmission", value)}
            messages={fieldErrors["transmission"]}
          />
          <div>
            <Label htmlFor="car-color">
              Colour <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="car-color"
              value={values.color}
              onChange={(event) => set("color", event.target.value)}
              className="mt-1.5"
            />
            <FieldError messages={fieldErrors["color"]} />
          </div>
          <div>
            <Label htmlFor="car-location">
              Location <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="car-location"
              value={values.location}
              onChange={(event) => set("location", event.target.value)}
              className="mt-1.5"
              placeholder="Nairobi"
            />
            <FieldError messages={fieldErrors["location"]} />
          </div>
          <div>
            <Label htmlFor="car-contact-phone">
              Direct contact phone <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="car-contact-phone"
              type="tel"
              value={values.contact_phone}
              onChange={(event) => set("contact_phone", event.target.value)}
              className="mt-1.5"
              placeholder="+254 700 000 000"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Phone number for buyer direct calls. Defaults to your profile phone if blank.
            </p>
            <FieldError messages={fieldErrors["contact_phone"]} />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 sm:col-span-2">
            <div>
              <Label htmlFor="car-negotiable">Price is negotiable</Label>
              <p className="text-xs text-muted-foreground">
                Buyers will see that you're open to offers.
              </p>
            </div>
            <Switch
              id="car-negotiable"
              checked={values.is_negotiable}
              onCheckedChange={(checked) => set("is_negotiable", checked)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="car-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="car-description"
              rows={5}
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
              className="mt-1.5"
              placeholder="Service history, extras, recent work…"
            />
            <FieldError messages={fieldErrors["description"]} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg heading-xl">Photos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add photos from your device or photo library. The first photo is used as the main display image.
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {photos.length} / 10 photos
          </span>
        </div>

        {/* Upload Button / Dropzone */}
        {photos.length < 10 ? (
          <label className="relative mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 px-5 py-6 text-center transition-all hover:border-primary/50 hover:bg-muted/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring">
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.gif,.webp,image/png,image/jpeg,image/gif,image/webp"
              multiple
              onChange={(event) => {
                addPhotosFromLibrary(event.target.files);
                event.target.value = "";
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Choose vehicle photos from your library"
            />
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
              <Upload className="size-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-foreground">
              {photos.length === 0 ? "Choose photos from your library" : "Add more photos from library"}
            </span>
            <span className="text-xs text-muted-foreground">
              PNG, JPG, JPEG, WebP or GIF · Tap or click to browse
            </span>
          </label>
        ) : null}

        <div className="mt-2">
          <FieldError messages={fieldErrors["images"]} />
        </div>

        {/* Photos grid */}
        {photos.length > 0 ? (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, index) => (
              <li
                key={photo.id}
                className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {photo.url ? (
                    <CarPhoto
                      url={photo.url}
                      alt={`Vehicle photo ${index + 1}`}
                      className="size-full"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImagePlus className="size-8" aria-hidden="true" />
                    </div>
                  )}

                  {index === 0 && (
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
                      <Star className="size-3 fill-primary-foreground" aria-hidden="true" />
                      Main photo
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1 p-2.5">
                  <span
                    className="min-w-0 truncate text-xs text-muted-foreground"
                    title={photo.name}
                  >
                    <span className="block font-medium text-foreground">
                      {index === 0 ? "Main photo" : `Photo ${index + 1}`}
                    </span>
                    <span className="block truncate">{photo.name}</span>
                  </span>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Make photo ${index + 1} the main photo`}
                      title="Set as main photo"
                      onClick={() => makePrimary(index)}
                      disabled={index === 0}
                    >
                      <Star
                        className={`size-4 ${index === 0 ? "fill-amber-400 text-amber-500" : ""}`}
                        aria-hidden="true"
                      />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Move photo ${index + 1} earlier`}
                      title="Move earlier"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Move photo ${index + 1} later`}
                      title="Move later"
                      onClick={() => move(index, 1)}
                      disabled={index === photos.length - 1}
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove photo ${index + 1}`}
                      title="Remove photo"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removePhoto(index)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {submitLabel}
        </Button>
        {secondaryAction}
      </div>
    </form>
  );
}

function FormSelect({
  id,
  label,
  value,
  options,
  onChange,
  messages,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  messages?: string[] | undefined;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="mt-1.5 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError messages={messages} />
    </div>
  );
}
