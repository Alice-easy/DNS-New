"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddMonitorDialog } from "./add-monitor-dialog";

interface Record {
  id: string;
  type: string;
  name: string;
  content: string;
}

interface Domain {
  id: string;
  name: string;
}

interface MonitoringActionsProps {
  domains: Domain[];
  availableRecords: Record[];
}

export function MonitoringActions({
  domains,
  availableRecords,
}: MonitoringActionsProps) {
  const t = useTranslations("Monitoring");
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        {t("addTask")}
      </Button>

      <AddMonitorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        domains={domains}
        availableRecords={availableRecords}
      />
    </>
  );
}
