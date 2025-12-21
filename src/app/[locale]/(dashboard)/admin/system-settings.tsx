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
import { Separator } from "@/components/ui/separator";
import {
  Database,
  Github,
  Key,
  Globe,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  Server,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { getAllConfigs, setConfig } from "@/server/system-config";
import { CONFIG_METADATA } from "@/lib/system-config-types";

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
  databaseInfo: {
    type: string;
    isEdgeCompatible: boolean;
    configured: boolean;
  };
}

type ConfigCategory = "database" | "oauth" | "security" | "other";

const categoryIcons: Record<ConfigCategory, React.ReactNode> = {
  database: <Database className="h-5 w-5" />,
  oauth: <Github className="h-5 w-5" />,
  security: <Key className="h-5 w-5" />,
  other: <Globe className="h-5 w-5" />,
};

export function SystemSettings({
  initialConfigs,
  databaseInfo,
}: SystemSettingsProps) {
  const t = useTranslations("SystemSettings");
  const [isPending, startTransition] = useTransition();
  const [configs, setConfigs] = useState<ConfigItem[]>(initialConfigs);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {}
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Initialize form values
  useEffect(() => {
    const values: Record<string, string> = {};
    configs.forEach((config) => {
      // Don't set masked values
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
          // Refresh configs
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

  // Group configs by category
  const configsByCategory = Object.entries(CONFIG_METADATA).reduce(
    (acc, [key, meta]) => {
      if (!acc[meta.category]) {
        acc[meta.category] = [];
      }
      acc[meta.category].push({ key, ...meta });
      return acc;
    },
    {} as Record<
      ConfigCategory,
      Array<{
        key: string;
        label: string;
        description: string;
        type: string;
        placeholder?: string;
      }>
    >
  );

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
      <div
        key={key}
        className="space-y-2 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Label
            htmlFor={key}
            className="flex items-center gap-2 text-sm font-medium"
          >
            {meta.label}
            {hasValue && (
              <Badge
                variant="secondary"
                className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {t("configured")}
              </Badge>
            )}
          </Label>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
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
            className="shrink-0 w-full sm:w-auto"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            <span className="sm:hidden">保存</span>
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {meta.description}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Database Status Card - Compact on mobile */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-5 w-5 text-primary" />
            {t("databaseStatus")}
          </CardTitle>
          <CardDescription className="text-sm">
            {t("databaseStatusDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status badges - stack on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Database className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">{t("databaseType")}:</span>
              <Badge variant="outline" className="uppercase font-mono">
                {databaseInfo.type}
              </Badge>
            </div>

            <Separator
              orientation="vertical"
              className="h-8 hidden sm:block"
            />
            <Separator className="sm:hidden" />

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Zap className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">
                {t("edgeCompatible")}:
              </span>
              {databaseInfo.isEdgeCompatible ? (
                <Badge className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t("yes")}
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {t("no")}
                </Badge>
              )}
            </div>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-200 dark:border-blue-900">
            <Info className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
              {t("databaseNote")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Cards - Grid layout for larger screens */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Database Configuration */}
        {configsByCategory.database && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {categoryIcons.database}
                {t("databaseConfig")}
              </CardTitle>
              <CardDescription className="text-sm">
                {t("databaseConfigDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {configsByCategory.database.map((item) =>
                  renderConfigField(item.key, item)
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* OAuth Configuration */}
        {configsByCategory.oauth && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {categoryIcons.oauth}
                {t("oauthConfig")}
              </CardTitle>
              <CardDescription className="text-sm">
                {t("oauthConfigDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {configsByCategory.oauth.map((item) =>
                  renderConfigField(item.key, item)
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Configuration */}
        {configsByCategory.security && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {categoryIcons.security}
                {t("securityConfig")}
              </CardTitle>
              <CardDescription className="text-sm">
                {t("securityConfigDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {configsByCategory.security.map((item) =>
                  renderConfigField(item.key, item)
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Other Configuration */}
        {configsByCategory.other && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {categoryIcons.other}
                {t("otherConfig")}
              </CardTitle>
              <CardDescription className="text-sm">
                {t("otherConfigDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {configsByCategory.other.map((item) =>
                  renderConfigField(item.key, item)
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
