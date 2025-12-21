"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  handleGitHubSignIn,
  handleGoogleSignIn,
  handleDiscordSignIn,
  handleGiteeSignIn,
  handleCredentialsSignIn,
} from "@/server/auth";
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

interface LoginFormProps {
  oauthStatus: {
    github: boolean;
    google: boolean;
    discord: boolean;
    gitee: boolean;
  };
}

// Discord icon component
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

// Google icon component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// Gitee icon component
function GiteeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.984 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.016 0zm6.09 5.333c.328 0 .593.266.592.593v1.482a.594.594 0 0 1-.593.592H9.777c-.982 0-1.778.796-1.778 1.778v5.63c0 .327.266.592.593.592h5.63c.982 0 1.778-.796 1.778-1.778v-.296a.593.593 0 0 0-.592-.593h-4.15a.592.592 0 0 1-.592-.592v-1.482a.593.593 0 0 1 .593-.592h6.815c.327 0 .593.265.593.592v3.408a4 4 0 0 1-4 4H5.926a.593.593 0 0 1-.593-.593V9.778a4.444 4.444 0 0 1 4.445-4.444h8.296z" />
    </svg>
  );
}

export function LoginForm({ oauthStatus }: LoginFormProps) {
  const t = useTranslations("Auth");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  // Check if any OAuth is enabled
  const hasOAuth = oauthStatus.github || oauthStatus.google || oauthStatus.discord || oauthStatus.gitee;

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

  const handleOAuthSignIn = async (provider: string) => {
    setLoadingProvider(provider);
    try {
      switch (provider) {
        case "github":
          await handleGitHubSignIn();
          break;
        case "google":
          await handleGoogleSignIn();
          break;
        case "discord":
          await handleDiscordSignIn();
          break;
        case "gitee":
          await handleGiteeSignIn();
          break;
      }
    } catch {
      // Redirect is handled by server action
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">DNS Manager</CardTitle>
          <CardDescription>{t("loginSubtitle")}</CardDescription>
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

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
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

          {/* OAuth Section - Only show if any OAuth is configured */}
          {hasOAuth && (
            <>
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

              {/* OAuth Providers Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* GitHub */}
                {oauthStatus.github && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={!!loadingProvider}
                    onClick={() => handleOAuthSignIn("github")}
                  >
                    {loadingProvider === "github" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Github className="mr-2 h-5 w-5" />
                        GitHub
                      </>
                    )}
                  </Button>
                )}

                {/* Google */}
                {oauthStatus.google && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={!!loadingProvider}
                    onClick={() => handleOAuthSignIn("google")}
                  >
                    {loadingProvider === "google" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <GoogleIcon className="mr-2 h-5 w-5" />
                        Google
                      </>
                    )}
                  </Button>
                )}

                {/* Discord */}
                {oauthStatus.discord && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={!!loadingProvider}
                    onClick={() => handleOAuthSignIn("discord")}
                  >
                    {loadingProvider === "discord" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <DiscordIcon className="mr-2 h-5 w-5" />
                        Discord
                      </>
                    )}
                  </Button>
                )}

                {/* Gitee */}
                {oauthStatus.gitee && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={!!loadingProvider}
                    onClick={() => handleOAuthSignIn("gitee")}
                  >
                    {loadingProvider === "gitee" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <GiteeIcon className="mr-2 h-5 w-5" />
                        Gitee
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              {t("register")}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
