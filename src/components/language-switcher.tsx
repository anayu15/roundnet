"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    // Remove current locale prefix and add new one
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <div className="flex items-center gap-2">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            locale === loc
              ? "bg-foreground text-background"
              : "bg-transparent text-foreground hover:bg-black/5 dark:hover:bg-white/10"
          }`}
          aria-label={loc === "es" ? t("spanish") : t("english")}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
