"use client";

import { useState, useEffect, useRef } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { handleRegister } from "@/server/auth";
import {
  sendVerificationCode,
  verifyEmailCode,
} from "@/server/email-verification";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, UserPlus, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

interface RegisterFormProps {
  emailVerificationRequired: boolean;
}

type Step = "email" | "verify" | "register" | "success";

export function RegisterForm({ emailVerificationRequired }: RegisterFormProps) {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();

  // State
  const [step, setStep] = useState<Step>(emailVerificationRequired ? "email" : "register");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
      };
    }
  }, [countdown]);

  // Redirect after success
  useEffect(() => {
    if (step === "success") {
      redirectTimerRef.current = setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  }, [step, router]);

  // Step 1: Send verification code
  async function handleSendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await sendVerificationCode(email, locale);
      if (result.success) {
        setStep("verify");
        setCountdown(60); // 60 seconds cooldown
      } else {
        setError(result.error || t("sendCodeFailed"));
      }
    } catch {
      setError(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  }

  // Resend verification code
  async function handleResendCode() {
    if (countdown > 0) return;

    setError(null);
    setIsLoading(true);

    try {
      const result = await sendVerificationCode(email, locale);
      if (result.success) {
        setCountdown(60);
      } else {
        setError(result.error || t("sendCodeFailed"));
      }
    } catch {
      setError(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  }

  // Step 2: Verify the code
  async function handleVerifyCode() {
    if (verificationCode.length !== 6) return;

    setError(null);
    setIsLoading(true);

    try {
      const result = await verifyEmailCode(email, verificationCode);
      if (result.success) {
        setStep("register");
      } else {
        setError(result.error || t("verifyCodeFailed"));
      }
    } catch {
      setError(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  }

  // Step 3: Complete registration
  async function handleRegisterSubmit(formData: FormData) {
    setError(null);
    setIsLoading(true);

    // Add email to form data if from verification flow
    if (emailVerificationRequired) {
      formData.set("email", email);
    }

    try {
      const result = await handleRegister(formData);
      if (result.success) {
        setStep("success");
      } else {
        setError(result.error || t("registerFailed"));
      }
    } catch {
      setError(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  }

  // Go back to email step
  function handleBack() {
    setStep("email");
    setVerificationCode("");
    setError(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {step === "success" ? t("registerSuccess") : t("registerTitle")}
          </CardTitle>
          <CardDescription>
            {step === "email" && t("emailVerificationSubtitle")}
            {step === "verify" && t("enterVerificationCode")}
            {step === "register" && t("registerSubtitle")}
            {step === "success" && t("registerSuccessSubtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Step: Email input */}
          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                    {t("sendingCode")}
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    {t("sendVerificationCode")}
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Step: Verify code */}
          {step === "verify" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t("changeEmail")}
              </button>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t("codeSentTo")}
                </p>
                <p className="font-medium">{email}</p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  value={verificationCode}
                  onChange={setVerificationCode}
                  maxLength={6}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                onClick={handleVerifyCode}
                className="w-full"
                size="lg"
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("verifying")}
                  </>
                ) : (
                  t("verifyCode")
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={countdown > 0 || isLoading}
                  className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                >
                  {countdown > 0
                    ? t("resendCodeIn", { seconds: countdown })
                    : t("resendCode")}
                </button>
              </div>
            </div>
          )}

          {/* Step: Registration form */}
          {step === "register" && (
            <form action={handleRegisterSubmit} className="space-y-4">
              {/* Show verified email badge if from verification flow */}
              {emailVerificationRequired && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-900">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400">
                    {email}
                  </span>
                </div>
              )}

              {/* Email field for non-verification flow */}
              {!emailVerificationRequired && (
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
              )}

              <div className="space-y-2">
                <Label htmlFor="username">
                  {t("username")}{" "}
                  <span className="text-muted-foreground text-xs">
                    ({t("usernameHelp")})
                  </span>
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

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
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

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/50 p-4 rounded-md">
                <p className="font-medium">{t("registerSuccessMessage")}</p>
                <p className="mt-1">{t("redirectingToLogin")}</p>
              </div>
            </div>
          )}
        </CardContent>

        {step !== "success" && (
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              {t("hasAccount")}{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                {t("login")}
              </Link>
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
