"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, User, Mail, Calendar, Shield, Eye, EyeOff } from "lucide-react";

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
import { supabase } from "@/lib/supabase";

type UserProfile = {
  id: string;
  full_name: string;
  email: string | null;
  created_at: string;
};

const createEmailSchema = (t: ReturnType<typeof useTranslations<"profile">>) =>
  z.object({
    email: z.string().email(t("errors.emailInvalid")),
  });

const createPasswordSchema = (t: ReturnType<typeof useTranslations<"profile">>) =>
  z
    .object({
      currentPassword: z.string().min(1, t("errors.currentPasswordRequired")),
      newPassword: z.string().min(8, t("errors.passwordMinLength")),
      confirmPassword: z.string().min(1, t("errors.confirmPasswordRequired")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("errors.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

type EmailFormValues = z.infer<ReturnType<typeof createEmailSchema>>;
type PasswordFormValues = z.infer<ReturnType<typeof createPasswordSchema>>;

export function ProfileContent() {
  const t = useTranslations("profile");
  const locale = useLocale();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  // Email form state
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  // Password form state
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailSchema = createEmailSchema(t);
  const passwordSchema = createPasswordSchema(t);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      setAuthEmail(user.email || null);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
        if (profileData.email) {
          emailForm.setValue("email", profileData.email);
        }
      }

      setIsLoading(false);
    };

    checkAuthAndLoadProfile();
  }, [locale, router, emailForm]);

  const onEmailSubmit = async (values: EmailFormValues) => {
    setIsEmailSubmitting(true);
    setEmailError(null);
    setEmailSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setEmailError(t("errors.notAuthenticated"));
        return;
      }

      // Update email in Supabase Auth (this sends verification email)
      const { error: authError } = await supabase.auth.updateUser({
        email: values.email,
      });

      if (authError) {
        setEmailError(authError.message);
        return;
      }

      // Update email in profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ email: values.email })
        .eq("id", user.id);

      if (profileError) {
        setEmailError(profileError.message);
        return;
      }

      setEmailSuccess(t("emailUpdateSuccess"));
      setProfile((prev) => prev ? { ...prev, email: values.email } : null);
    } catch {
      setEmailError(t("errors.genericError"));
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setIsPasswordSubmitting(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setPasswordError(t("errors.notAuthenticated"));
        return;
      }

      // First verify the current password by attempting to sign in
      const email = authEmail || profile?.email;
      if (!email) {
        setPasswordError(t("errors.noEmailForPasswordChange"));
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: values.currentPassword,
      });

      if (signInError) {
        setPasswordError(t("errors.currentPasswordInvalid"));
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (updateError) {
        setPasswordError(updateError.message);
        return;
      }

      setPasswordSuccess(t("passwordUpdateSuccess"));
      passwordForm.reset();
    } catch {
      setPasswordError(t("errors.genericError"));
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">{t("title")}</h1>

      {/* Profile Information Card */}
      <div className="rounded-lg border bg-card p-6 shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">{t("profileInfo")}</h2>

        <div className="space-y-4">
          {/* Username */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("username")}</p>
              <p className="text-base">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("usernameNote")}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("email")}</p>
              <p className="text-base">{profile?.email || authEmail || t("noEmail")}</p>
            </div>
          </div>

          {/* Membership Status */}
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("membershipStatus")}</p>
              <p className="text-base">{t("memberStatusActive")}</p>
            </div>
          </div>

          {/* Registration Date */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("registrationDate")}</p>
              <p className="text-base">{profile?.created_at ? formatDate(profile.created_at) : "-"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Update Email Card */}
      <div className="rounded-lg border bg-card p-6 shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">{t("updateEmail")}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t("updateEmailDescription")}</p>

        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("newEmail")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t("emailVerificationNote")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {emailError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {emailError}
              </div>
            )}

            {emailSuccess && (
              <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                {emailSuccess}
              </div>
            )}

            <Button type="submit" disabled={isEmailSubmitting}>
              {isEmailSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("updating")}
                </>
              ) : (
                t("updateEmailButton")
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Change Password Card */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">{t("changePassword")}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t("changePasswordDescription")}</p>

        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("currentPassword")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder={t("currentPasswordPlaceholder")}
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("newPassword")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder={t("newPasswordPlaceholder")}
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        tabIndex={-1}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormDescription>{t("passwordRequirements")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("confirmPassword")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t("confirmPasswordPlaceholder")}
                        {...field}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {passwordError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                {passwordSuccess}
              </div>
            )}

            <Button type="submit" disabled={isPasswordSubmitting}>
              {isPasswordSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("updating")}
                </>
              ) : (
                t("changePasswordButton")
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
