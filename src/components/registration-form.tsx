"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
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

const createRegistrationSchema = (t: ReturnType<typeof useTranslations<"registration">>) =>
  z
    .object({
      fullName: z
        .string()
        .min(1, t("errors.fullNameRequired"))
        .min(2, t("errors.fullNameMinLength"))
        .max(100, t("errors.fullNameMaxLength")),
      email: z
        .string()
        .email(t("errors.emailInvalid"))
        .optional()
        .or(z.literal("")),
      password: z
        .string()
        .min(1, t("errors.passwordRequired"))
        .min(8, t("errors.passwordMinLength")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("errors.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

type RegistrationFormValues = z.infer<ReturnType<typeof createRegistrationSchema>>;

type UsernameStatus = "idle" | "checking" | "available" | "taken";

interface RegistrationFormProps {
  onSuccess?: () => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const t = useTranslations("registration");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

  const schema = createRegistrationSchema(t);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const fullNameValue = form.watch("fullName");

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
          form.setError("fullName", {
            type: "manual",
            message: t("errors.fullNameTaken"),
          });
        } else {
          setUsernameStatus("available");
          form.clearErrors("fullName");
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
      if (fullNameValue && fullNameValue.length >= 2) {
        checkUsernameAvailability(fullNameValue);
      } else {
        setUsernameStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [fullNameValue, checkUsernameAvailability]);

  const onSubmit = async (values: RegistrationFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // Final check for username availability
      if (usernameStatus === "taken") {
        setSubmitError(t("errors.fullNameTaken"));
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: values.email || `${values.fullName.toLowerCase().replace(/\s+/g, "_")}@placeholder.local`,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
          emailRedirectTo: values.email ? `${window.location.origin}/auth/callback` : undefined,
        },
      });

      if (error) {
        if (error.message.includes("duplicate") || error.message.includes("already")) {
          setSubmitError(t("errors.fullNameTaken"));
        } else {
          setSubmitError(error.message || t("errors.registrationFailed"));
        }
        return;
      }

      // Success
      if (values.email) {
        setSubmitSuccess(t("successWithEmail"));
      } else {
        setSubmitSuccess(t("success"));
      }

      form.reset();
      onSuccess?.();
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
        return t("errors.fullNameChecking");
      case "available":
        return t("errors.fullNameAvailable");
      case "taken":
        return t("errors.fullNameTaken");
      default:
        return t("fullNameDescription");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("fullName")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder={t("fullNamePlaceholder")}
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

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("email")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormDescription>{t("emailDescription")}</FormDescription>
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
                />
              </FormControl>
              <FormDescription>{t("passwordDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("confirmPassword")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t("confirmPasswordPlaceholder")}
                  {...field}
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
  );
}
