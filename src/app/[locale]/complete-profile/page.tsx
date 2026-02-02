import { setRequestLocale } from "next-intl/server";
import { CompleteProfileContent } from "./complete-profile-content";

export default async function CompleteProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CompleteProfileContent />;
}
