"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Loader2,
  Calendar,
  MapPin,
  Users,
  Clock,
  Trophy,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Medal,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type TournamentStatus = "open" | "closed" | "completed";
type TournamentCategory = "mens" | "womens" | "mixed";

type TeamMember = {
  id: string;
  role: "player1" | "player2";
  user_id: string | null;
  shadow_player_id: string | null;
  profiles: { full_name: string } | null;
  shadow_players: { name: string } | null;
};

type Team = {
  id: string;
  team_name: string;
  registration_date: string;
  tournament_team_members: TeamMember[];
};

type Result = {
  id: string;
  placement: number;
  points_awarded: number;
  tournament_teams: {
    id: string;
    team_name: string;
  } | null;
};

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
  tournament_teams: Team[];
  tournament_results: Result[];
};

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
      return <CheckCircle2 className="h-4 w-4" />;
    case "closed":
      return <AlertCircle className="h-4 w-4" />;
    case "completed":
      return <Trophy className="h-4 w-4" />;
  }
}

function getPlacementIcon(placement: number) {
  switch (placement) {
    case 1:
      return <Medal className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return null;
  }
}

function getPlayerName(member: TeamMember): string {
  if (member.profiles?.full_name) {
    return member.profiles.full_name;
  }
  if (member.shadow_players?.name) {
    return member.shadow_players.name;
  }
  return "Unknown Player";
}

export function TournamentDetailContent({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const t = useTranslations("tournaments");
  const locale = useLocale();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournament = async () => {
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
          tournament_teams (
            id,
            team_name,
            registration_date,
            tournament_team_members (
              id,
              role,
              user_id,
              shadow_player_id,
              profiles:user_id (full_name),
              shadow_players:shadow_player_id (name)
            )
          ),
          tournament_results (
            id,
            placement,
            points_awarded,
            tournament_teams (
              id,
              team_name
            )
          )
        `
        )
        .eq("id", tournamentId)
        .neq("status", "draft")
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          setTournament(null);
        } else {
          setError(t("error"));
        }
        setIsLoading(false);
        return;
      }

      setTournament(data as unknown as Tournament);
      setIsLoading(false);
    };

    fetchTournament();
  }, [tournamentId, t]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(locale === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href={`/${locale}/tournaments`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("detail.backToList")}
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {t("detail.notFound")}
            </h2>
            <p className="text-muted-foreground">
              {t("detail.notFoundDescription")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const name = locale === "es" ? tournament.name_es : tournament.name_en;
  const description =
    locale === "es" ? tournament.description_es : tournament.description_en;
  const sortedResults = [...(tournament.tournament_results || [])].sort(
    (a, b) => a.placement - b.placement
  );
  const teams = tournament.tournament_teams || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link href={`/${locale}/tournaments`}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("detail.backToList")}
        </Button>
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start gap-3 mb-4">
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(tournament.status)}`}
          >
            {getStatusIcon(tournament.status)}
            {t(`status.${tournament.status}`)}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-sm">
          {t(`categories.${tournament.category}`)}
        </span>
      </div>

      <div className="grid gap-6">
        {/* Tournament Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("detail.information")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("detail.date")}
                  </p>
                  <p className="font-medium">{formatDate(tournament.date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("detail.location")}
                  </p>
                  <p className="font-medium">{tournament.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("detail.registrationDeadline")}
                  </p>
                  <p className="font-medium">
                    {formatDateTime(tournament.registration_deadline)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("detail.maxTeams")}
                  </p>
                  <p className="font-medium">
                    {tournament.max_teams ?? "∞"}{" "}
                    {tournament.max_teams
                      ? `(${teams.length} registered)`
                      : `(${teams.length} teams)`}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {description && (
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.description")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results (only for completed tournaments) */}
        {tournament.status === "completed" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {t("detail.results")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedResults.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {t("detail.noResults")}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                          {t("detail.placement")}
                        </th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                          {t("detail.team")}
                        </th>
                        <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                          {t("detail.points")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedResults.map((result) => (
                        <tr key={result.id} className="border-b last:border-0">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              {getPlacementIcon(result.placement)}
                              <span className="font-medium">
                                {result.placement}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2 font-medium">
                            {result.tournament_teams?.team_name ?? "-"}
                          </td>
                          <td className="py-3 px-2 text-right text-muted-foreground">
                            {result.points_awarded}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Registered Teams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("detail.registeredTeams")} ({teams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {t("detail.noTeams")}
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {teams.map((team) => {
                  const members = team.tournament_team_members || [];
                  const player1 = members.find((m) => m.role === "player1");
                  const player2 = members.find((m) => m.role === "player2");

                  return (
                    <div
                      key={team.id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <h4 className="font-semibold mb-2">{team.team_name}</h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        {t("detail.players")}:
                      </p>
                      <ul className="text-sm space-y-1">
                        {player1 && (
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            {getPlayerName(player1)}
                          </li>
                        )}
                        {player2 && (
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            {getPlayerName(player2)}
                          </li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
