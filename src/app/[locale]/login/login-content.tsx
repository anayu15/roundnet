"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LoginForm } from "@/components/login-form";

export function LoginPageContent() {
  const t = useTranslations("login");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();

  const handleLoginSuccess = () => {
    // Redirect to home page after successful login
    router.push(`/${locale}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {tAuth("noAccount")}{" "}
          <Link
            href={`/${locale}/register`}
            className="font-medium text-primary hover:underline"
          >
            {tAuth("register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
