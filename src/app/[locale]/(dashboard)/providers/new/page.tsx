import { getAvailableProviderTypes } from "@/server/providers";
import { getTranslations } from "next-intl/server";
import { AddProviderForm } from "./add-provider-form";

export default async function NewProviderPage() {
  const availableProviders = await getAvailableProviderTypes();
  const t = await getTranslations("Providers");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("addProviderTitle")}</h1>
        <p className="text-muted-foreground">
          {t("addProviderSubtitle")}
        </p>
      </div>

      <AddProviderForm availableProviders={availableProviders} />
    </div>
  );
}
