"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Coins,
  Headphones,
  LogOut,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useHybridAuth } from "@/components/layout/providers";
import { useAuth } from "@/store/auth";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useHybridAuth();
  const user = useAuth((s) => s.user);
  const mode = useAuth((s) => s.mode);
  const clearAuth = useAuth((s) => s.clearAuth);

  const role = user?.role ?? "";

  const links =
    role === "parent"
      ? [
          { href: "/parent", label: "Parent", icon: ShieldCheck },
          { href: "/calls", label: "Calls", icon: PhoneCall },
        ]
      : role === "admin"
        ? [
            { href: "/admin", label: "Ops", icon: ShieldCheck },
            { href: "/calls", label: "Calls", icon: PhoneCall },
          ]
        : [
            { href: "/dashboard", label: "Penny", icon: Coins },
            { href: "/calls", label: "Calls", icon: Headphones },
          ];

  const handleLogout = () => {
    if (mode === "auth0") {
      logout();
    } else {
      clearAuth();
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200/70 bg-[#fff8ef]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 text-stone-900 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-300/60 bg-[linear-gradient(135deg,#f7c95c,#ff9f6e)] shadow-[0_10px_25px_rgba(245,158,11,0.16)]">
            <Sparkles className="h-4 w-4 text-stone-900" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-[0.18em] uppercase text-stone-500">
              Penny
            </div>
            <div className="text-base font-semibold text-stone-950">
              Customer Care
            </div>
          </div>
        </Link>

        <nav className="ml-4 flex flex-1 items-center gap-1.5">
          {user &&
            links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === link.href
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-1.5 rounded-full"
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
        </nav>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-1.5 text-sm text-stone-600 sm:flex">
              <User className="h-4 w-4 shrink-0" />
              <span className="max-w-[10rem] truncate font-medium text-stone-900">
                {user.name}
              </span>
            </div>
          )}
          {user ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full border-stone-300 bg-white/80"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          ) : (
            <Link href="/login">
              <Button size="sm" className="rounded-full">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
