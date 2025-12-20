import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  BellRing,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  getAlertRules,
  getNotificationChannels,
  getAlertHistory,
  getAlertStats,
} from "@/server/alerts";
import { AlertRulesTable } from "./alert-rules-table";
import { NotificationChannelsTable } from "./notification-channels-table";
import { AlertHistoryTable } from "./alert-history-table";
import { AlertsActions } from "./alerts-actions";

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const t = await getTranslations("Alerts");

  // Fetch data in parallel
  const [rules, channels, history, stats] = await Promise.all([
    getAlertRules(),
    getNotificationChannels(),
    getAlertHistory({ days: 7 }),
    getAlertStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <AlertsActions channels={channels} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("alertRules")}
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ruleCount}</div>
            <p className="text-xs text-muted-foreground">
              {t("rulesConfigured")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("channels")}
            </CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.channelCount}</div>
            <p className="text-xs text-muted-foreground">
              {t("channelsConfigured")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("activeAlerts")}
            </CardTitle>
            <BellRing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.triggeredCount}</div>
            <p className="text-xs text-muted-foreground">
              {t("last7Days")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("criticalAlerts")}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.criticalCount}</div>
            <p className="text-xs text-muted-foreground">
              {t("last7Days")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">{t("rulesTab")}</TabsTrigger>
          <TabsTrigger value="channels">{t("channelsTab")}</TabsTrigger>
          <TabsTrigger value="history">{t("historyTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>{t("alertRules")}</CardTitle>
              <CardDescription>{t("rulesDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t("noRules")}</h3>
                  <p className="text-muted-foreground">{t("noRulesDesc")}</p>
                </div>
              ) : (
                <AlertRulesTable rules={rules} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>{t("notificationChannels")}</CardTitle>
              <CardDescription>{t("channelsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {channels.length === 0 ? (
                <div className="text-center py-12">
                  <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t("noChannels")}</h3>
                  <p className="text-muted-foreground">{t("noChannelsDesc")}</p>
                </div>
              ) : (
                <NotificationChannelsTable channels={channels} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>{t("alertHistory")}</CardTitle>
              <CardDescription>{t("historyDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t("noHistory")}</h3>
                  <p className="text-muted-foreground">{t("noHistoryDesc")}</p>
                </div>
              ) : (
                <AlertHistoryTable history={history} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
