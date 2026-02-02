import { setRequestLocale } from "next-intl/server";
import { RegisterPageContent } from "./register-content";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RegisterPageContent />;
}
