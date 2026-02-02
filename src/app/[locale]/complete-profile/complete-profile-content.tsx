"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const createUsernameSchema = (t: ReturnType<typeof useTranslations<"completeProfile">>) =>
  z.object({
    username: z
      .string()
      .min(1, t("errors.usernameRequired"))
      .min(2, t("errors.usernameMinLength"))
      .max(100, t("errors.usernameMaxLength")),
  });

type UsernameFormValues = z.infer<ReturnType<typeof createUsernameSchema>>;

type UsernameStatus = "idle" | "checking" | "available" | "taken";

export function CompleteProfileContent() {
  const t = useTranslations("completeProfile");
  const locale = useLocale();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const schema = createUsernameSchema(t);

  const form = useForm<UsernameFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
    },
    mode: "onChange",
  });

  const usernameValue = form.watch("username");

  // Check if user is authenticated and needs to set username
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Not authenticated, redirect to login
        router.push(`/${locale}/login`);
        return;
      }

      // Check if user already has a profile with username
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.full_name) {
        // User already has a username, redirect to home
        router.push(`/${locale}`);
        return;
      }

      setUserEmail(user.email || null);
      setIsLoading(false);
    };

    checkAuth();
  }, [locale, router]);

  const checkUsernameAvailability = useCallback(
    async (username: string) => {
      if (!username || username.length < 2) {
        setUsernameStatus("idle");
        return;
      }

      setUsernameStatus("checking");

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name")
          .ilike("full_name", username)
          .maybeSingle();

        if (error) {
          // Table might not exist yet, treat as available
          setUsernameStatus("available");
          return;
        }

        if (data) {
          setUsernameStatus("taken");
          form.setError("username", {
            type: "manual",
            message: t("errors.usernameTaken"),
          });
        } else {
          setUsernameStatus("available");
          form.clearErrors("username");
        }
      } catch {
        // On network error, allow form submission (server will validate)
        setUsernameStatus("available");
      }
    },
    [form, t]
  );

  // Debounced username check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (usernameValue && usernameValue.length >= 2) {
        checkUsernameAvailability(usernameValue);
      } else {
        setUsernameStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [usernameValue, checkUsernameAvailability]);

  const onSubmit = async (values: UsernameFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Final check for username availability
      if (usernameStatus === "taken") {
        setSubmitError(t("errors.usernameTaken"));
        setIsSubmitting(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setSubmitError(t("errors.notAuthenticated"));
        setIsSubmitting(false);
        return;
      }

      // Update the user's profile with the username
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: values.username,
          email: user.email,
        });

      if (updateError) {
        if (updateError.message.includes("duplicate") || updateError.message.includes("unique")) {
          setSubmitError(t("errors.usernameTaken"));
        } else {
          setSubmitError(updateError.message || t("errors.genericError"));
        }
        return;
      }

      // Also update user metadata
      await supabase.auth.updateUser({
        data: { full_name: values.username }
      });

      // Success - redirect to home
      router.push(`/${locale}`);
    } catch {
      setSubmitError(t("errors.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case "available":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "taken":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getUsernameStatusText = () => {
    switch (usernameStatus) {
      case "checking":
        return t("errors.usernameChecking");
      case "available":
        return t("errors.usernameAvailable");
      case "taken":
        return t("errors.usernameTaken");
      default:
        return t("usernameDescription");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
          {userEmail && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("signedInAs")} <span className="font-medium">{userEmail}</span>
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("username")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder={t("usernamePlaceholder")}
                          {...field}
                          className={cn(
                            usernameStatus === "taken" && "border-destructive",
                            usernameStatus === "available" && "border-green-500"
                          )}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {getUsernameStatusIcon()}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription
                      className={cn(
                        usernameStatus === "taken" && "text-destructive",
                        usernameStatus === "available" && "text-green-500"
                      )}
                    >
                      {getUsernameStatusText()}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {submitError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {submitError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || usernameStatus === "taken" || usernameStatus === "checking"}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("submitting")}
                  </>
                ) : (
                  t("submit")
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
