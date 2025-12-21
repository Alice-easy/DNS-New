"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Github,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle,
  Globe,
  ChevronDown,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { getAllConfigs, setConfig } from "@/server/system-config";
import {
  CONFIG_METADATA,
  OAUTH_PROVIDERS,
  CONFIG_KEYS,
} from "@/lib/system-config-types";
import { DatabaseStats } from "./database-stats";

interface ConfigItem {
  key: string;
  value: string;
  hasValue: boolean;
  encrypted: boolean;
  description: string | null;
  updatedAt: Date | null;
}

interface SystemSettingsProps {
  initialConfigs: ConfigItem[];
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

export function SystemSettings({ initialConfigs }: SystemSettingsProps) {
  const t = useTranslations("SystemSettings");
  const [isPending, startTransition] = useTransition();
  const [configs, setConfigs] = useState<ConfigItem[]>(initialConfigs);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {}
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [copiedCallback, setCopiedCallback] = useState<string | null>(null);
  const [openProviders, setOpenProviders] = useState<Record<string, boolean>>({
    github: true,
  });

  // Get AUTH_URL for callback display
  const authUrl =
    formValues[CONFIG_KEYS.AUTH_URL] ||
    configs.find((c) => c.key === CONFIG_KEYS.AUTH_URL)?.value ||
    "https://your-domain.com";

  // Initialize form values
  useEffect(() => {
    const values: Record<string, string> = {};
    configs.forEach((config) => {
      values[config.key] = config.value === "••••••••" ? "" : config.value;
    });
    setFormValues(values);
  }, [configs]);

  const handleSave = async (key: string) => {
    const value = formValues[key];
    if (value === undefined) return;

    setSavingKey(key);
    startTransition(async () => {
      try {
        const result = await setConfig(key, value);
        if (result.success) {
          toast.success(t("configSaved"));
          const updatedConfigs = await getAllConfigs();
          setConfigs(updatedConfigs);
        } else {
          toast.error(result.error || t("configSaveFailed"));
        }
      } catch {
        toast.error(t("configSaveFailed"));
      } finally {
        setSavingKey(null);
      }
    });
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyCallback = (provider: string) => {
    const callbackUrl =
      authUrl +
      OAUTH_PROVIDERS[provider as keyof typeof OAUTH_PROVIDERS].callbackPath;
    navigator.clipboard.writeText(callbackUrl);
    setCopiedCallback(provider);
    toast.success(t("callbackCopied"));
    setTimeout(() => setCopiedCallback(null), 2000);
  };

  const toggleProvider = (provider: string) => {
    setOpenProviders((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const renderConfigField = (
    key: string,
    meta: {
      label: string;
      description: string;
      type: string;
      placeholder?: string;
    }
  ) => {
    const config = configs.find((c) => c.key === key);
    const isPassword = meta.type === "password";
    const showPassword = showPasswords[key];
    const isSaving = savingKey === key;
    const hasValue = config?.hasValue || false;

    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={key} className="text-sm font-medium">
            {meta.label}
          </Label>
          {hasValue && (
            <Badge
              variant="secondary"
              className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {t("configured")}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id={key}
              type={isPassword && !showPassword ? "password" : "text"}
              placeholder={meta.placeholder}
              value={formValues[key] || ""}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, [key]: e.target.value }))
              }
              className={`${isPassword ? "pr-10" : ""} text-sm`}
            />
            {isPassword && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => togglePasswordVisibility(key)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            )}
          </div>
          <Button
            onClick={() => handleSave(key)}
            disabled={isPending}
            size="default"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">{meta.description}</p>
      </div>
    );
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "github":
        return <Github className="h-5 w-5" />;
      case "google":
        return <GoogleIcon className="h-5 w-5" />;
      case "discord":
        return <DiscordIcon className="h-5 w-5" />;
      case "gitee":
        return <GiteeIcon className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const getProviderConfigs = (category: string) => {
    return Object.entries(CONFIG_METADATA)
      .filter(([, meta]) => meta.category === category)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([key, meta]) => ({ key, ...meta }));
  };

  const isProviderConfigured = (category: string) => {
    const providerConfigs = getProviderConfigs(category);
    return providerConfigs.every((config) => {
      const c = configs.find((cfg) => cfg.key === config.key);
      return c?.hasValue;
    });
  };

  return (
    <div className="space-y-6">
      {/* Database Stats Card */}
      <DatabaseStats />

      {/* OAuth Providers with Auth URL at top */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Github className="h-5 w-5" />
            {t("oauthConfig")}
          </CardTitle>
          <CardDescription className="text-sm">
            {t("oauthConfigDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auth URL Configuration - moved to OAuth card top */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 mt-0.5 text-primary shrink-0" />
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-medium text-sm">{t("siteConfig")}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("authUrlNote")}
                  </p>
                </div>
                {renderConfigField(CONFIG_KEYS.AUTH_URL, CONFIG_METADATA[CONFIG_KEYS.AUTH_URL])}
              </div>
            </div>
          </div>

          {/* OAuth Provider List */}
          <div className="space-y-3">
            {Object.entries(OAUTH_PROVIDERS).map(([provider, info]) => {
              const isConfigured = isProviderConfigured(provider);
              const isOpen = openProviders[provider] || false;
              const callbackUrl = authUrl + info.callbackPath;

              return (
                <Collapsible
                  key={provider}
                  open={isOpen}
                  onOpenChange={() => toggleProvider(provider)}
                >
                  <div className="border rounded-lg overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center justify-between w-full p-4 hover:bg-accent/50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                          {getProviderIcon(provider)}
                          <span className="font-medium">{info.name}</span>
                          {isConfigured && (
                            <Badge className="bg-green-600 hover:bg-green-700 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t("enabled")}
                            </Badge>
                          )}
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-4 border-t bg-muted/30">
                        {/* Callback URL display */}
                        <div className="pt-4 space-y-2">
                          <Label className="text-sm font-medium">
                            {t("callbackUrl")}
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              value={callbackUrl}
                              readOnly
                              className="text-sm font-mono bg-muted"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyCallback(provider)}
                            >
                              {copiedCallback === provider ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t("callbackUrlDesc")}
                          </p>
                        </div>

                        {/* Provider config fields */}
                        {getProviderConfigs(provider).map((config) =>
                          renderConfigField(config.key, config)
                        )}

                        {/* Docs link */}
                        <a
                          href={info.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          {t("setupGuide", { provider: info.name })}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
