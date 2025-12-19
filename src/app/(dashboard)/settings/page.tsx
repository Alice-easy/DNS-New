import { auth } from "@/lib/auth";
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

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
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
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" defaultValue={user.name || ""} disabled />
              <p className="text-xs text-muted-foreground">
                Your display name is synced from your GitHub account
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue={user.email || ""} disabled />
              <p className="text-xs text-muted-foreground">
                Your email is synced from your GitHub account
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign out of all devices</p>
              <p className="text-sm text-muted-foreground">
                This will sign you out everywhere
              </p>
            </div>
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="destructive" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>DNS Manager</strong> - Unified DNS management across
            multiple providers
          </p>
          <p>Version: 0.1.0 (MVP)</p>
          <p>
            Built with Next.js 15, shadcn/ui, and Drizzle ORM
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
