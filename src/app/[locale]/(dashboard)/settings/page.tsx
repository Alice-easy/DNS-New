import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return null;
  }

  const t = await getTranslations("Settings");
  const tNav = await getTranslations("Navigation");

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
          <CardDescription>{t("profileDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="text-lg">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("displayName")}</Label>
              <Input id="name" defaultValue={user.name || ""} disabled />
              <p className="text-xs text-muted-foreground">
                {t("displayNameHelp")}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" defaultValue={user.email || ""} disabled />
              <p className="text-xs text-muted-foreground">
                {t("emailHelp")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t("dangerZone")}</CardTitle>
          <CardDescription>
            {t("dangerZoneDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t("signOutAll")}</p>
              <p className="text-sm text-muted-foreground">
                {t("signOutAllDesc")}
              </p>
            </div>
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="destructive" size="sm">
                {tNav("signOut")}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>{t("about")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>DNS Manager</strong> - {t("aboutDesc")}
          </p>
          <p>{t("version")}: 0.1.0 (MVP)</p>
          <p>
            {t("builtWith")} Next.js 16, shadcn/ui, Drizzle ORM
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
