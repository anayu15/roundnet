"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import {
  Loader2,
  CreditCard,
  Phone,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

type MembershipStatus = "pending" | "active" | "expired" | null;
type PaymentMethod = "bizum" | "transfer";

type Membership = {
  id: string;
  status: MembershipStatus;
  applied_at: string;
  approved_at: string | null;
  expires_at: string | null;
  payment_reference: string | null;
};

const MEMBERSHIP_FEE = 15; // Annual membership fee in EUR
const BIZUM_PHONE = "612345678"; // Replace with actual AMR Bizum number
const BANK_ACCOUNT = "ES12 1234 5678 9012 3456 7890"; // Replace with actual AMR bank account
const BANK_BENEFICIARY = "Asociación Madrileña de Roundnet";

const createApplicationSchema = (
  t: ReturnType<typeof useTranslations<"membership">>
) =>
  z.object({
    paymentReference: z
      .string()
      .min(1, t("errors.paymentReferenceRequired"))
      .min(4, t("errors.paymentReferenceTooShort")),
  });

type ApplicationFormValues = z.infer<ReturnType<typeof createApplicationSchema>>;

export function MembershipContent() {
  const t = useTranslations("membership");
  const locale = useLocale();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bizum");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const applicationSchema = createApplicationSchema(t);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      paymentReference: "",
    },
  });

  useEffect(() => {
    const checkAuthAndLoadMembership = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      setUserId(user.id);

      // Load existing membership
      const { data: membershipData } = await supabase
        .from("memberships")
        .select("id, status, applied_at, approved_at, expires_at, payment_reference")
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (membershipData) {
        setMembership(membershipData);
      }

      setIsLoading(false);
    };

    checkAuthAndLoadMembership();
  }, [locale, router]);

  const onSubmit = async (values: ApplicationFormValues) => {
    if (!userId) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Create membership application
      const { data: newMembership, error: membershipError } = await supabase
        .from("memberships")
        .insert({
          user_id: userId,
          status: "pending",
          payment_reference: values.paymentReference,
        })
        .select()
        .single();

      if (membershipError) {
        setSubmitError(membershipError.message);
        return;
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from("membership_payments")
        .insert({
          membership_id: newMembership.id,
          amount: MEMBERSHIP_FEE,
          payment_method: paymentMethod,
          status: "pending",
        });

      if (paymentError) {
        setSubmitError(paymentError.message);
        return;
      }

      // Notify admins via API (if email is configured)
      try {
        await fetch("/api/membership/notify-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            membershipId: newMembership.id,
            paymentReference: values.paymentReference,
            paymentMethod,
          }),
        });
      } catch {
        // Silent fail - email notification is optional
      }

      setMembership(newMembership);
      setSubmitSuccess(true);
      form.reset();
    } catch {
      setSubmitError(t("errors.genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === "es" ? "es-ES" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  const getStatusIcon = (status: MembershipStatus) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "expired":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: MembershipStatus) => {
    switch (status) {
      case "active":
        return t("status.active");
      case "pending":
        return t("status.pending");
      case "expired":
        return t("status.expired");
      default:
        return t("status.none");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show current membership status if user has an active or pending membership
  if (membership && (membership.status === "active" || membership.status === "pending")) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">{t("title")}</h1>

        <Card>
          <CardHeader>
            <CardTitle>{t("currentMembership")}</CardTitle>
            <CardDescription>{t("currentMembershipDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(membership.status)}
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("statusLabel")}
                </p>
                <p className="text-base font-semibold">
                  {getStatusText(membership.status)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("paymentReference")}
                </p>
                <p className="text-base">{membership.payment_reference || "-"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("appliedAt")}
                </p>
                <p className="text-base">{formatDate(membership.applied_at)}</p>
              </div>
            </div>

            {membership.approved_at && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("approvedAt")}
                  </p>
                  <p className="text-base">{formatDate(membership.approved_at)}</p>
                </div>
              </div>
            )}

            {membership.expires_at && (
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("expiresAt")}
                  </p>
                  <p className="text-base">{formatDate(membership.expires_at)}</p>
                </div>
              </div>
            )}

            {membership.status === "pending" && (
              <div className="rounded-md bg-yellow-500/10 p-4 text-sm text-yellow-600 dark:text-yellow-400">
                <p className="font-medium">{t("pendingMessage")}</p>
                <p className="mt-1 text-muted-foreground">{t("pendingDescription")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show application form for new applications or expired memberships
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight mb-2">{t("title")}</h1>
      <p className="text-muted-foreground mb-8">{t("description")}</p>

      {submitSuccess && (
        <div className="rounded-md bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400 mb-6">
          <p className="font-medium">{t("successMessage")}</p>
          <p className="mt-1">{t("successDescription")}</p>
        </div>
      )}

      {/* Membership Benefits */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("benefits.title")}</CardTitle>
          <CardDescription>{t("benefits.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {t("benefits.tournaments")}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {t("benefits.rankings")}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {t("benefits.discounts")}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {t("benefits.community")}
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Annual Fee Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("fee.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            {MEMBERSHIP_FEE}€<span className="text-sm font-normal text-muted-foreground">/{t("fee.perYear")}</span>
          </p>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("payment.title")}</CardTitle>
          <CardDescription>{t("payment.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
          >
            <TabsList className="w-full">
              <TabsTrigger value="bizum" className="flex-1">
                <Phone className="h-4 w-4 mr-2" />
                Bizum
              </TabsTrigger>
              <TabsTrigger value="transfer" className="flex-1">
                <Building2 className="h-4 w-4 mr-2" />
                {t("payment.transfer")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bizum" className="mt-4">
              <div className="rounded-md border p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("payment.bizumPhone")}
                  </p>
                  <p className="text-lg font-mono font-semibold">{BIZUM_PHONE}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("payment.amount")}
                  </p>
                  <p className="text-lg font-semibold">{MEMBERSHIP_FEE}€</p>
                </div>
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium">{t("payment.bizumNote")}</p>
                  <p className="text-muted-foreground mt-1">
                    {t("payment.bizumNoteDescription")}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transfer" className="mt-4">
              <div className="rounded-md border p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("payment.bankAccount")}
                  </p>
                  <p className="text-lg font-mono font-semibold break-all">
                    {BANK_ACCOUNT}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("payment.beneficiary")}
                  </p>
                  <p className="text-base">{BANK_BENEFICIARY}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("payment.amount")}
                  </p>
                  <p className="text-lg font-semibold">{MEMBERSHIP_FEE}€</p>
                </div>
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-medium">{t("payment.transferNote")}</p>
                  <p className="text-muted-foreground mt-1">
                    {t("payment.transferNoteDescription")}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Application Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t("application.title")}</CardTitle>
          <CardDescription>{t("application.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="paymentReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("application.paymentReference")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("application.paymentReferencePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("application.paymentReferenceDescription")}
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("application.submitting")}
                  </>
                ) : (
                  t("application.submit")
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
