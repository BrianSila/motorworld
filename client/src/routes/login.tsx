import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/common/states";
import { GoogleAuthButton } from "@/components/common/GoogleAuthButton";
import * as authApi from "@/lib/api/auth";
import { ApiError, errorMessage, fieldErrorsOf } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    ...(typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Simatei Motorworld" },
      {
        name: "description",
        content: "Sign in to manage your favourites, enquiries, test drives and vehicle listings.",
      },
      { property: "og:title", content: "Sign in — Simatei Motorworld" },
      {
        property: "og:description",
        content: "Sign in to manage your favourites, enquiries, test drives and vehicle listings.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { setSession, isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fieldErrors = fieldErrorsOf(error);
  const destination = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/";

  useEffect(() => {
    if (isReady && isAuthenticated) {
      void navigate({ href: destination, replace: true });
    }
  }, [isReady, isAuthenticated, navigate, destination]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError(
        new ApiError("Enter your email and password to continue.", 400, {
          ...(email.trim() ? {} : { email: ["Email is required"] }),
          ...(password ? {} : { password: ["Password is required"] }),
        }),
      );
      return;
    }

    setPending(true);
    try {
      const response = await authApi.login({ email: email.trim(), password });
      setSession(response.user, response.token);
      toast.success(`Welcome back, ${response.user.name}`);
      void navigate({ href: destination, replace: true });
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  const status = error instanceof ApiError ? error.status : null;
  const blocked =
    error instanceof ApiError && /block/i.test(error.message) ? error.message : null;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <p className="eyebrow">Welcome back</p>
      <h1 className="mt-1 text-3xl heading-xl">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Access your favourites, enquiries, bookings and listings.
      </p>

      {error && !blocked ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>
            {status === 401
              ? "Those credentials don't match an account. Check your email and password."
              : errorMessage(error)}
          </AlertDescription>
        </Alert>
      ) : null}

      {blocked ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>
            This account has been blocked. Contact a Simatei Motorworld administrator for help.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-8 space-y-4">
        <GoogleAuthButton
          mode="signin"
          destination={destination}
          onError={setError}
        />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/70" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground font-semibold">
              Or sign in with email
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors["email"])}
            className="mt-1.5"
          />
          <FieldError messages={fieldErrors["email"]} />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1.5">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors["password"])}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <FieldError messages={fieldErrors["password"]} />
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Sign in
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <ForgotPasswordDialog />
        <p className="text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

function ForgotPasswordDialog() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await authApi.forgotPassword(email.trim());
      setMessage(response.message);
    } catch (caught) {
      setMessage(errorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="h-auto p-0 text-muted-foreground">
          Forgot password?
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Password recovery — coming soon</DialogTitle>
          <DialogDescription>
            Automated password reset is not live yet. You can register your email below and our team
            will follow up, or contact an administrator directly.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5"
            />
          </div>
          {message ? (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" disabled={pending || !email.trim()} className="w-full">
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Send request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
