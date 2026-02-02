"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X, User, LogIn, LogOut, Loader2 } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const navItems = [
  { key: "educational", href: "/educational" },
  { key: "tournaments", href: "/tournaments" },
  { key: "training", href: "/training" },
  { key: "rankings", href: "/rankings" },
  { key: "bulkOrders", href: "/bulk-orders" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setIsLoggingOut(false);
    router.push(`/${locale}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-semibold text-lg"
        >
          <span className="text-primary">Roundnet</span>
          <span className="text-muted-foreground">Spain</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={`/${locale}${item.href}`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        {/* Desktop Right Section */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />

          {/* Auth Status */}
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href={`/${locale}/profile`}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <User className="h-4 w-4" />
                {tAuth("profile")}
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                {tAuth("logout")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/${locale}/login`}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogIn className="h-4 w-4" />
                {tAuth("login")}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {tAuth("register")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? t("closeMenu") : t("menu")}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-[500px] border-t border-border/40" : "max-h-0"
        )}
      >
        <nav className="container mx-auto px-4 py-4 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={`/${locale}${item.href}`}
              className="block text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t(item.key)}
            </Link>
          ))}

          <div className="pt-4 border-t border-border/40 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("home")}
              </span>
              <LanguageSwitcher />
            </div>

            {/* Mobile Auth */}
            {isLoading ? (
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <Link
                  href={`/${locale}/profile`}
                  className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5" />
                  {tAuth("profile")}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  disabled={isLoggingOut}
                  className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <LogOut className="h-5 w-5" />
                  )}
                  {tAuth("logout")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href={`/${locale}/login`}
                  className="flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="h-5 w-5" />
                  {tAuth("login")}
                </Link>
                <Link
                  href={`/${locale}/register`}
                  className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {tAuth("register")}
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
