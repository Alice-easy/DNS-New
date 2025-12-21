import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/permissions";
import { getUsers, getAllDomains } from "@/server/admin";
import { getAllConfigs, getDatabaseInfo } from "@/server/system-config";
import { getTranslations } from "next-intl/server";
import { AdminTabs } from "./admin-tabs";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check if user is admin
  const admin = await isAdmin(session.user.id);
  if (!admin) {
    redirect("/");
  }

  const t = await getTranslations("Admin");
  const [users, domains, configs, databaseInfo] = await Promise.all([
    getUsers(),
    getAllDomains(),
    getAllConfigs(),
    getDatabaseInfo(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AdminTabs
        users={users}
        domains={domains}
        configs={configs}
        databaseInfo={databaseInfo}
      />
    </div>
  );
}
