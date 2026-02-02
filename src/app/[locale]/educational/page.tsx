import { Metadata } from "next";
import { getMessages, setRequestLocale } from "next-intl/server";
import { EducationalContent } from "./educational-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const educational = messages.educational as {
    title: string;
    description: string;
  };
  const metadata = messages.metadata as { title: string };

  return {
    title: `${educational.title} | ${metadata.title}`,
    description: educational.description,
    openGraph: {
      title: `${educational.title} | ${metadata.title}`,
      description: educational.description,
      type: "website",
    },
  };
}

export default async function EducationalPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <EducationalContent />;
}
