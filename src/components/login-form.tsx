"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/lib/supabase";

const createLoginSchema = (t: ReturnType<typeof useTranslations<"login">>) =>
  z.object({
    identifier: z.string().min(1, t("errors.identifierRequired")),
    password: z.string().min(1, t("errors.passwordRequired")),
  });

type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

function isEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const t = useTranslations("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const schema = createLoginSchema(t);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      identifier: "",
      password: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      let email = values.identifier;

      // Check if the identifier is an email or username
      if (!isEmail(values.identifier)) {
        // It's a username - need to look up the email
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .ilike("full_name", values.identifier)
          .maybeSingle();

        if (profileError && profileError.code !== "42P01") {
          setSubmitError(t("errors.genericError"));
          setIsSubmitting(false);
          return;
        }

        if (!profileData) {
          setSubmitError(t("errors.userNotFound"));
          setIsSubmitting(false);
          return;
        }

        // Get the user's email from auth.users via the profile id
        // Since we can't directly query auth.users from client, we use the placeholder email pattern
        // The placeholder email format is: username@placeholder.local
        email = `${values.identifier.toLowerCase().replace(/\s+/g, "_")}@placeholder.local`;
      }

      // Attempt to sign in with email and password
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: values.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setSubmitError(t("errors.invalidCredentials"));
        } else {
          setSubmitError(error.message || t("errors.genericError"));
        }
        return;
      }

      // Success
      setSubmitSuccess(t("success"));
      form.reset();
      onSuccess?.();
    } catch {
      setSubmitError(t("errors.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setSubmitError(error.message || t("errors.genericError"));
      }
    } catch {
      setSubmitError(t("errors.genericError"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("identifier")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("identifierPlaceholder")}
                  {...field}
                  autoComplete="username"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("password")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  {...field}
                  autoComplete="current-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
            {submitSuccess}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("submitting")}
            </>
          ) : (
            t("submit")
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              {t("orContinueWith")}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {t("google")}
        </Button>
      </form>
    </Form>
  );
}
