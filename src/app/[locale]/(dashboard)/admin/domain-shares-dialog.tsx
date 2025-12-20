"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getDomainShares,
  getShareableUsers,
  addDomainShare,
  updateDomainShare,
  deleteDomainShare,
} from "@/server/admin";

interface Domain {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
}

interface Share {
  id: string;
  domainId: string;
  userId: string;
  permission: string;
  userName: string | null;
  userEmail: string | null;
  createdAt: Date | null;
}

interface ShareableUser {
  id: string;
  name: string | null;
  email: string | null;
}

interface DomainSharesDialogProps {
  domain: Domain;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DomainSharesDialog({
  domain,
  open,
  onOpenChange,
}: DomainSharesDialogProps) {
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const [shares, setShares] = useState<Share[]>([]);
  const [users, setUsers] = useState<ShareableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedPermission, setSelectedPermission] = useState<string>("readonly");

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, domain.id]);

  async function loadData() {
    setLoading(true);
    try {
      const [sharesData, usersData] = await Promise.all([
        getDomainShares(domain.id),
        getShareableUsers(domain.id),
      ]);
      setShares(sharesData);
      setUsers(usersData);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddShare() {
    if (!selectedUser || !selectedPermission) return;
    setAdding(true);
    try {
      const result = await addDomainShare(
        domain.id,
        selectedUser,
        selectedPermission as "readonly" | "edit" | "full"
      );
      if (result.success) {
        toast.success(t("shareAdded"));
        setSelectedUser("");
        setSelectedPermission("readonly");
        await loadData();
      } else {
        toast.error(result.error || t("shareAddFailed"));
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdatePermission(shareId: string, permission: string) {
    const result = await updateDomainShare(
      shareId,
      permission as "readonly" | "edit" | "full"
    );
    if (result.success) {
      toast.success(t("shareUpdated"));
      await loadData();
    } else {
      toast.error(result.error || t("shareUpdateFailed"));
    }
  }

  async function handleDeleteShare(shareId: string) {
    const result = await deleteDomainShare(shareId);
    if (result.success) {
      toast.success(t("shareRemoved"));
      await loadData();
    } else {
      toast.error(result.error || t("shareRemoveFailed"));
    }
  }

  function getPermissionBadge(permission: string) {
    switch (permission) {
      case "readonly":
        return <Badge variant="secondary">{t("readonly")}</Badge>;
      case "edit":
        return <Badge variant="default">{t("editPerm")}</Badge>;
      case "full":
        return <Badge className="bg-green-500">{t("full")}</Badge>;
      default:
        return <Badge variant="outline">{permission}</Badge>;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("manageShares")}</DialogTitle>
          <DialogDescription>
            {domain.name} - {t("owner")}: {domain.ownerName || domain.ownerEmail}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add new share */}
            {users.length > 0 && (
              <div className="flex items-center gap-2">
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t("selectUser")} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedPermission}
                  onValueChange={setSelectedPermission}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={t("selectPermission")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="readonly">
                      <div>
                        <div className="font-medium">{t("readonly")}</div>
                        <div className="text-xs text-muted-foreground">
                          {t("readonlyDesc")}
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="edit">
                      <div>
                        <div className="font-medium">{t("editPerm")}</div>
                        <div className="text-xs text-muted-foreground">
                          {t("editPermDesc")}
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="full">
                      <div>
                        <div className="font-medium">{t("full")}</div>
                        <div className="text-xs text-muted-foreground">
                          {t("fullDesc")}
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddShare} disabled={!selectedUser || adding}>
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}

            {/* Existing shares */}
            {shares.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                {t("noSharesDesc")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("user")}</TableHead>
                    <TableHead>{t("permissions")}</TableHead>
                    <TableHead className="w-[80px]">{tCommon("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shares.map((share) => (
                    <TableRow key={share.id}>
                      <TableCell>
                        {share.userName || share.userEmail || "-"}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={share.permission}
                          onValueChange={(value) =>
                            handleUpdatePermission(share.id, value)
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            {getPermissionBadge(share.permission)}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="readonly">{t("readonly")}</SelectItem>
                            <SelectItem value="edit">{t("editPerm")}</SelectItem>
                            <SelectItem value="full">{t("full")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteShare(share.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
