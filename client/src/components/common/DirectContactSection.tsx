import { useState } from "react";
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  MessageCircle,
  Phone,
  PhoneCall,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Car } from "@/lib/api/types";
import { formatPhoneDisplay, normalizeKenyaPhone, toWhatsAppUrl } from "@/lib/format";

type DirectContactProps = {
  car: Car;
  variant?: "card" | "sidebar";
  className?: string;
};

export function DirectCallDialog({
  car,
  trigger,
  defaultTab = "seller",
}: {
  car: Car;
  trigger?: React.ReactNode;
  defaultTab?: "seller" | "admin";
}) {
  const [open, setOpen] = useState(false);
  const [copiedSeller, setCopiedSeller] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  const sellerPhone = car.contact_phone || car.seller?.phone || null;
  const adminPhone = car.admin_phone || "0740892332";
  const sellerName = car.seller?.name || "Vehicle Lister";
  const carTitle = `${car.year} ${car.make} ${car.model}`;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const whatsappMsg = `Hi ${sellerName}, I am interested in your ${carTitle} listed on Simatei Motorworld (${currentUrl}). Is it still available?`;
  const sellerWhatsApp = toWhatsAppUrl(sellerPhone, whatsappMsg);

  function copyToClipboard(text: string, type: "seller" | "admin") {
    void navigator.clipboard.writeText(text);
    if (type === "seller") {
      setCopiedSeller(true);
      setTimeout(() => setCopiedSeller(false), 2000);
      toast.success("Seller phone copied to clipboard");
    } else {
      setCopiedAdmin(true);
      setTimeout(() => setCopiedAdmin(false), 2000);
      toast.success("Dealership admin phone copied to clipboard");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="default" className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <PhoneCall className="size-4" aria-hidden="true" />
            <span>Call Seller or Admin</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PhoneCall className="size-5 text-emerald-600" aria-hidden="true" />
            Direct Contact Options
          </DialogTitle>
          <DialogDescription>
            Call the seller directly or contact our Simatei concierge desk regarding this {carTitle}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Seller Direct Call Box */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <UserCheck className="size-4 text-emerald-600" aria-hidden="true" />
                  <span className="font-semibold text-foreground">{sellerName}</span>
                  <Badge variant="outline" className="border-emerald-600/30 text-emerald-600 text-[10px]">
                    Listed this car
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Direct contact provided by the seller
                </p>
              </div>
            </div>

            {sellerPhone ? (
              <div className="mt-3">
                <div className="flex items-center justify-between rounded-lg bg-background p-2.5 border border-border">
                  <span className="font-mono text-base font-semibold text-foreground tracking-wide">
                    {formatPhoneDisplay(sellerPhone)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => copyToClipboard(sellerPhone, "seller")}
                  >
                    {copiedSeller ? (
                      <>
                        <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    <a href={`tel:${normalizeKenyaPhone(sellerPhone)}`}>
                      <Phone className="size-4" aria-hidden="true" />
                      <span>Call Now</span>
                    </a>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 gap-2"
                  >
                    <a href={sellerWhatsApp} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="size-4" aria-hidden="true" />
                      <span>WhatsApp</span>
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
                The seller hasn't provided a personal phone number. Please call the Simatei Admin Concierge below or submit an enquiry.
              </div>
            )}
          </div>

          {/* Admin / Simatei Concierge Box */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                  <span className="font-semibold text-foreground">Simatei Concierge & Admin</span>
                  <Badge variant="secondary" className="text-[10px]">
                    Dealership Verified
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Official support desk for inspections, verification & secure purchase
                </p>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between rounded-lg bg-background p-2.5 border border-border">
                <div>
                  <span className="font-mono text-base font-semibold text-foreground tracking-wide">
                    {formatPhoneDisplay(adminPhone)}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                    <Clock className="size-3" aria-hidden="true" />
                    <span>Mon – Sat: 8:00 AM – 6:00 PM</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => copyToClipboard(adminPhone, "admin")}
                >
                  {copiedAdmin ? (
                    <>
                      <Check className="size-3.5 text-primary" aria-hidden="true" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-3">
                <Button asChild variant="outline" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10">
                  <a href={`tel:${normalizeKenyaPhone(adminPhone)}`}>
                    <PhoneCall className="size-4" aria-hidden="true" />
                    <span>Call Simatei Admin Concierge</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact direct contact actions for the Car detail sidebar (aside)
 */
export function SidebarDirectContact({ car }: { car: Car }) {
  const [copied, setCopied] = useState(false);
  const sellerPhone = car.contact_phone || car.seller?.phone || null;
  const adminPhone = car.admin_phone || "0740892332";
  const sellerName = car.seller?.name || "Seller";
  const carTitle = `${car.year} ${car.make} ${car.model}`;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const whatsappMsg = `Hi ${sellerName}, I am interested in your ${carTitle} on Simatei Motorworld (${currentUrl}). Is it still available?`;
  const sellerWhatsApp = toWhatsAppUrl(sellerPhone, whatsappMsg);

  function copyNumber(phone: string) {
    void navigator.clipboard.writeText(phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Phone number copied to clipboard");
  }

  return (
    <div className="rounded-lg border border-border bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <PhoneCall className="size-3.5 text-emerald-600" aria-hidden="true" />
          Direct Call & Chat
        </span>
        <DirectCallDialog
          car={car}
          trigger={
            <button
              type="button"
              className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-0.5"
            >
              Details
            </button>
          }
        />
      </div>

      {sellerPhone ? (
        <div className="space-y-2">
          <Button asChild className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm">
            <a href={`tel:${normalizeKenyaPhone(sellerPhone)}`}>
              <Phone className="size-4" aria-hidden="true" />
              <span>Call Seller ({formatPhoneDisplay(sellerPhone)})</span>
            </a>
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 gap-1.5 text-xs"
            >
              <a href={sellerWhatsApp} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-3.5" aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => copyNumber(sellerPhone)}
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  <span>Copy No.</span>
                </>
              )}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Admin helpline button */}
      <Button asChild variant="outline" size="sm" className="w-full gap-2 text-xs border-dashed">
        <a href={`tel:${normalizeKenyaPhone(adminPhone)}`}>
          <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
          <span>Call Admin Desk: {formatPhoneDisplay(adminPhone)}</span>
        </a>
      </Button>
    </div>
  );
}

/**
 * Rich direct contact card displayed in the main specifications column
 */
export function DirectContactCard({ car }: { car: Car }) {
  const [copiedSeller, setCopiedSeller] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  const sellerPhone = car.contact_phone || car.seller?.phone || null;
  const adminPhone = car.admin_phone || "0740892332";
  const sellerName = car.seller?.name || "Vehicle Lister";
  const carTitle = `${car.year} ${car.make} ${car.model}`;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const whatsappMsg = `Hi ${sellerName}, I am interested in your ${carTitle} listed on Simatei Motorworld (${currentUrl}). Is it still available?`;
  const sellerWhatsApp = toWhatsAppUrl(sellerPhone, whatsappMsg);

  function copy(phone: string, type: "seller" | "admin") {
    void navigator.clipboard.writeText(phone);
    if (type === "seller") {
      setCopiedSeller(true);
      setTimeout(() => setCopiedSeller(false), 2000);
      toast.success("Seller phone copied to clipboard");
    } else {
      setCopiedAdmin(true);
      setTimeout(() => setCopiedAdmin(false), 2000);
      toast.success("Admin phone copied to clipboard");
    }
  }

  return (
    <section className="mt-10 overflow-hidden rounded-xl border border-border bg-card p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
        <div>
          <h2 className="text-xl heading-xl flex items-center gap-2">
            <PhoneCall className="size-5 text-emerald-600" aria-hidden="true" />
            Speak Directly with Seller or Admin
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect immediately via phone call or WhatsApp to discuss pricing, inspect the car, or arrange payment.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Person Who Listed The Car */}
        <div className="flex flex-col justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-white font-semibold text-sm">
                  {sellerName.charAt(0).toUpperCase()}
                </span>
                <div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight">
                    {sellerName}
                  </h3>
                  <p className="text-xs text-muted-foreground">Person who listed this vehicle</p>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-600/30 text-emerald-600 bg-emerald-600/10 text-xs">
                Seller
              </Badge>
            </div>

            <div className="mt-5 rounded-lg bg-background/80 p-3.5 border border-border">
              <span className="text-xs text-muted-foreground block">Direct phone number</span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="font-mono text-lg font-bold text-foreground">
                  {sellerPhone ? formatPhoneDisplay(sellerPhone) : "Not provided"}
                </span>
                {sellerPhone ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => copy(sellerPhone, "seller")}
                  >
                    {copiedSeller ? (
                      <>
                        <Check className="size-3 text-emerald-600" aria-hidden="true" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3 text-muted-foreground" aria-hidden="true" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {sellerPhone ? (
              <>
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium">
                  <a href={`tel:${normalizeKenyaPhone(sellerPhone)}`}>
                    <Phone className="size-4" aria-hidden="true" />
                    <span>Call {sellerName}</span>
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 gap-2"
                >
                  <a href={sellerWhatsApp} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="size-4" aria-hidden="true" />
                    <span>Chat on WhatsApp</span>
                    <ExternalLink className="size-3.5 ml-auto opacity-60" aria-hidden="true" />
                  </a>
                </Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                Use the admin helpline or send an email enquiry to connect.
              </p>
            )}
          </div>
        </div>

        {/* Simatei Admin Concierge Desk */}
        <div className="flex flex-col justify-between rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                  SM
                </span>
                <div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight">
                    Simatei Concierge Desk
                  </h3>
                  <p className="text-xs text-muted-foreground">Dealership verification & support</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Admin Support
              </Badge>
            </div>

            <div className="mt-5 rounded-lg bg-background/80 p-3.5 border border-border">
              <span className="text-xs text-muted-foreground block">Admin Hotline (Helpline)</span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="font-mono text-lg font-bold text-foreground">
                  {formatPhoneDisplay(adminPhone)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={() => copy(adminPhone, "admin")}
                >
                  {copiedAdmin ? (
                    <>
                      <Check className="size-3 text-primary" aria-hidden="true" />
                      <span className="text-primary">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3 text-muted-foreground" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3 text-muted-foreground" aria-hidden="true" />
                <span>Mon – Sat: 8:00 AM – 6:00 PM</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              Call our administrators directly for pre-purchase inspection requests, ownership title checks, or financing assistance.
            </p>
          </div>

          <div className="mt-5">
            <Button asChild variant="outline" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10">
              <a href={`tel:${normalizeKenyaPhone(adminPhone)}`}>
                <PhoneCall className="size-4" aria-hidden="true" />
                <span>Call Admin Directly</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
