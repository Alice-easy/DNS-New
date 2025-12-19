import { getAvailableProviderTypes } from "@/server/providers";
import { AddProviderForm } from "./add-provider-form";

export default async function NewProviderPage() {
  const availableProviders = await getAvailableProviderTypes();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Add DNS Provider</h1>
        <p className="text-muted-foreground">
          Connect a new DNS provider to manage your domains
        </p>
      </div>

      <AddProviderForm availableProviders={availableProviders} />
    </div>
  );
}
