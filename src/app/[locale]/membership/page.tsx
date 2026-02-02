import { setRequestLocale } from "next-intl/server";
import { MembershipContent } from "./membership-content";

export default async function MembershipPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MembershipContent />;
}
