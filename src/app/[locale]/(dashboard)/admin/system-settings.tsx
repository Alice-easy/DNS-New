"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllConfigs,
  setConfig,
} from "@/server/system-config";
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

export function SystemSettings({ initialConfigs, databaseInfo }: SystemSettingsProps) {
  const t = useTranslations("SystemSettings");
  const tCommon = useTranslations("Common");
  const [isPending, startTransition] = useTransition();
  const [configs, setConfigs] = useState<ConfigItem[]>(initialConfigs);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
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
    {} as Record<ConfigCategory, Array<{ key: string; label: string; description: string; type: string; placeholder?: string }>>
  );

  const renderConfigField = (
    key: string,
    meta: { label: string; description: string; type: string; placeholder?: string }
  ) => {
    const config = configs.find((c) => c.key === key);
    const isPassword = meta.type === "password";
    const showPassword = showPasswords[key];
    const isSaving = savingKey === key;
    const hasValue = config?.hasValue || false;

    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={key} className="flex items-center gap-2">
            {meta.label}
            {hasValue && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                {t("configured")}
              </Badge>
            )}
          </Label>
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
              className="pr-10"
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
            size="icon"
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

  return (
    <div className="space-y-6">
      {/* Database Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t("databaseStatus")}
          </CardTitle>
          <CardDescription>{t("databaseStatusDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t("databaseType")}:</span>
              <Badge variant="outline" className="uppercase">
                {databaseInfo.type}
              </Badge>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t("edgeCompatible")}:</span>
              {databaseInfo.isEdgeCompatible ? (
                <Badge variant="default" className="bg-green-600">
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
          <div className="mt-4 flex items-start gap-2 rounded-md bg-muted p-3">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("databaseNote")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Database Configuration */}
      {configsByCategory.database && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {categoryIcons.database}
              {t("databaseConfig")}
            </CardTitle>
            <CardDescription>{t("databaseConfigDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {configsByCategory.database.map((item) =>
              renderConfigField(item.key, item)
            )}
          </CardContent>
        </Card>
      )}

      {/* OAuth Configuration */}
      {configsByCategory.oauth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {categoryIcons.oauth}
              {t("oauthConfig")}
            </CardTitle>
            <CardDescription>{t("oauthConfigDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {configsByCategory.oauth.map((item) =>
              renderConfigField(item.key, item)
            )}
          </CardContent>
        </Card>
      )}

      {/* Security Configuration */}
      {configsByCategory.security && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {categoryIcons.security}
              {t("securityConfig")}
            </CardTitle>
            <CardDescription>{t("securityConfigDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {configsByCategory.security.map((item) =>
              renderConfigField(item.key, item)
            )}
          </CardContent>
        </Card>
      )}

      {/* Other Configuration */}
      {configsByCategory.other && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {categoryIcons.other}
              {t("otherConfig")}
            </CardTitle>
            <CardDescription>{t("otherConfigDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {configsByCategory.other.map((item) =>
              renderConfigField(item.key, item)
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
