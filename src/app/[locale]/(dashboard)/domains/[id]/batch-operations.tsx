"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Download, Upload, FileJson, FileSpreadsheet, ChevronDown, AlertCircle, CheckCircle } from "lucide-react";
import { exportRecords, importRecords, type ExportedRecord } from "@/server/records";

interface BatchOperationsProps {
  domainId: string;
  domainName: string;
}

export function BatchOperations({ domainId, domainName }: BatchOperationsProps) {
  const t = useTranslations("Batch");
  const tCommon = useTranslations("Common");
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ExportedRecord[]>([]);
  const [importResult, setImportResult] = useState<{
    imported: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [rawInput, setRawInput] = useState("");

  // Export handler
  const handleExport = async (format: "json" | "csv") => {
    const result = await exportRecords(domainId, format);
    if (result.success && result.data && result.filename) {
      // Create and download file
      const blob = new Blob([result.data], {
        type: format === "json" ? "application/json" : "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("exportSuccess"));
    } else {
      toast.error(result.error || t("exportFailed"));
    }
  };

  // Parse imported data
  const parseImportData = useCallback((input: string): ExportedRecord[] | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Try JSON first
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((r) => ({
            type: String(r.type || ""),
            name: String(r.name || ""),
            content: String(r.content || ""),
            ttl: Number(r.ttl) || 300,
            priority: r.priority ? Number(r.priority) : undefined,
            proxied: r.proxied === true || r.proxied === "true",
          }));
        }
      } catch {
        // Not valid JSON
      }
    }

    // Try CSV
    const lines = trimmed.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return null;

    const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());
    const typeIdx = headers.indexOf("type");
    const nameIdx = headers.indexOf("name");
    const contentIdx = headers.indexOf("content");
    const ttlIdx = headers.indexOf("ttl");
    const priorityIdx = headers.indexOf("priority");
    const proxiedIdx = headers.indexOf("proxied");

    if (typeIdx === -1 || nameIdx === -1 || contentIdx === -1) {
      return null;
    }

    const records: ExportedRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      // Parse CSV line handling quoted values
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const record: ExportedRecord = {
        type: values[typeIdx] || "",
        name: values[nameIdx]?.replace(/^"|"$/g, "") || "",
        content: values[contentIdx]?.replace(/^"|"$/g, "").replace(/""/g, '"') || "",
        ttl: ttlIdx !== -1 ? (Number(values[ttlIdx]) || 300) : 300,
      };

      if (priorityIdx !== -1 && values[priorityIdx]) {
        record.priority = Number(values[priorityIdx]);
      }
      if (proxiedIdx !== -1 && values[proxiedIdx]) {
        record.proxied = values[proxiedIdx] === "true";
      }

      if (record.type && record.name && record.content) {
        records.push(record);
      }
    }

    return records.length > 0 ? records : null;
  }, []);

  // Handle input change
  const handleInputChange = (value: string) => {
    setRawInput(value);
    setImportResult(null);
    const parsed = parseImportData(value);
    setPreviewData(parsed || []);
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    handleInputChange(text);
  };

  // Handle import
  const handleImport = async () => {
    if (previewData.length === 0) return;

    setImporting(true);
    try {
      const result = await importRecords(domainId, previewData);
      setImportResult({
        imported: result.imported,
        failed: result.failed,
        errors: result.errors,
      });

      if (result.imported > 0) {
        toast.success(t("importSuccess", { count: result.imported }));
      }
      if (result.failed > 0) {
        toast.error(t("importPartialFailed", { count: result.failed }));
      }
    } catch (error) {
      toast.error(t("importFailed"));
    } finally {
      setImporting(false);
    }
  };

  // Reset import dialog
  const handleClose = () => {
    setImportOpen(false);
    setRawInput("");
    setPreviewData([]);
    setImportResult(null);
  };

  return (
    <div className="flex gap-2">
      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t("export")}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleExport("json")}>
            <FileJson className="mr-2 h-4 w-4" />
            JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("csv")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={(open) => open ? setImportOpen(true) : handleClose()}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            {t("import")}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("importTitle")}</DialogTitle>
            <DialogDescription>
              {t("importDesc", { domain: domainName })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4 py-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>{t("uploadFile")}</Label>
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>

            {/* Or paste data */}
            <div className="space-y-2">
              <Label>{t("pasteData")}</Label>
              <Textarea
                placeholder={t("pasteDataPlaceholder")}
                value={rawInput}
                onChange={(e) => handleInputChange(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            {/* Preview */}
            {previewData.length > 0 && (
              <div className="space-y-2">
                <Label>{t("preview")} ({previewData.length} {t("records")})</Label>
                <div className="border rounded-md max-h-48 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">{tCommon("type")}</TableHead>
                        <TableHead>{tCommon("name")}</TableHead>
                        <TableHead>{tCommon("value")}</TableHead>
                        <TableHead className="w-16">{tCommon("ttl")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.slice(0, 10).map((record, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Badge variant="outline">{record.type}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{record.name}</TableCell>
                          <TableCell className="font-mono text-sm max-w-xs truncate">{record.content}</TableCell>
                          <TableCell>{record.ttl}</TableCell>
                        </TableRow>
                      ))}
                      {previewData.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            ... {t("andMore", { count: previewData.length - 10 })}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  {importResult.imported > 0 && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>{t("importedCount", { count: importResult.imported })}</span>
                    </div>
                  )}
                  {importResult.failed > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{t("failedCount", { count: importResult.failed })}</span>
                    </div>
                  )}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm">
                    <p className="font-medium text-red-800 mb-1">{t("errors")}:</p>
                    <ul className="list-disc list-inside text-red-700 space-y-1">
                      {importResult.errors.slice(0, 5).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>... {t("andMoreErrors", { count: importResult.errors.length - 5 })}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={handleImport}
              disabled={previewData.length === 0 || importing}
            >
              {importing ? t("importing") : t("importBtn", { count: previewData.length })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
