"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Loader2,
  Calendar,
  MapPin,
  Users,
  Clock,
  Trophy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type TournamentStatus = "open" | "closed" | "completed";
type TournamentCategory = "mens" | "womens" | "mixed";
type StatusFilter = "all" | "upcoming" | "completed";
type CategoryFilter = "all" | TournamentCategory;

type Tournament = {
  id: string;
  name_es: string;
  name_en: string;
  description_es: string;
  description_en: string;
  date: string;
  location: string;
  registration_deadline: string;
  max_teams: number | null;
  category: TournamentCategory;
  status: TournamentStatus;
  tournament_teams: { count: number }[];
};

const statusFilters: StatusFilter[] = ["all", "upcoming", "completed"];
const categoryFilters: CategoryFilter[] = ["all", "mens", "womens", "mixed"];

function getStatusColor(status: TournamentStatus) {
  switch (status) {
    case "open":
      return "text-green-600 bg-green-50 border-green-200";
    case "closed":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "completed":
      return "text-blue-600 bg-blue-50 border-blue-200";
  }
}

function getStatusIcon(status: TournamentStatus) {
  switch (status) {
    case "open":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "closed":
      return <AlertCircle className="h-3.5 w-3.5" />;
    case "completed":
      return <Trophy className="h-3.5 w-3.5" />;
  }
}

function TournamentCard({
  tournament,
  locale,
}: {
  tournament: Tournament;
  locale: string;
}) {
  const t = useTranslations("tournaments");

  const name = locale === "es" ? tournament.name_es : tournament.name_en;
  const teamCount = tournament.tournament_teams[0]?.count ?? 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const teamsDisplay = tournament.max_teams
    ? t("card.teamsRegistered", {
        count: teamCount,
        max: tournament.max_teams,
      })
    : t("card.teamsNoLimit", { count: teamCount });

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{name}</CardTitle>
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border shrink-0 ${getStatusColor(tournament.status)}`}
          >
            {getStatusIcon(tournament.status)}
            {t(`status.${tournament.status}`)}
          </span>
        </div>
        <CardDescription className="flex items-center gap-1 text-sm">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
            {t(`categories.${tournament.category}`)}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>{formatDate(tournament.date)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{tournament.location}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 shrink-0" />
          <span>{teamsDisplay}</span>
        </div>

        {tournament.status === "open" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {t("card.registrationDeadline")}{" "}
              {formatDate(tournament.registration_deadline)}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3">
        <Link href={`/${locale}/tournaments/${tournament.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            {t("card.viewDetails")}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export function TournamentsContent() {
  const t = useTranslations("tournaments");
  const locale = useLocale();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  useEffect(() => {
    const fetchTournaments = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("tournaments")
        .select(
          `
          id,
          name_es,
          name_en,
          description_es,
          description_en,
          date,
          location,
          registration_deadline,
          max_teams,
          category,
          status,
          tournament_teams(count)
        `
        )
        .neq("status", "draft")
        .order("date", { ascending: false });

      if (fetchError) {
        setError(t("error"));
        setIsLoading(false);
        return;
      }

      setTournaments(data || []);
      setIsLoading(false);
    };

    fetchTournaments();
  }, [t]);

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((tournament) => {
      // Status filter
      if (statusFilter === "upcoming") {
        if (tournament.status === "completed") return false;
      } else if (statusFilter === "completed") {
        if (tournament.status !== "completed") return false;
      }

      // Category filter
      if (categoryFilter !== "all" && tournament.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [tournaments, statusFilter, categoryFilter]);

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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-8">
        {/* Status Filter */}
        <Tabs
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <TabsList>
            {statusFilters.map((filter) => (
              <TabsTrigger key={filter} value={filter}>
                {t(`filters.${filter}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Category Filter */}
        <Tabs
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}
        >
          <TabsList>
            {categoryFilters.map((filter) => (
              <TabsTrigger key={filter} value={filter}>
                {t(`categories.${filter}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Tournament Grid */}
      {filteredTournaments.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{t("noTournaments")}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
