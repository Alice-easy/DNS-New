"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { updateRecord, deleteRecord } from "@/server/records";
import { toast } from "sonner";
import type { Record } from "@/lib/db/schema";

interface RecordActionsProps {
  domainId: string;
  record: Record;
  domainName: string;
}

export function RecordActions({
  domainId,
  record,
  domainName,
}: RecordActionsProps) {
  const t = useTranslations("Records");
  const tCommon = useTranslations("Common");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const content = formData.get("content") as string;
    const ttl = parseInt(formData.get("ttl") as string) || 1;
    const proxied = formData.get("proxied") === "on";

    try {
      const result = await updateRecord(domainId, record.id, {
        content,
        ttl,
        proxied,
      });

      if (result.success) {
        toast.success(t("recordUpdated"));
        setEditOpen(false);
      } else {
        toast.error(result.error || t("recordUpdateFailed"));
      }
    } catch {
      toast.error(t("recordUpdateFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsLoading(true);

    try {
      const result = await deleteRecord(domainId, record.id);

      if (result.success) {
        toast.success(t("recordDeleted"));
        setDeleteOpen(false);
      } else {
        toast.error(result.error || t("recordDeleteFailed"));
      }
    } catch {
      toast.error(t("recordDeleteFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  const displayName =
    record.name === domainName
      ? "@"
      : record.name.replace(`.${domainName}`, "");

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{tCommon("actions")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            {tCommon("edit")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {tCommon("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>{t("editRecord")}</DialogTitle>
              <DialogDescription>
                {t("editRecordDesc", { type: record.type, name: displayName })}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="content">{t("recordContent")}</Label>
                <Input
                  id="content"
                  name="content"
                  defaultValue={record.content}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ttl">{tCommon("ttl")}</Label>
                <Select name="ttl" defaultValue={String(record.ttl)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t("auto")}</SelectItem>
                    <SelectItem value="60">{t("ttl1min")}</SelectItem>
                    <SelectItem value="300">{t("ttl5min")}</SelectItem>
                    <SelectItem value="600">{t("ttl10min")}</SelectItem>
                    <SelectItem value="1800">{t("ttl30min")}</SelectItem>
                    <SelectItem value="3600">{t("ttl1hour")}</SelectItem>
                    <SelectItem value="86400">{t("ttl1day")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(record.type === "A" ||
                record.type === "AAAA" ||
                record.type === "CNAME") && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="proxied"
                    name="proxied"
                    defaultChecked={record.proxied ?? false}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="proxied" className="font-normal">
                    {t("proxyCloudflare")}
                  </Label>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteRecordTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteRecordDesc", { type: record.type, name: displayName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
