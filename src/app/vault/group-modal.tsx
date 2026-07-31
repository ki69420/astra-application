"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore, type VaultGroupRow } from "@/lib/store/use-app-store";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Folder, GraduationCap, Shield, IdCard, FileText, Bookmark, Award } from "lucide-react";

const ICONS = [
  { name: "Folder", icon: Folder },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "Shield", icon: Shield },
  { name: "IdCard", icon: IdCard },
  { name: "FileText", icon: FileText },
  { name: "Bookmark", icon: Bookmark },
  { name: "Award", icon: Award },
];

interface GroupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupToEdit?: VaultGroupRow | null;
  defaultParentId?: string | null;
}

export function GroupModal({ isOpen, onOpenChange, groupToEdit, defaultParentId }: GroupModalProps) {
  const vaultGroups = useAppStore((s) => s.vaultGroups);
  const vaultParentLinks = useAppStore((s) => s.vaultParentLinks);
  const optimisticAddVaultGroup = useAppStore((s) => s.optimisticAddVaultGroup);
  const optimisticUpdateVaultGroup = useAppStore((s) => s.optimisticUpdateVaultGroup);
  const checkAndSyncBackground = useAppStore((s) => s.checkAndSyncBackground);
  const fetchVaultBackground = useAppStore((s) => s.fetchVaultBackground);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedIcon, setSelectedIcon] = React.useState("Folder");
  const [selectedParentIds, setSelectedParentIds] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Calculate descendant group IDs to prevent circular loops
  const forbiddenGroupIds = React.useMemo(() => {
    if (!groupToEdit) return new Set<string>();
    const forbidden = new Set<string>([groupToEdit.id]);

    function addDescendants(groupId: string) {
      const children = vaultParentLinks
        .filter((l) => l.parent_id === groupId)
        .map((l) => l.child_id);
      for (const childId of children) {
        if (!forbidden.has(childId)) {
          forbidden.add(childId);
          addDescendants(childId);
        }
      }
    }

    addDescendants(groupToEdit.id);
    return forbidden;
  }, [groupToEdit, vaultParentLinks]);

  React.useEffect(() => {
    if (groupToEdit) {
      setTitle(groupToEdit.title);
      setDescription(groupToEdit.description || "");
      setSelectedIcon(groupToEdit.icon || "Folder");
      const currentParents = vaultParentLinks
        .filter((l) => l.child_id === groupToEdit.id)
        .map((l) => l.parent_id);
      setSelectedParentIds(currentParents);
    } else {
      setTitle("");
      setDescription("");
      setSelectedIcon("Folder");
      setSelectedParentIds(defaultParentId ? [defaultParentId] : []);
    }
  }, [groupToEdit, defaultParentId, vaultParentLinks, isOpen]);

  const toggleParent = (pId: string) => {
    setSelectedParentIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ variant: "destructive", title: "Group title is required" });
      return;
    }

    setIsSubmitting(true);
    const tempId = groupToEdit ? groupToEdit.id : `temp-${Date.now()}`;
    const groupPayload: VaultGroupRow = {
      id: tempId,
      title: title.trim(),
      description: description.trim() || null,
      icon: selectedIcon,
      display_order: groupToEdit ? groupToEdit.display_order : vaultGroups.length + 1,
      created_at: groupToEdit ? groupToEdit.created_at : new Date().toISOString(),
    };

    // 1. Optimistic UI update (0ms)
    if (groupToEdit) {
      optimisticUpdateVaultGroup(groupToEdit.id, groupPayload, selectedParentIds);
    } else {
      optimisticAddVaultGroup(groupPayload, selectedParentIds);
    }

    onOpenChange(false);
    toast({ title: groupToEdit ? "Group updated" : "Group created" });

    // 2. Background save to DB
    try {
      const url = "/api/vault/groups";
      const method = groupToEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: groupToEdit ? groupToEdit.id : undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          icon: selectedIcon,
          parent_ids: selectedParentIds,
        }),
      });

      if (!res.ok) {
        toast({ variant: "destructive", title: "Save error" });
      }
      await fetchVaultBackground();
      checkAndSyncBackground();
    } catch {
      toast({ variant: "destructive", title: "Background save error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableParentGroups = vaultGroups.filter((g) => !forbiddenGroupIds.has(g.id));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {groupToEdit ? "Edit Group / Slice" : "Create New Group / Slice"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="group-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="group-title"
              placeholder="e.g. College Certificates"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="group-desc">Description (Optional)</Label>
            <Textarea
              id="group-desc"
              placeholder="Brief summary of this slice or group"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-16 text-xs resize-none"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <Label>Choose Icon</Label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(({ name, icon: IconComp }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedIcon(name)}
                  className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-all ${
                    selectedIcon === name
                      ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                      : "hover:bg-accent text-muted-foreground"
                  }`}
                >
                  <IconComp className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Parent Assignment */}
          {availableParentGroups.length > 0 && (
            <div className="space-y-2 pt-1 border-t">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Parent Groups (Multi-Parent Linking)
              </Label>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border rounded-lg p-2 bg-muted/20">
                {availableParentGroups.map((g) => {
                  const isChecked = selectedParentIds.includes(g.id);
                  return (
                    <label
                      key={g.id}
                      className="flex items-center justify-between p-1.5 rounded hover:bg-accent/60 cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleParent(g.id)}
                        />
                        <span className="font-medium">{g.title}</span>
                      </div>
                      {isChecked && <span className="text-[10px] text-primary font-semibold">Linked</span>}
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
              ) : groupToEdit ? "Update Group" : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
