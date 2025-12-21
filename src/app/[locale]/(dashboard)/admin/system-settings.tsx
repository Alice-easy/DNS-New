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
  Github,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle,
  Info,
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

  // Get OAuth configs
  const oauthConfigs = Object.entries(CONFIG_METADATA).map(([key, meta]) => ({
    key,
    ...meta,
  }));

  return (
    <div className="space-y-6">
      {/* OAuth Configuration */}
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
          {/* Info note */}
          <div className="flex items-start gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-200 dark:border-blue-900">
            <Info className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
              {t("oauthNote")}
            </p>
          </div>

          <div className="grid gap-4">
            {oauthConfigs.map((item) => renderConfigField(item.key, item))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
