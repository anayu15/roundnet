"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, BookOpen, Trophy, Info, PlayCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

type Category = "rules" | "formats" | "general_info" | "videos";

type EducationalItem = {
  id: string;
  title_es: string;
  title_en: string;
  content_es: string;
  content_en: string;
  category: Category;
  video_url: string | null;
  sort_order: number;
  created_at: string;
};

const categoryIcons: Record<Category, React.ReactNode> = {
  rules: <BookOpen className="h-4 w-4" />,
  formats: <Trophy className="h-4 w-4" />,
  general_info: <Info className="h-4 w-4" />,
  videos: <PlayCircle className="h-4 w-4" />,
};

const categories: Category[] = ["rules", "formats", "general_info", "videos"];

function VideoPlayer({ url }: { url: string }) {
  // Handle YouTube URLs
  const getYouTubeEmbedUrl = (url: string): string | null => {
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
  };

  // Handle Vimeo URLs
  const getVimeoEmbedUrl = (url: string): string | null => {
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
    const match = url.match(vimeoRegex);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
    return null;
  };

  const embedUrl = getYouTubeEmbedUrl(url) || getVimeoEmbedUrl(url);

  if (embedUrl) {
    return (
      <div className="relative w-full pt-[56.25%]">
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={embedUrl}
          title="Video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // For direct video URLs (mp4, webm, etc.)
  return (
    <video
      className="w-full rounded-lg"
      controls
      preload="metadata"
    >
      <source src={url} />
      Your browser does not support the video tag.
    </video>
  );
}

function ContentCard({
  item,
  locale,
  showVideo = false,
}: {
  item: EducationalItem;
  locale: string;
  showVideo?: boolean;
}) {
  const title = locale === "es" ? item.title_es : item.title_en;
  const content = locale === "es" ? item.content_es : item.content_en;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showVideo && item.video_url && (
          <VideoPlayer url={item.video_url} />
        )}
        <CardDescription className="text-base whitespace-pre-wrap">
          {content}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

export function EducationalContent() {
  const t = useTranslations("educational");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<Category>("rules");
  const [content, setContent] = useState<EducationalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("educational_content")
        .select("*")
        .order("sort_order", { ascending: true });

      if (fetchError) {
        setError(t("error"));
        setIsLoading(false);
        return;
      }

      setContent(data || []);
      setIsLoading(false);
    };

    fetchContent();
  }, [t]);

  const getContentByCategory = (category: Category) => {
    return content.filter((item) => item.category === category);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as Category)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              {categoryIcons[category]}
              <span className="hidden sm:inline">
                {t(`categories.${category}`)}
              </span>
              <span className="sm:hidden">
                {t(`categories.${category}`).split(" ")[0]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => {
          const categoryContent = getContentByCategory(category);

          return (
            <TabsContent key={category} value={category} className="mt-0">
              {categoryContent.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-muted-foreground">{t("noContent")}</div>
                </div>
              ) : (
                <div className="grid gap-6">
                  {categoryContent.map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      locale={locale}
                      showVideo={category === "videos"}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
