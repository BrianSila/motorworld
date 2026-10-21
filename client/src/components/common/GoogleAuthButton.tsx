import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Loader2, Sparkles, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as authApi from "@/lib/api/auth";
import { ApiError, errorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: () => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle";
              width?: string | number;
            },
          ) => void;
        };
      };
    };
  }
}

export function GoogleLogo({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

type GoogleAuthButtonProps = {
  mode?: "signup" | "signin";
  destination?: string;
  onError?: (error: unknown) => void;
  className?: string;
};

export function GoogleAuthButton({
  mode = "signup",
  destination = "/",
  onError,
  className = "",
}: GoogleAuthButtonProps) {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Handle Google Token response from real GIS
  async function handleGoogleSuccess(credential: string) {
    setLoading(true);
    try {
      const res = await authApi.loginWithGoogle({ credential });
      setSession(res.user, res.token);
      toast.success(
        mode === "signup"
          ? `Welcome to Simatei Motorworld, ${res.user.name}!`
          : `Signed in as ${res.user.name}`,
      );
      void navigate({ href: destination, replace: true });
    } catch (err) {
      if (onError) onError(err);
      toast.error(errorMessage(err) || "Failed to authenticate with Google");
    } finally {
      setLoading(false);
    }
  }

  // Load Google Identity Services script if client ID is set
  useEffect(() => {
    if (!clientId) return;

    const existingScript = document.getElementById("google-gsi-client");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGsi();
      };
      document.body.appendChild(script);
    } else {
      initGsi();
    }

    function initGsi() {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              void handleGoogleSuccess(response.credential);
            }
          },
        });
      }
    }
  }, [clientId]);

  async function handleClick() {
    if (clientId && window.google?.accounts?.id) {
      // Trigger official Google One Tap prompt
      window.google.accounts.id.prompt();
    } else {
      // Open simulated Google authentication dialog
      setModalOpen(true);
    }
  }

  // Submit through simulated / quick Google OAuth flow
  async function handleSimulatedAuth(presetEmail?: string, presetName?: string) {
    const emailToUse = presetEmail || googleEmail.trim();
    const nameToUse = presetName || googleName.trim() || emailToUse.split("@")[0];

    if (!emailToUse || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse)) {
      toast.error("Please enter a valid Google email address");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.loginWithGoogle({
        email: emailToUse,
        name: nameToUse,
      });
      setSession(res.user, res.token);
      setModalOpen(false);
      toast.success(
        mode === "signup"
          ? `Account created! Welcome, ${res.user.name}.`
          : `Signed in as ${res.user.name}`,
      );
      void navigate({ href: destination, replace: true });
    } catch (err) {
      if (onError) onError(err);
      toast.error(errorMessage(err) || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div ref={googleBtnRef} className="w-full">
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={loading}
          className={`w-full h-11 border-border/80 bg-card hover:bg-muted/50 text-foreground font-semibold flex items-center justify-center gap-3 shadow-xs hover:border-primary/30 transition-all ${className}`}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : (
            <GoogleLogo className="size-5 shrink-0" />
          )}
          <span>{mode === "signup" ? "Continue with Google" : "Sign in with Google"}</span>
        </Button>
      </div>

      {/* Interactive Google Sign-In Dialog (instant dev mode or fallback) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="text-center sm:text-left">
            <div className="flex items-center gap-2 mb-1">
              <GoogleLogo className="size-6" />
              <DialogTitle className="text-xl">Sign in with Google</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              to continue to <strong className="text-foreground">Simatei Motorworld</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Quick Demo Google Accounts */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Choose an account
              </span>

              <button
                type="button"
                onClick={() =>
                  handleSimulatedAuth("alex.maina@gmail.com", "Alex Maina")
                }
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/50 hover:border-primary/40 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-blue-500/10 text-blue-600 font-bold flex items-center justify-center text-sm">
                    A
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-snug">Alex Maina</p>
                    <p className="text-xs text-muted-foreground">alex.maina@gmail.com</p>
                  </div>
                </div>
                <UserCheck className="size-4 text-muted-foreground" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSimulatedAuth("fidel.orwasa@gmail.com", "Fidel Orwasa")
                }
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/50 hover:border-primary/40 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center text-sm">
                    F
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-snug">Fidel Orwasa</p>
                    <p className="text-xs text-muted-foreground">fidel.orwasa@gmail.com</p>
                  </div>
                </div>
                <UserCheck className="size-4 text-muted-foreground" aria-hidden="true" />
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-medium">Or enter Google account</span>
              </div>
            </div>

            {/* Custom Google Account Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSimulatedAuth();
              }}
              className="space-y-3"
            >
              <div>
                <Label htmlFor="google-email" className="text-xs">
                  Google Email
                </Label>
                <Input
                  id="google-email"
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="mt-1 h-9 text-sm"
                  required
                />
              </div>

              <div>
                <Label htmlFor="google-name" className="text-xs">
                  Full Name (optional)
                </Label>
                <Input
                  id="google-name"
                  type="text"
                  placeholder="Your Name"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="mt-1 h-9 text-sm"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-10 font-bold gap-2 mt-2">
                {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                <span>Continue with this account</span>
              </Button>
            </form>

            <div className="rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground flex items-start gap-2">
              <Sparkles className="size-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                To enable live Google Cloud OAuth in production, set <code className="font-mono text-foreground font-bold">VITE_GOOGLE_CLIENT_ID</code> in your <code className="font-mono">client/.env</code>.
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
