import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarClock,
  Car,
  Heart,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  ShieldCheck,
  Tag,
  User2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import companyLogo from "@/assets/company-logo.jpeg";

const navLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/cars", label: "Inventory", icon: Car },
  { to: "/sell", label: "Sell", icon: Tag },
] as const;

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Simatei Motorworld home">
      <img
        src={companyLogo}
        alt="Simatei Motorworld"
        className="h-10 sm:h-11 w-auto max-w-[180px] sm:max-w-[210px] object-contain"
      />
    </Link>
  );
}

function AccountMenu() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    await signOut();
    queryClient.clear();
    toast.success("You have been signed out");
    void navigate({ to: "/", replace: true });
  }

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2">
          <User2 className="size-4" aria-hidden="true" />
          <span className="max-w-24 truncate">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account">
            <User2 className="size-4" aria-hidden="true" /> My account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/favourites">
            <Heart className="size-4" aria-hidden="true" /> Favourites
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/enquiries">
            <MessageSquare className="size-4" aria-hidden="true" /> Enquiries
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/test-drives">
            <CalendarClock className="size-4" aria-hidden="true" /> Test drives
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/sell/cars">
            <LayoutDashboard className="size-4" aria-hidden="true" /> My listings
          </Link>
        </DropdownMenuItem>
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link to="/admin">
              <ShieldCheck className="size-4" aria-hidden="true" /> Admin
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()}>
          <LogOut className="size-4" aria-hidden="true" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isReady, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4">
          <Brand />

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: link.to === "/" }}
                activeProps={{ className: "text-primary" }}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isReady && isAuthenticated ? (
              <AccountMenu />
            ) : isReady ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/register">Create account</Link>
                </Button>
              </div>
            ) : null}

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-6">
                <SheetTitle className="mb-6">Menu</SheetTitle>
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      activeOptions={{ exact: link.to === "/" }}
                      activeProps={{ className: "bg-primary/10 text-primary font-semibold" }}
                      className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent flex items-center gap-2.5 transition-colors"
                    >
                      <link.icon className="size-4 shrink-0" aria-hidden="true" />
                      <span>{link.label}</span>
                    </Link>
                  ))}

                  <div className="my-2 border-t border-border" />

                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/account"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent flex items-center gap-2.5"
                      >
                        <User2 className="size-4" aria-hidden="true" />
                        My account
                      </Link>
                      <Link
                        to="/account/favourites"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent flex items-center gap-2.5"
                      >
                        <Heart className="size-4" aria-hidden="true" />
                        Favourites
                      </Link>
                      <Link
                        to="/account/enquiries"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent flex items-center gap-2.5"
                      >
                        <MessageSquare className="size-4" aria-hidden="true" />
                        Enquiries
                      </Link>
                      <Link
                        to="/account/test-drives"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent flex items-center gap-2.5"
                      >
                        <CalendarClock className="size-4" aria-hidden="true" />
                        Test drives
                      </Link>
                      <Link
                        to="/sell/cars"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent flex items-center gap-2.5"
                      >
                        <LayoutDashboard className="size-4" aria-hidden="true" />
                        My listings
                      </Link>
                      {isAdmin ? (
                        <Link
                          to="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent flex items-center gap-2.5"
                        >
                          <ShieldCheck className="size-4" aria-hidden="true" />
                          Admin
                        </Link>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent flex items-center gap-2.5"
                      >
                        <LogIn className="size-4" aria-hidden="true" />
                        Sign in
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent flex items-center gap-2.5"
                      >
                        <UserPlus className="size-4" aria-hidden="true" />
                        Create account
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-card/40">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <Brand />
          <p className="text-sm text-muted-foreground">
            Kenya&apos;s trusted vehicle marketplace. Prices in KES.
          </p>
          <nav aria-label="Footer" className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/cars" className="hover:text-foreground">
              Inventory
            </Link>
            <Link to="/sell" className="hover:text-foreground">
              Sell a vehicle
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
