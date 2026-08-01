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
  MoreVertical,
  Calendar,
  Layers,
  ArrowLeft,
  GraduationCap,
  IdCard,
  Bookmark,
  Award,
  Copy,
  GripVertical,
} from "lucide-react";
import { useNavigationStore } from "@/lib/store/use-navigation-store";
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
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ICON_MAP: Record<string, React.ElementType> = {
  Folder,
  GraduationCap,
  Shield,
  IdCard,
  FileText,
  Bookmark,
  Award,
};

function SortableFolder({
  id,
  children,
  isReorderMode,
  onTriggerReorder,
}: {
  id: string;
  children: (props: { dragHandleProps?: Record<string, unknown> }) => React.ReactNode;
  isReorderMode: boolean;
  onTriggerReorder: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const holdTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const startPosRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startPosRef.current = { x: e.clientX, y: e.clientY };

    if (!isReorderMode) {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(() => {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try { navigator.vibrate([40, 30, 40]); } catch {}
        }
        onTriggerReorder();
      }, 350);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!holdTimerRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 8 || dy > 8) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
      className={`transition-all duration-200 ${
        isReorderMode ? "animate-jiggle" : ""
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {children({ dragHandleProps: isReorderMode ? { ...attributes, ...listeners } : undefined })}
    </div>
  );
}

function SortableVaultItem({
  id,
  children,
  isReorderMode,
  onTriggerReorder,
}: {
  id: string;
  children: (props: { dragHandleProps?: Record<string, unknown> }) => React.ReactNode;
  isReorderMode: boolean;
  onTriggerReorder: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const holdTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const startPosRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startPosRef.current = { x: e.clientX, y: e.clientY };

    if (!isReorderMode) {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(() => {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try { navigator.vibrate([40, 30, 40]); } catch {}
        }
        onTriggerReorder();
      }, 350);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!holdTimerRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 8 || dy > 8) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
      className={`transition-all duration-200 ${
        isReorderMode ? "animate-jiggle" : ""
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {children({ dragHandleProps: isReorderMode ? { ...attributes, ...listeners } : undefined })}
    </div>
  );
}

function OverlayFolder({ group }: { group: VaultGroupRow }) {
  const IconComp = ICON_MAP[group.icon || "Folder"] || Folder;
  return (
    <Card className="overflow-hidden shadow-2xl border-primary ring-2 ring-primary scale-[1.02] bg-background/95 backdrop-blur z-50">
      <CardContent className="p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-primary shrink-0">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <IconComp className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{group.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{group.description || "Folder"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OverlayVaultItem({ item }: { item: VaultItemRow }) {
  return (
    <Card className="overflow-hidden shadow-2xl border-primary ring-2 ring-primary scale-[1.02] bg-background/95 backdrop-blur z-50">
      <CardContent className="p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-primary shrink-0">
            <GripVertical className="h-4 w-4" />
          </div>
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold truncate">{item.title}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function VaultView() {
  const vaultGroups = useAppStore((s) => s.vaultGroups) || [];
  const vaultParentLinks = useAppStore((s) => s.vaultParentLinks) || [];
  const vaultItems = useAppStore((s) => s.vaultItems) || [];
  const vaultGroupItemLinks = useAppStore((s) => s.vaultGroupItemLinks) || [];
  const isInitialized = useAppStore((s) => s.isInitialized);
  const fetchVaultBackground = useAppStore((s) => s.fetchVaultBackground);
  const optimisticDeleteVaultGroup = useAppStore((s) => s.optimisticDeleteVaultGroup);
  const optimisticDeleteVaultItem = useAppStore((s) => s.optimisticDeleteVaultItem);
  const optimisticUpdateVaultGroup = useAppStore((s) => s.optimisticUpdateVaultGroup);
  const optimisticUpdateVaultItem = useAppStore((s) => s.optimisticUpdateVaultItem);
  const optimisticUpdateVaultGroupLinkOrder = useAppStore((s) => s.optimisticUpdateVaultGroupLinkOrder);
  const optimisticUpdateVaultItemLinkOrder = useAppStore((s) => s.optimisticUpdateVaultItemLinkOrder);

  const activeVaultGroupId = useNavigationStore((s) => s.activeVaultGroupId);
  const [currentGroupId, setCurrentGroupId] = React.useState<string | null>(activeVaultGroupId);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    setCurrentGroupId(activeVaultGroupId);
  }, [activeVaultGroupId]);

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

  const [isReorderMode, setIsReorderMode] = React.useState(false);

  React.useEffect(() => {
    fetchVaultBackground();
  }, [fetchVaultBackground]);

  const normalSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const reorderSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 1 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 1 } }),
  );

  const sensors = isReorderMode ? reorderSensors : normalSensors;

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

      const pLink = vaultParentLinks.find((l) => l.child_id === curr);
      curr = pLink ? pLink.parent_id : null;
    }
    return path;
  }, [currentGroupId, groupMap, vaultParentLinks]);

  // Children Subgroups of current view (Sorted by display_order)
  const currentSubgroups = React.useMemo(() => {
    if (searchQuery.trim()) return [];
    if (!currentGroupId) {
      const childGroupIds = new Set(vaultParentLinks.map((l) => l.child_id));
      const rootGroups = vaultGroups.filter((g) => !childGroupIds.has(g.id));
      return [...rootGroups].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    } else {
      const links = vaultParentLinks
        .filter((l) => l.parent_id === currentGroupId)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      return links.map((l) => groupMap.get(l.child_id)).filter(Boolean) as VaultGroupRow[];
    }
  }, [currentGroupId, vaultGroups, vaultParentLinks, groupMap, searchQuery]);

  // Vault Items of current view (Sorted by display_order)
  const currentItems = React.useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return vaultItems.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.value_text?.toLowerCase().includes(q) ||
          i.document?.original_name?.toLowerCase().includes(q),
      );
    } else if (!currentGroupId) {
      const linkedItemIds = new Set(vaultGroupItemLinks.map((l) => l.item_id));
      const rootItems = vaultItems.filter((i) => !linkedItemIds.has(i.id));
      return [...rootItems].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    } else {
      const links = vaultGroupItemLinks
        .filter((l) => l.group_id === currentGroupId)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      const itemMap = new Map(vaultItems.map((i) => [i.id, i]));
      return links.map((l) => itemMap.get(l.item_id)).filter(Boolean) as VaultItemRow[];
    }
  }, [currentGroupId, vaultItems, vaultGroupItemLinks, searchQuery]);

  const [activeFolderId, setActiveFolderId] = React.useState<string | null>(null);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);

  const handleFolderDragStart = (event: DragStartEvent) => {
    setActiveFolderId(event.active.id as string);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    }
  };

  const handleItemDragStart = (event: DragStartEvent) => {
    setActiveItemId(event.active.id as string);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    }
  };

  const unlockScroll = () => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
  };

  const handleFolderDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = currentSubgroups.findIndex((g) => g.id === active.id);
    const newIndex = currentSubgroups.findIndex((g) => g.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(currentSubgroups, oldIndex, newIndex);
      reordered.forEach((g, idx) => {
        if (currentGroupId) {
          optimisticUpdateVaultGroupLinkOrder(currentGroupId, g.id, idx);
        } else {
          optimisticUpdateVaultGroup(g.id, { display_order: idx });
        }
      });
    }
  };

  const handleItemDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = currentItems.findIndex((i) => i.id === active.id);
    const newIndex = currentItems.findIndex((i) => i.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(currentItems, oldIndex, newIndex);
      reordered.forEach((item, idx) => {
        if (currentGroupId) {
          optimisticUpdateVaultItemLinkOrder(currentGroupId, item.id, idx);
        } else {
          optimisticUpdateVaultItem(item.id, { display_order: idx });
        }
      });
    }
  };

  const handleFolderDragEnd = (event: DragEndEvent) => {
    setActiveFolderId(null);
    unlockScroll();
    currentSubgroups.forEach((g, idx) => {
      if (currentGroupId) {
        fetch("/api/vault/groups", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: g.id, parent_id: currentGroupId, display_order: idx }),
        });
      } else {
        fetch("/api/vault/groups", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: g.id, display_order: idx }),
        });
      }
    });
  };

  const handleItemDragEnd = (event: DragEndEvent) => {
    setActiveItemId(null);
    unlockScroll();
    currentItems.forEach((item, idx) => {
      if (currentGroupId) {
        fetch("/api/vault/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, group_id: currentGroupId, display_order: idx }),
        });
      } else {
        fetch("/api/vault/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, display_order: idx }),
        });
      }
    });
  };

  const handleDragCancel = () => {
    setActiveFolderId(null);
    setActiveItemId(null);
    unlockScroll();
  };

  const activeFolder = activeFolderId ? currentSubgroups.find((g) => g.id === activeFolderId) : null;
  const activeItem = activeItemId ? currentItems.find((i) => i.id === activeItemId) : null;

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
            {isReorderMode ? (
              <Button size="sm" variant="default" className="h-8 bg-primary text-primary-foreground font-semibold px-4 text-xs" onClick={() => setIsReorderMode(false)}>
                Done ✓
              </Button>
            ) : (
              <>
                {/* <Button variant="outline" size="sm" onClick={() => setIsReorderMode(true)} className="h-8 text-xs">
                  Reorder
                </Button> */}
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
                  Folder
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
              </>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search items, details & documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </header>

      {/* Breadcrumb Navigation Bar */}
      {!searchQuery && (
        <div className="bg-muted/40 border-b px-4 py-2 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                setCurrentGroupId(null);
                useNavigationStore.getState().navigateTo("vault", { vaultGroupId: null });
              }}
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
                  onClick={() => {
                    setCurrentGroupId(b.id);
                    useNavigationStore.getState().navigateTo("vault", { vaultGroupId: b.id });
                  }}
                  className={`truncate max-w-[120px] transition-colors ${
                    idx === breadcrumbs.length - 1 ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {b.title}
                </button>
              </React.Fragment>
            ))}
          </div>
          {/* {isReorderMode && (
            <span className="text-[11px] font-medium text-primary animate-pulse shrink-0">
              Reorder Mode Active
            </span>
          )} */}
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
                const nextId = pLink ? pLink.parent_id : null;
                setCurrentGroupId(nextId);
                useNavigationStore.getState().navigateTo("vault", { vaultGroupId: nextId });
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
                  Edit Folder
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
            <p className="text-sm font-medium">No items or folders here</p>
            <p className="text-xs text-muted-foreground">
              Tap &quot;+ Folder&quot; or &quot;+ Item&quot; to add content to your vault.
            </p>
          </div>
        )}

        {/* Subgroups Folders Grid (Direct In-Place Drag and Drop) */}
        {currentSubgroups.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Folders ({currentSubgroups.length})
            </h2>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleFolderDragStart}
              onDragOver={handleFolderDragOver}
              onDragEnd={handleFolderDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={currentSubgroups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentSubgroups.map((grp) => {
                    const IconComp = ICON_MAP[grp.icon || "Folder"] || Folder;
                    const parentNames = getParentNamesForGroup(grp.id);

                    return (
                      <SortableFolder
                        key={grp.id}
                        id={grp.id}
                        isReorderMode={isReorderMode}
                        onTriggerReorder={() => setIsReorderMode(true)}
                      >
                        {({ dragHandleProps }: { dragHandleProps?: Record<string, unknown> } = {}) => (
                          <Card
                            className={`transition-all duration-200 group ${
                              isReorderMode ? "border-primary/40 bg-primary/5 shadow-md" : "hover:border-primary/50"
                            }`}
                            onClick={() => {
                              if (!isReorderMode) {
                                setCurrentGroupId(grp.id);
                                useNavigationStore.getState().navigateTo("vault", { vaultGroupId: grp.id });
                              }
                            }}
                          >
                            <CardContent className="p-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                {isReorderMode && (
                                  <div
                                    className="text-primary shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-primary/10 touch-none"
                                    {...dragHandleProps}
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                )}
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
                                      Appears in {parentNames.length} folders
                                    </p>
                                  ) : (
                                    <p className="text-[10px] text-muted-foreground truncate">
                                      {grp.description || "Folder"}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {!isReorderMode && (
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
                                      Edit Folder
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
                                      {parentNames.length > 1 && currentGroupId ? "Remove from Folder" : "Delete Folder"}
                                    </button>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </SortableFolder>
                    );
                  })}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
                {activeFolder ? <OverlayFolder group={activeFolder} /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {/* Vault Items List (Direct In-Place Drag and Drop) */}
        {currentItems.length > 0 && (
          <div className="space-y-2 pt-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Items ({currentItems.length})
            </h2>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleItemDragStart}
              onDragOver={handleItemDragOver}
              onDragEnd={handleItemDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={currentItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {currentItems.map((item) => {
                    const parentNames = getParentNamesForItem(item.id);

                    return (
                      <SortableVaultItem
                        key={item.id}
                        id={item.id}
                        isReorderMode={isReorderMode}
                        onTriggerReorder={() => setIsReorderMode(true)}
                      >
                        {({ dragHandleProps }: { dragHandleProps?: Record<string, unknown> } = {}) => (
                          <Card className={`overflow-hidden transition-all duration-200 ${
                            isReorderMode ? "border-primary/40 bg-primary/5 shadow-md" : "hover:border-primary/50"
                          }`}>
                            <CardContent className="p-3.5 space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  {isReorderMode && (
                                    <div
                                      className="text-primary shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-primary/10 touch-none"
                                      {...dragHandleProps}
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                  )}
                                  <FileText className="h-4 w-4 text-primary shrink-0" />
                                  <span className="text-sm font-semibold truncate">{item.title}</span>
                                  {parentNames.length > 1 && (
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 gap-1 shrink-0 font-normal">
                                      <Layers className="h-2.5 w-2.5 text-primary" />
                                      {parentNames.length} folders
                                    </Badge>
                                  )}
                                </div>

                                {!isReorderMode && (
                                  <Popover>
                                    <PopoverTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground shrink-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent align="end" className="w-36 p-1 space-y-0.5">
                                      <button
                                        type="button"
                                        onClick={(e: React.MouseEvent) => {
                                          e.stopPropagation();
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
                                        onClick={(e: React.MouseEvent) => {
                                          e.stopPropagation();
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
                                        {parentNames.length > 1 && currentGroupId ? "Remove from Folder" : "Delete Item"}
                                      </button>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>

                              {/* Text Value / Notes with Copy Button */}
                              {item.value_text && (
                                <div className="flex items-center justify-between gap-2 text-xs text-foreground bg-muted/40 p-2.5 rounded-lg border font-mono break-all">
                                  <span className="flex-1 min-w-0">{item.value_text}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (navigator.clipboard) {
                                        navigator.clipboard.writeText(item.value_text || "");
                                        toast({ title: "Copied to clipboard!" });
                                      }
                                    }}
                                    title="Copy text to clipboard"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
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
                                <div className="pt-1" onClick={(e) => e.stopPropagation()}>
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
                        )}
                      </SortableVaultItem>
                    );
                  })}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
                {activeItem ? <OverlayVaultItem item={activeItem} /> : null}
              </DragOverlay>
            </DndContext>
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
            <AlertDialogTitle>Delete {deleteTarget?.isGroup ? "Folder" : "Item"}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.hasMultipleParents && currentGroupId
                ? `"${deleteTarget.title}" appears inside multiple folders. Do you want to remove it from this folder or delete it permanently everywhere?`
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
                Remove from this Folder
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
