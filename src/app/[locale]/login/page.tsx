"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { handleGitHubSignIn, handleCredentialsSignIn } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Github, Loader2, Mail } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);

  async function onCredentialsSubmit(formData: FormData) {
    setError(null);
    setIsLoading(true);

    try {
      const result = await handleCredentialsSignIn(formData);
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch {
      // Redirect is handled by server action
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
          <CardTitle className="text-2xl font-bold">DNS Manager</CardTitle>
          <CardDescription>
            {t("loginSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Credentials Login Form */}
          <form action={onCredentialsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">{t("email")}</Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                placeholder={t("emailPlaceholder")}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={t("passwordPlaceholder")}
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
                  {t("signingIn")}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {t("login")}
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {t("orContinueWith")}
              </span>
            </div>
          </div>

          {/* GitHub OAuth */}
          <form
            action={async () => {
              setIsGitHubLoading(true);
              await handleGitHubSignIn();
            }}
          >
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              size="lg"
              disabled={isGitHubLoading}
            >
              {isGitHubLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("signingIn")}
                </>
              ) : (
                <>
                  <Github className="mr-2 h-5 w-5" />
                  {t("signInWithGitHub")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              {t("register")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
