import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/common/states";
import { GoogleAuthButton } from "@/components/common/GoogleAuthButton";
import * as authApi from "@/lib/api/auth";
import { ApiError, errorMessage, fieldErrorsOf } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    ...(typeof search["redirect"] === "string" ? { redirect: search["redirect"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Create an account — Simatei Motorworld" },
      {
        name: "description",
        content:
          "Create a free Simatei Motorworld account to save vehicles, book test drives and list cars for sale.",
      },
      { property: "og:title", content: "Create an account — Simatei Motorworld" },
      {
        property: "og:description",
        content:
          "Create a free Simatei Motorworld account to save vehicles, book test drives and list cars for sale.",
      },
    ],
  }),
  component: RegisterPage,
});

function validatePassword(password: string): string[] {
  const problems: string[] = [];
  if (password.length < 8) problems.push("Use at least 8 characters.");
  if (!/[0-9]/.test(password)) problems.push("Include at least one number.");
  if (!/[^A-Za-z0-9]/.test(password)) problems.push("Include at least one special character.");
  return problems;
}

function RegisterPage() {
  const { setSession, isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [touchedPassword, setTouchedPassword] = useState(false);

  const fieldErrors = fieldErrorsOf(error);
  const passwordProblems = validatePassword(password);
  const destination = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/";

  useEffect(() => {
    if (isReady && isAuthenticated) {
      void navigate({ href: destination, replace: true });
    }
  }, [isReady, isAuthenticated, navigate, destination]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setTouchedPassword(true);

    const local: Record<string, string[]> = {};
    if (!name.trim()) local["name"] = ["Enter your full name"];
    if (!email.trim()) local["email"] = ["Enter your email address"];
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      local["email"] = ["Enter a valid email address"];
    if (passwordProblems.length > 0) local["password"] = passwordProblems;

    if (Object.keys(local).length > 0) {
      setError(new ApiError("Please fix the highlighted fields.", 400, local));
      return;
    }

    setPending(true);
    try {
      const response = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() ? phone.trim() : null,
        password,
      });
      setSession(response.user, response.token);
      toast.success("Account created — you're signed in");
      void navigate({ href: destination, replace: true });
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }

  const status = error instanceof ApiError ? error.status : null;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <p className="eyebrow">Join Simatei Motorworld</p>
      <h1 className="mt-1 text-3xl heading-xl">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Save vehicles, send enquiries, book test drives and list your own cars.
      </p>

      {error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>
            {status === 409
              ? "An account already exists with that email. Try signing in instead."
              : errorMessage(error)}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-8 space-y-4">
        <GoogleAuthButton
          mode="signup"
          destination={destination}
          onError={setError}
        />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/70" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground font-semibold">
              Or continue with email
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={name}
            autoComplete="name"
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(fieldErrors["name"])}
            className="mt-1.5"
          />
          <FieldError messages={fieldErrors["name"]} />
        </div>

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
          <Label htmlFor="phone">
            Phone <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            aria-invalid={Boolean(fieldErrors["phone"])}
            className="mt-1.5"
            placeholder="+254 700 000 000"
          />
          <FieldError messages={fieldErrors["phone"]} />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1.5">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onBlur={() => setTouchedPassword(true)}
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
          {touchedPassword && passwordProblems.length > 0 ? (
            <FieldError messages={passwordProblems} />
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">
              At least 8 characters, including a number and a special character.
            </p>
          )}
          <FieldError messages={fieldErrors["password"]} />
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
