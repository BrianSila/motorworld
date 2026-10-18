import { useEffect, useState } from "react";
import { Car as CarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api/client";

export function CarPhoto({
  url,
  alt,
  className,
}: {
  url: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  let imageUrl = url;
  if (
    url &&
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("blob:") &&
    !url.startsWith("data:")
  ) {
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    const staticPath = cleanUrl.startsWith("/static/") ? cleanUrl : `/static${cleanUrl}`;
    imageUrl = `${API_BASE_URL.replace(/\/api\/?$/, "")}${staticPath}`;
  }

  if (!imageUrl || failed) {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}
        role="img"
        aria-label={`${alt} — image unavailable`}
      >
        <CarIcon className="size-10 opacity-40" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
