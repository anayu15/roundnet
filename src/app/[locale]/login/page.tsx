import { setRequestLocale } from "next-intl/server";
import { LoginPageContent } from "./login-content";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LoginPageContent />;
}
