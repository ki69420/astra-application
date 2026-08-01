"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore, type VaultItemRow } from "@/lib/store/use-app-store";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Paperclip } from "lucide-react";
import { FilePreview } from "@/components/documents/file-preview";
import { DatePickerInput } from "@/components/custom-fields/date-picker-input";

interface ItemModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit?: VaultItemRow | null;
  defaultGroupId?: string | null;
}

export function ItemModal({ isOpen, onOpenChange, itemToEdit, defaultGroupId }: ItemModalProps) {
  const vaultGroups = useAppStore((s) => s.vaultGroups);
  const vaultGroupItemLinks = useAppStore((s) => s.vaultGroupItemLinks);
  const optimisticAddVaultItem = useAppStore((s) => s.optimisticAddVaultItem);
  const optimisticUpdateVaultItem = useAppStore((s) => s.optimisticUpdateVaultItem);
  const optimisticAddDocument = useAppStore((s) => s.optimisticAddDocument);
  const checkAndSyncBackground = useAppStore((s) => s.checkAndSyncBackground);
  const fetchVaultBackground = useAppStore((s) => s.fetchVaultBackground);

  const [title, setTitle] = React.useState("");
  const [valueText, setValueText] = React.useState("");
  const [valueDateISO, setValueDateISO] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [existingDocumentId, setExistingDocumentId] = React.useState<string | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (itemToEdit) {
      setTitle(itemToEdit.title);
      setValueText(itemToEdit.value_text || "");
      setValueDateISO(
        itemToEdit.value_date
          ? new Date(itemToEdit.value_date).toISOString()
          : null,
      );
      setExistingDocumentId(itemToEdit.document_id || null);
      setSelectedFile(null);
      const currentGroups = (vaultGroupItemLinks || [])
        .filter((l) => l.item_id === itemToEdit.id)
        .map((l) => l.group_id);
      setSelectedGroupIds(currentGroups);
    } else {
      setTitle("");
      setValueText("");
      setValueDateISO(null);
      setExistingDocumentId(null);
      setSelectedFile(null);
      setSelectedGroupIds(defaultGroupId ? [defaultGroupId] : []);
    }
  }, [itemToEdit, defaultGroupId, vaultGroupItemLinks, isOpen]);

  const toggleGroup = (gId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(gId) ? prev.filter((id) => id !== gId) : [...prev, gId],
    );
  };

  async function uploadAttachedFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/documents", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "File upload failed");
    }
    const doc = await res.json();
    optimisticAddDocument(doc);
    return doc;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ variant: "destructive", title: "Item title is required" });
      return;
    }

    setIsSubmitting(true);
    let finalDocId = existingDocumentId;

    try {
      if (selectedFile) {
        const uploaded = await uploadAttachedFile(selectedFile);
        finalDocId = uploaded.id;
      }

      const tempId = itemToEdit ? itemToEdit.id : `temp-${Date.now()}`;
      const itemPayload: VaultItemRow = {
        id: tempId,
        title: title.trim(),
        value_text: valueText.trim() || null,
        value_date: valueDateISO,
        document_id: finalDocId,
        created_at: itemToEdit ? itemToEdit.created_at : new Date().toISOString(),
      };

      // 1. Optimistic UI update (0ms)
      if (itemToEdit) {
        optimisticUpdateVaultItem(itemToEdit.id, itemPayload, selectedGroupIds);
      } else {
        optimisticAddVaultItem(itemPayload, selectedGroupIds);
      }

      onOpenChange(false);
      toast({ title: itemToEdit ? "Item updated" : "Item created" });

      // 2. Background save to DB
      const res = await fetch("/api/vault/items", {
        method: itemToEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemToEdit ? itemToEdit.id : undefined,
          title: title.trim(),
          value_text: valueText.trim() || undefined,
          value_date: valueDateISO,
          document_id: finalDocId,
          group_ids: selectedGroupIds,
        }),
      });

      if (!res.ok) {
        toast({ variant: "destructive", title: "Save error" });
      }
      await fetchVaultBackground();
      checkAndSyncBackground();
    } catch (err) {
      toast({ variant: "destructive", title: "Error saving item", description: String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {itemToEdit ? "Edit Vault Item" : "Create Vault Item"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="item-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="item-title"
              placeholder="e.g. 10th Marksheet, Aadhaar No, or Receipt"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item-text">Details / Notes (Optional)</Label>
            <Textarea
              id="item-text"
              placeholder="Enter text, numbers, or details"
              value={valueText}
              onChange={(e) => setValueText(e.target.value)}
              className="h-16 text-xs resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="item-date">Date (Optional)</Label>
            <DatePickerInput
              id="item-date"
              value={valueDateISO}
              onChange={(val) => setValueDateISO(val || null)}
            />
          </div>

          {/* File Attachment */}
          <div className="space-y-1.5 border-t pt-2">
            <Label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Paperclip className="h-3.5 w-3.5 text-primary" />
              Attached File or Image (Optional)
            </Label>
            {existingDocumentId && !selectedFile && (
              <div className="flex items-center gap-2 py-1.5 px-2 bg-muted/40 rounded border text-xs">
                <span className="text-muted-foreground">Attached:</span>
                <FilePreview documentId={existingDocumentId} fileName={title} />
              </div>
            )}
            <Input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="h-10 text-xs"
            />
          </div>

          {/* Senior-Friendly Group Assignment */}
          {vaultGroups.length > 0 && (
            <div className="space-y-2 pt-1 border-t">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Appear In Groups / Folders
              </Label>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border rounded-lg p-2 bg-muted/20">
                {vaultGroups.map((g) => {
                  const isChecked = selectedGroupIds.includes(g.id);
                  return (
                    <label
                      key={g.id}
                      className="flex items-center justify-between p-1.5 rounded hover:bg-accent/60 cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleGroup(g.id)}
                        />
                        <span className="font-medium">{g.title}</span>
                      </div>
                      {isChecked && <span className="text-[10px] text-primary font-semibold">Selected</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</>
              ) : itemToEdit ? "Update Item" : "Create Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
