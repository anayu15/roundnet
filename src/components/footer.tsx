"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

const navItems = [
  { key: "educational", href: "/educational" },
  { key: "tournaments", href: "/tournaments" },
  { key: "training", href: "/training" },
  { key: "rankings", href: "/rankings" },
  { key: "bulkOrders", href: "/bulk-orders" },
] as const;

export function Footer() {
  const t = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const locale = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2 font-semibold text-lg"
            >
              <span className="text-primary">Roundnet</span>
              <span className="text-muted-foreground">Spain</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Spanish Roundnet Federation
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              {t("menu")}
            </h3>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={`/${locale}${item.href}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t(item.key)}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              {tFooter("contact")}
            </h3>
            <nav className="flex flex-col gap-2">
              <Link
                href={`/${locale}/privacy`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {tFooter("privacy")}
              </Link>
              <Link
                href={`/${locale}/terms`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {tFooter("terms")}
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {tFooter("contact")}
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-border/40">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {currentYear} Roundnet Spain. {tFooter("rights")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
