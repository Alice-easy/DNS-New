"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Users, Globe, Shield, Trash2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { updateUserRole, deleteUser } from "@/server/admin";
import { DomainSharesDialog } from "./domain-shares-dialog";

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

interface AdminTabsProps {
  users: User[];
  domains: Domain[];
}

export function AdminTabs({ users, domains }: AdminTabsProps) {
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

  return (
    <>
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            {t("users")}
          </TabsTrigger>
          <TabsTrigger value="domains" className="gap-2">
            <Globe className="h-4 w-4" />
            {t("domains")}
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t("users")}</CardTitle>
              <CardDescription>{t("usersDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t("noUsers")}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("user")}</TableHead>
                      <TableHead>{t("email")}</TableHead>
                      <TableHead>{t("role")}</TableHead>
                      <TableHead className="w-[100px]">{tCommon("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name || user.username || "-"}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) =>
                              handleRoleChange(user.id, value as "admin" | "user")
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-3 w-3" />
                                  {t("admin")}
                                </div>
                              </SelectItem>
                              <SelectItem value="user">{t("normalUser")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteUserId(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domains Tab */}
        <TabsContent value="domains">
          <Card>
            <CardHeader>
              <CardTitle>{t("domains")}</CardTitle>
              <CardDescription>{t("domainsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {domains.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t("noDomainsAdmin")}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>域名</TableHead>
                      <TableHead>服务商</TableHead>
                      <TableHead>{t("owner")}</TableHead>
                      <TableHead>{tCommon("status")}</TableHead>
                      <TableHead className="w-[100px]">{tCommon("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map((domain) => (
                      <TableRow key={domain.id}>
                        <TableCell className="font-medium">{domain.name}</TableCell>
                        <TableCell>{domain.providerLabel}</TableCell>
                        <TableCell>
                          {domain.ownerName || domain.ownerEmail || "-"}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedDomain(domain)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
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
      <Dialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteUserConfirm")}</DialogTitle>
            <DialogDescription>{t("deleteUserWarning")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserId(null)}>
              {tCommon("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
