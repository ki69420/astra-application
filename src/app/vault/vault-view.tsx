"use client";
import * as React from "react";
import {
  Folder,
  Plus,
  Search,
  ChevronRight,
  Shield,
  FileText,
  Trash2,
  Pencil,
  ListTree,
  FolderTree,
  MoreVertical,
  Calendar,
  Layers,
  ArrowLeft,
  GraduationCap,
  IdCard,
  Bookmark,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { useAppStore, type VaultGroupRow, type VaultItemRow } from "@/lib/store/use-app-store";
import { FilePreview } from "@/components/documents/file-preview";
import { GroupModal } from "./group-modal";
import { ItemModal } from "./item-modal";
import { formatDisplayDate } from "@/lib/date-utils";
import { toast } from "@/components/ui/use-toast";

const ICON_MAP: Record<string, React.ElementType> = {
  Folder,
  GraduationCap,
  Shield,
  IdCard,
  FileText,
  Bookmark,
  Award,
};

export function VaultView() {
  const vaultGroups = useAppStore((s) => s.vaultGroups) || [];
  const vaultParentLinks = useAppStore((s) => s.vaultParentLinks) || [];
  const vaultItems = useAppStore((s) => s.vaultItems) || [];
  const vaultGroupItemLinks = useAppStore((s) => s.vaultGroupItemLinks) || [];
  const isInitialized = useAppStore((s) => s.isInitialized);
  const fetchVaultBackground = useAppStore((s) => s.fetchVaultBackground);
  const optimisticDeleteVaultGroup = useAppStore((s) => s.optimisticDeleteVaultGroup);
  const optimisticDeleteVaultItem = useAppStore((s) => s.optimisticDeleteVaultItem);

  const [currentGroupId, setCurrentGroupId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isTreeView, setIsTreeView] = React.useState(false);

  // Modals state
  const [isGroupModalOpen, setIsGroupModalOpen] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState<VaultGroupRow | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<VaultItemRow | null>(null);

  // Delete Dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<{
    id: string;
    title: string;
    isGroup: boolean;
    hasMultipleParents: boolean;
  } | null>(null);

  React.useEffect(() => {
    fetchVaultBackground();
  }, [fetchVaultBackground]);

  // Construct Parent Group Map
  const groupMap = React.useMemo(() => {
    return new Map(vaultGroups.map((g) => [g.id, g]));
  }, [vaultGroups]);

  // Calculate Active Path Breadcrumbs
  const breadcrumbs = React.useMemo(() => {
    if (!currentGroupId) return [];
    const path: VaultGroupRow[] = [];
    let curr: string | null = currentGroupId;
    const visited = new Set<string>();

    while (curr && !visited.has(curr)) {
      visited.add(curr);
      const grp = groupMap.get(curr);
      if (!grp) break;
      path.unshift(grp);

      // Find first parent link
      const pLink = vaultParentLinks.find((l) => l.child_id === curr);
      curr = pLink ? pLink.parent_id : null;
    }
    return path;
  }, [currentGroupId, groupMap, vaultParentLinks]);

  // Children Subgroups of current view
  const currentSubgroups = React.useMemo(() => {
    if (searchQuery.trim()) return [];
    if (!currentGroupId) {
      // Root groups (groups with no parent_id link)
      const childGroupIds = new Set(vaultParentLinks.map((l) => l.child_id));
      return vaultGroups.filter((g) => !childGroupIds.has(g.id));
    }
    const childIds = vaultParentLinks
      .filter((l) => l.parent_id === currentGroupId)
      .map((l) => l.child_id);
    return childIds.map((id) => groupMap.get(id)).filter(Boolean) as VaultGroupRow[];
  }, [currentGroupId, vaultGroups, vaultParentLinks, groupMap, searchQuery]);

  // Vault Items of current view
  const currentItems = React.useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return vaultItems.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.value_text?.toLowerCase().includes(q) ||
          i.document?.original_name?.toLowerCase().includes(q),
      );
    }
    if (!currentGroupId) {
      // Items with no group link (Uncategorized Vault Items)
      const linkedItemIds = new Set(vaultGroupItemLinks.map((l) => l.item_id));
      return vaultItems.filter((i) => !linkedItemIds.has(i.id));
    }
    const itemIds = vaultGroupItemLinks
      .filter((l) => l.group_id === currentGroupId)
      .map((l) => l.item_id);
    const itemMap = new Map(vaultItems.map((i) => [i.id, i]));
    return itemIds.map((id) => itemMap.get(id)).filter(Boolean) as VaultItemRow[];
  }, [currentGroupId, vaultItems, vaultGroupItemLinks, searchQuery]);

  // Multi-parent helper
  const getParentNamesForGroup = (groupId: string) => {
    const parentIds = (vaultParentLinks || []).filter((l) => l.child_id === groupId).map((l) => l.parent_id);
    return parentIds.map((pId) => groupMap.get(pId)?.title).filter(Boolean) as string[];
  };

  const getParentNamesForItem = (itemId: string) => {
    const parentGroupIds = (vaultGroupItemLinks || []).filter((l) => l.item_id === itemId).map((l) => l.group_id);
    return parentGroupIds.map((gId) => groupMap.get(gId)?.title).filter(Boolean) as string[];
  };

  const handleConfirmDelete = async (unlinkOnly: boolean) => {
    if (!deleteTarget) return;
    const { id, isGroup } = deleteTarget;

    if (isGroup) {
      optimisticDeleteVaultGroup(id, unlinkOnly && currentGroupId ? currentGroupId : undefined);
      toast({ title: unlinkOnly ? "Group unlinked" : "Group deleted" });
      fetch(`/api/vault/groups?id=${id}${unlinkOnly && currentGroupId ? `&parentId=${currentGroupId}` : ""}`, {
        method: "DELETE",
      });
    } else {
      optimisticDeleteVaultItem(id, unlinkOnly && currentGroupId ? currentGroupId : undefined);
      toast({ title: unlinkOnly ? "Item unlinked" : "Item deleted" });
      fetch(`/api/vault/items?id=${id}${unlinkOnly && currentGroupId ? `&groupId=${currentGroupId}` : ""}`, {
        method: "DELETE",
      });
    }

    setDeleteTarget(null);
  };

  const currentGroupObj = currentGroupId ? groupMap.get(currentGroupId) : null;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="h-5 w-5 text-primary shrink-0" />
            <h1 className="text-lg font-bold leading-tight truncate">Vault</h1>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTreeView(!isTreeView)}
              className="h-8 gap-1 text-xs"
            >
              {isTreeView ? <FolderTree className="h-3.5 w-3.5" /> : <ListTree className="h-3.5 w-3.5" />}
              {isTreeView ? "Folder View" : "Tree View"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingGroup(null);
                setIsGroupModalOpen(true);
              }}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Group
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingItem(null);
                setIsItemModalOpen(true);
              }}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Item
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search vault items, details & documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </header>

      {/* Breadcrumb Navigation Bar */}
      {!searchQuery && !isTreeView && (
        <div className="bg-muted/40 border-b px-4 py-2 flex items-center gap-1 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCurrentGroupId(null)}
            className={`font-semibold hover:text-primary transition-colors flex items-center gap-1 shrink-0 ${
              !currentGroupId ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            Vault
          </button>
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={b.id}>
              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <button
                onClick={() => setCurrentGroupId(b.id)}
                className={`truncate max-w-[120px] transition-colors ${
                  idx === breadcrumbs.length - 1 ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {b.title}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Main Content View */}
      <div className="px-4 py-4 space-y-4">
        {/* Back Button inside Group View */}
        {currentGroupId && !searchQuery && (
          <div className="flex items-center justify-between pb-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const pLink = vaultParentLinks.find((l) => l.child_id === currentGroupId);
                setCurrentGroupId(pLink ? pLink.parent_id : null);
              }}
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <div className="flex items-center gap-1.5">
              {currentGroupObj && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingGroup(currentGroupObj);
                    setIsGroupModalOpen(true);
                  }}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <Pencil className="h-3 w-3" />
                  Edit Group
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Search Results Title */}
        {searchQuery && (
          <p className="text-xs font-medium text-muted-foreground">
            Search results for &quot;{searchQuery}&quot; ({currentItems.length} items found):
          </p>
        )}

        {/* Empty State */}
        {isInitialized && currentSubgroups.length === 0 && currentItems.length === 0 && (
          <div className="text-center py-16 space-y-2">
            <Folder className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-medium">No vault items or groups here</p>
            <p className="text-xs text-muted-foreground">
              Tap &quot;+ Group&quot; or &quot;+ Item&quot; to add content to your vault.
            </p>
          </div>
        )}

        {/* Subgroups Folders Grid */}
        {currentSubgroups.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Folders &amp; Slices ({currentSubgroups.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentSubgroups.map((grp) => {
                const IconComp = ICON_MAP[grp.icon || "Folder"] || Folder;
                const parentNames = getParentNamesForGroup(grp.id);

                return (
                  <Card
                    key={grp.id}
                    className="hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={() => setCurrentGroupId(grp.id)}
                  >
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <IconComp className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {grp.title}
                          </p>
                          {parentNames.length > 1 ? (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Layers className="h-3 w-3 text-primary" />
                              Linked in {parentNames.length} groups
                            </p>
                          ) : (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {grp.description || "Folder"}
                            </p>
                          )}
                        </div>
                      </div>

                      <Popover>
                        <PopoverTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-36 p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setEditingGroup(grp);
                              setIsGroupModalOpen(true);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent text-left"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit Group
                          </button>
                          <button
                            type="button"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setDeleteTarget({
                                id: grp.id,
                                title: grp.title,
                                isGroup: true,
                                hasMultipleParents: parentNames.length > 1,
                              });
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent text-destructive text-left"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {parentNames.length > 1 && currentGroupId ? "Unlink Group" : "Delete Group"}
                          </button>
                        </PopoverContent>
                      </Popover>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Vault Items List */}
        {currentItems.length > 0 && (
          <div className="space-y-2 pt-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Vault Items ({currentItems.length})
            </h2>
            <div className="space-y-2">
              {currentItems.map((item) => {
                const parentNames = getParentNamesForItem(item.id);

                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-semibold truncate">{item.title}</span>
                          {parentNames.length > 1 && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 gap-1 shrink-0 font-normal">
                              <Layers className="h-2.5 w-2.5 text-primary" />
                              {parentNames.length} groups
                            </Badge>
                          )}
                        </div>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-36 p-1 space-y-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(item);
                                setIsItemModalOpen(true);
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent text-left"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit Item
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTarget({
                                  id: item.id,
                                  title: item.title,
                                  isGroup: false,
                                  hasMultipleParents: parentNames.length > 1,
                                });
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-accent text-destructive text-left"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {parentNames.length > 1 && currentGroupId ? "Unlink Item" : "Delete Item"}
                            </button>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Text Value / Notes */}
                      {item.value_text && (
                        <p className="text-xs text-foreground bg-muted/40 p-2 rounded border font-mono break-all">
                          {item.value_text}
                        </p>
                      )}

                      {/* Date Value */}
                      {item.value_date && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>{formatDisplayDate(new Date(item.value_date))}</span>
                        </div>
                      )}

                      {/* Document Attachment Preview */}
                      {item.document_id && (
                        <div className="pt-1">
                          <FilePreview
                            documentId={item.document_id}
                            fileName={item.title}
                            isImage={["jpg", "jpeg", "png", "webp", "gif"].includes(
                              item.document?.extension?.toLowerCase() || "",
                            )}
                          />
                        </div>
                      )}

                      {/* Multi-Parent Context Path Badge */}
                      {parentNames.length > 0 && searchQuery && (
                        <div className="pt-1 text-[10px] text-muted-foreground flex items-center gap-1 flex-wrap">
                          <span>Locations:</span>
                          {parentNames.map((pName) => (
                            <Badge key={pName} variant="secondary" className="text-[10px] py-0 px-1 font-normal">
                              {pName}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Group Create/Edit Modal */}
      <GroupModal
        isOpen={isGroupModalOpen}
        onOpenChange={setIsGroupModalOpen}
        groupToEdit={editingGroup}
        defaultParentId={currentGroupId}
      />

      {/* Item Create/Edit Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        onOpenChange={setIsItemModalOpen}
        itemToEdit={editingItem}
        defaultGroupId={currentGroupId}
      />

      {/* Delete / Unlink Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.isGroup ? "Group" : "Item"}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.hasMultipleParents && currentGroupId
                ? `"${deleteTarget.title}" is linked across multiple parent groups. Do you want to unlink it from this group or delete it permanently everywhere?`
                : `Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {deleteTarget?.hasMultipleParents && currentGroupId && (
              <AlertDialogAction
                onClick={() => handleConfirmDelete(true)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Unlink from this Group
              </AlertDialogAction>
            )}
            <AlertDialogAction
              onClick={() => handleConfirmDelete(false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
