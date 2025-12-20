"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { handleRegister } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, UserPlus } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  // Handle redirect after successful registration
  useEffect(() => {
    if (success) {
      redirectTimerRef.current = setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  }, [success, router]);

  async function onSubmit(formData: FormData) {
    setError(null);
    setIsLoading(true);

    try {
      const result = await handleRegister(formData);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Registration failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t("registerTitle")}</CardTitle>
          <CardDescription>
            {t("registerSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/50 p-4 rounded-md text-center">
              <p className="font-medium">Registration successful!</p>
              <p className="mt-1">Redirecting to login page...</p>
            </div>
          ) : (
            <form action={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t("email")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">
                  {t("username")} <span className="text-muted-foreground text-xs">({t("usernameHelp")})</span>
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder={t("usernamePlaceholder")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {t("password")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  {t("passwordRequirements")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t("confirmPassword")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder={t("confirmPasswordPlaceholder")}
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("signingUp")}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t("register")}
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t("login")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
