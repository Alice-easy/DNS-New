"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Globe,
  Shield,
  Trash2,
  Share2,
  Settings,
  Mail,
  Calendar,
  Server,
} from "lucide-react";
import { toast } from "sonner";
import { updateUserRole, deleteUser } from "@/server/admin";
import { DomainSharesDialog } from "./domain-shares-dialog";
import { SystemSettings } from "./system-settings";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  role: string;
  createdAt: Date | null;
}

interface Domain {
  id: string;
  name: string;
  status: string;
  providerId: string;
  providerName: string;
  providerLabel: string;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
}

interface ConfigItem {
  key: string;
  value: string;
  hasValue: boolean;
  encrypted: boolean;
  description: string | null;
  updatedAt: Date | null;
}

interface DatabaseInfo {
  type: string;
  isEdgeCompatible: boolean;
  configured: boolean;
}

interface AdminTabsProps {
  users: User[];
  domains: Domain[];
  configs: ConfigItem[];
  databaseInfo: DatabaseInfo;
}

export function AdminTabs({
  users,
  domains,
  configs,
  databaseInfo,
}: AdminTabsProps) {
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  async function handleRoleChange(userId: string, role: "admin" | "user") {
    const result = await updateUserRole(userId, role);
    if (result.success) {
      toast.success(t("roleUpdated"));
    } else {
      toast.error(result.error || t("roleUpdateFailed"));
    }
  }

  async function handleDeleteUser() {
    if (!deleteUserId) return;
    const result = await deleteUser(deleteUserId);
    if (result.success) {
      toast.success(t("userDeleted"));
      setDeleteUserId(null);
    } else {
      toast.error(result.error || t("userDeleteFailed"));
    }
  }

  // User card for mobile view
  const UserCard = ({ user }: { user: User }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* User name and role */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">
                {user.name || user.username || "-"}
              </span>
              <Badge
                variant={user.role === "admin" ? "default" : "secondary"}
                className="shrink-0"
              >
                {user.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                {user.role === "admin" ? t("admin") : t("normalUser")}
              </Badge>
            </div>

            {/* Email */}
            {user.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            )}

            {/* Created date */}
            {user.createdAt && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Select
              value={user.role}
              onValueChange={(value) =>
                handleRoleChange(user.id, value as "admin" | "user")
              }
            >
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3 w-3" />
                    {t("admin")}
                  </div>
                </SelectItem>
                <SelectItem value="user">{t("normalUser")}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setDeleteUserId(user.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Domain card for mobile view
  const DomainCard = ({ domain }: { domain: Domain }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Domain name and status */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{domain.name}</span>
              <Badge
                variant={
                  domain.status === "active"
                    ? "default"
                    : domain.status === "error"
                      ? "destructive"
                      : "secondary"
                }
                className="shrink-0"
              >
                {domain.status}
              </Badge>
            </div>

            {/* Provider */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Server className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{domain.providerLabel}</span>
            </div>

            {/* Owner */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {domain.ownerName || domain.ownerEmail || "-"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setSelectedDomain(domain)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Tabs defaultValue="users" className="space-y-4">
        {/* Responsive Tab List */}
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t("users")}</span>
            <span className="sm:hidden">{t("users")}</span>
          </TabsTrigger>
          <TabsTrigger value="domains" className="gap-1.5 text-xs sm:text-sm">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{t("domains")}</span>
            <span className="sm:hidden">{t("domains")}</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{t("systemSettings")}</span>
            <span className="sm:hidden">{t("systemSettings")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">{t("users")}</CardTitle>
              <CardDescription className="text-sm">
                {t("usersDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{t("noUsers")}</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium text-sm">
                            {t("user")}
                          </th>
                          <th className="text-left py-3 px-2 font-medium text-sm">
                            {t("email")}
                          </th>
                          <th className="text-left py-3 px-2 font-medium text-sm">
                            {t("role")}
                          </th>
                          <th className="text-right py-3 px-2 font-medium text-sm w-[100px]">
                            {tCommon("actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr
                            key={user.id}
                            className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {user.name || user.username || "-"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">
                              {user.email}
                            </td>
                            <td className="py-3 px-2">
                              <Select
                                value={user.role}
                                onValueChange={(value) =>
                                  handleRoleChange(
                                    user.id,
                                    value as "admin" | "user"
                                  )
                                }
                              >
                                <SelectTrigger className="w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-3 w-3" />
                                      {t("admin")}
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="user">
                                    {t("normalUser")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteUserId(user.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-0">
                    {users.map((user) => (
                      <UserCard key={user.id} user={user} />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">
                {t("domains")}
              </CardTitle>
              <CardDescription className="text-sm">
                {t("domainsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {domains.length === 0 ? (
                <div className="text-center py-12">
                  <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{t("noDomainsAdmin")}</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium text-sm">
                            {t("domains")}
                          </th>
                          <th className="text-left py-3 px-2 font-medium text-sm">
                            服务商
                          </th>
                          <th className="text-left py-3 px-2 font-medium text-sm">
                            {t("owner")}
                          </th>
                          <th className="text-left py-3 px-2 font-medium text-sm">
                            {tCommon("status")}
                          </th>
                          <th className="text-right py-3 px-2 font-medium text-sm w-[100px]">
                            {tCommon("actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {domains.map((domain) => (
                          <tr
                            key={domain.id}
                            className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-3 px-2 font-medium">
                              {domain.name}
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">
                              {domain.providerLabel}
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">
                              {domain.ownerName || domain.ownerEmail || "-"}
                            </td>
                            <td className="py-3 px-2">
                              <Badge
                                variant={
                                  domain.status === "active"
                                    ? "default"
                                    : domain.status === "error"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {domain.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedDomain(domain)}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-0">
                    {domains.map((domain) => (
                      <DomainCard key={domain.id} domain={domain} />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="settings">
          <SystemSettings initialConfigs={configs} databaseInfo={databaseInfo} />
        </TabsContent>
      </Tabs>

      {/* Domain Shares Dialog */}
      {selectedDomain && (
        <DomainSharesDialog
          domain={selectedDomain}
          open={!!selectedDomain}
          onOpenChange={(open) => !open && setSelectedDomain(null)}
        />
      )}

      {/* Delete User Confirmation Dialog */}
      <Dialog
        open={!!deleteUserId}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteUserConfirm")}</DialogTitle>
            <DialogDescription>{t("deleteUserWarning")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteUserId(null)}
              className="w-full sm:w-auto"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              className="w-full sm:w-auto"
            >
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
