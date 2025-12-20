"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Cloud, Server } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { addProvider } from "@/server/providers";
import { toast } from "sonner";
import type { ProviderMeta } from "@/lib/providers/types";

interface AddProviderFormProps {
  availableProviders: ProviderMeta[];
}

function getProviderIcon(name: string) {
  switch (name) {
    case "cloudflare":
      return <Cloud className="h-5 w-5 text-orange-500" />;
    case "alidns":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.261 3.004c-.282-.006-.564.09-.79.29L3.5 10.39c-.49.43-.49 1.19 0 1.62l7.97 7.096c.45.4 1.13.4 1.58 0l7.97-7.096c.49-.43.49-1.19 0-1.62l-7.97-7.096a1.07 1.07 0 0 0-.79-.29zm-.26 2.086 6.39 5.69-6.39 5.69-6.39-5.69 6.39-5.69z" className="text-orange-600" />
        </svg>
      );
    case "dnspod":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" className="text-blue-500" />
        </svg>
      );
    default:
      return <Server className="h-5 w-5" />;
  }
}

export function AddProviderForm({ availableProviders }: AddProviderFormProps) {
  const router = useRouter();
  const t = useTranslations("Providers");
  const tCommon = useTranslations("Common");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const providerMeta = availableProviders.find(
    (p) => p.name === selectedProvider
  );

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      const result = await addProvider(formData);
      if (result.success) {
        toast.success(t("providerAdded"));
        router.push("/providers");
      } else {
        toast.error(result.error || t("providerAddFailed"));
      }
    } catch {
      toast.error(t("providerAddFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t("selectProviderCard")}</CardTitle>
          <CardDescription>
            {t("selectProviderDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            name="provider"
            value={selectedProvider}
            onValueChange={setSelectedProvider}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectProvider")} />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map((provider) => (
                <SelectItem key={provider.name} value={provider.name}>
                  <div className="flex items-center gap-2">
                    {getProviderIcon(provider.name)}
                    <span>{provider.displayName}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Provider Configuration */}
      {providerMeta && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getProviderIcon(providerMeta.name)}
              {t("configureProvider", { provider: providerMeta.displayName })}
            </CardTitle>
            <CardDescription>{providerMeta.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="label">{t("displayNameOptional")}</Label>
              <Input
                id="label"
                name="label"
                placeholder={t("labelPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">
                {t("labelHelp")}
              </p>
            </div>

            {/* Credential Fields */}
            {providerMeta.credentialFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  required={field.required}
                />
                {field.helpText && (
                  <p className="text-xs text-muted-foreground">
                    {field.helpText}
                  </p>
                )}
              </div>
            ))}

            {/* Website Link */}
            <p className="text-sm text-muted-foreground">
              {t("needApiToken")}{" "}
              <a
                href={providerMeta.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {t("visitProvider", { provider: providerMeta.displayName })}
              </a>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href="/providers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tCommon("cancel")}
          </Link>
        </Button>
        <Button type="submit" disabled={!selectedProvider || isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("addProviderBtn")}
        </Button>
      </div>
    </form>
  );
}
