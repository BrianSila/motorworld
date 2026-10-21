import { useEffect, useState } from "react";
import { Cookie, ShieldCheck, Sliders, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COOKIE_STORAGE_KEY = "simatei.cookie_consent.v1";
const OPEN_PREFERENCES_EVENT = "simatei:open-cookie-preferences";

export type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
  timestamp: number;
};

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: true,
  functional: true,
  timestamp: 0,
};

export function getCookieConsent(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookiePreferences;
  } catch {
    return null;
  }
}

export function saveCookieConsent(prefs: CookiePreferences) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      COOKIE_STORAGE_KEY,
      JSON.stringify({ ...prefs, timestamp: Date.now() }),
    );
  } catch {
    // Ignore localStorage write failures
  }
}

export function openCookiePreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_PREFERENCES_EVENT));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [functional, setFunctional] = useState(true);

  useEffect(() => {
    // Check if consent has already been given
    const consent = getCookieConsent();
    if (!consent) {
      // Delay slightly for smooth entrance
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setAnalytics(consent.analytics);
      setFunctional(consent.functional);
    }
  }, []);

  useEffect(() => {
    function handleOpen() {
      const consent = getCookieConsent() || DEFAULT_PREFERENCES;
      setAnalytics(consent.analytics);
      setFunctional(consent.functional);
      setModalOpen(true);
    }

    window.addEventListener(OPEN_PREFERENCES_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, handleOpen);
  }, []);

  function handleAcceptAll() {
    const prefs: CookiePreferences = {
      necessary: true,
      analytics: true,
      functional: true,
      timestamp: Date.now(),
    };
    saveCookieConsent(prefs);
    setVisible(false);
    setModalOpen(false);
  }

  function handleEssentialOnly() {
    const prefs: CookiePreferences = {
      necessary: true,
      analytics: false,
      functional: false,
      timestamp: Date.now(),
    };
    saveCookieConsent(prefs);
    setVisible(false);
    setModalOpen(false);
  }

  function handleSavePreferences() {
    const prefs: CookiePreferences = {
      necessary: true,
      analytics,
      functional,
      timestamp: Date.now(),
    };
    saveCookieConsent(prefs);
    setVisible(false);
    setModalOpen(false);
  }

  return (
    <>
      {/* Floating Bottom Cookie Consent Banner */}
      {visible ? (
        <aside
          role="region"
          aria-label="Cookie consent"
          className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="rounded-2xl border border-border/80 bg-card/95 p-5 sm:p-6 shadow-lift backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Cookie className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-bold text-foreground text-sm sm:text-base leading-tight">
                    Cookie &amp; Privacy Preferences
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We use cookies to personalize your vehicle search experience
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEssentialOnly}
                aria-label="Dismiss cookie notice"
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Simatei Motorworld uses cookies to maintain secure sessions, remember your vehicle filter preferences, and analyze vehicle views to improve listings. You can choose to accept all or customize your choices.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground justify-start sm:justify-center px-2"
              >
                <Sliders className="size-3.5 mr-1.5" aria-hidden="true" />
                Customize Preferences
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEssentialOnly}
                  className="text-xs font-semibold h-9 px-3.5"
                >
                  Essential Only
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAcceptAll}
                  className="text-xs font-bold h-9 px-4 shadow-xs"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </aside>
      ) : null}

      {/* Comprehensive Cookie Preferences Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              <DialogTitle className="text-xl">Manage Cookie Preferences</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure how Simatei Motorworld uses cookies on your device. You can update these settings at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Strictly Necessary */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">Strictly Necessary Cookies</span>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                      Always Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Required for core security, maintaining your signed-in account state, and CSRF protection. These cannot be disabled.
                  </p>
                </div>
                <Switch checked={true} disabled aria-label="Strictly necessary cookies (always active)" />
              </div>
            </div>

            {/* Analytics & Performance */}
            <div className="rounded-xl border border-border/80 bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-foreground block">
                    Analytics &amp; Performance
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Helps us understand vehicle demand and which makes/models are most popular, allowing sellers to price accurately.
                  </p>
                </div>
                <Switch
                  checked={analytics}
                  onCheckedChange={setAnalytics}
                  aria-label="Toggle analytics cookies"
                />
              </div>
            </div>

            {/* Functional & Experience */}
            <div className="rounded-xl border border-border/80 bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-foreground block">
                    Functional &amp; Experience
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Remembers your search filters, favorite vehicles list, and custom view modes so you don&apos;t have to re-enter them.
                  </p>
                </div>
                <Switch
                  checked={functional}
                  onCheckedChange={setFunctional}
                  aria-label="Toggle functional cookies"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEssentialOnly}
              className="text-xs font-semibold sm:mr-auto"
            >
              Reject Non-Essential
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSavePreferences}
              className="text-xs font-semibold"
            >
              Save Preferences
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAcceptAll}
              className="text-xs font-bold shadow-xs"
            >
              Accept All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
