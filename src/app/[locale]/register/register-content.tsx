"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { RegistrationForm } from "@/components/registration-form";

export function RegisterPageContent() {
  const t = useTranslations("registration");
  const tAuth = useTranslations("auth");
  const locale = useLocale();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <RegistrationForm />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {tAuth("alreadyHaveAccount")}{" "}
          <Link
            href={`/${locale}/login`}
            className="font-medium text-primary hover:underline"
          >
            {tAuth("login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
