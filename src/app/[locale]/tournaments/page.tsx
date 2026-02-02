import { Metadata } from "next";
import { getMessages, setRequestLocale } from "next-intl/server";
import { TournamentsContent } from "./tournaments-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const tournaments = messages.tournaments as {
    title: string;
    description: string;
  };
  const metadata = messages.metadata as { title: string };

  return {
    title: `${tournaments.title} | ${metadata.title}`,
    description: tournaments.description,
    openGraph: {
      title: `${tournaments.title} | ${metadata.title}`,
      description: tournaments.description,
      type: "website",
    },
  };
}

export default async function TournamentsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TournamentsContent />;
}
