"use client";
import * as React from "react";
import { ArrowLeft, GripVertical, Folder, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore, type VaultGroupRow, type VaultItemRow } from "@/lib/store/use-app-store";
import { useNavigationStore } from "@/lib/store/use-navigation-store";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({ id, title, isGroup }: { id: string; title: string; isGroup: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground p-1">
              <GripVertical className="h-4 w-4" />
            </button>
            {isGroup ? (
              <Folder className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="text-sm font-medium truncate">{title}</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-muted">
            {isGroup ? "Folder" : "Item"}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

export function VaultManageView() {
  const vaultGroups = useAppStore((s) => s.vaultGroups) || [];
  const vaultParentLinks = useAppStore((s) => s.vaultParentLinks) || [];
  const vaultItems = useAppStore((s) => s.vaultItems) || [];
  const vaultGroupItemLinks = useAppStore((s) => s.vaultGroupItemLinks) || [];
  const optimisticUpdateVaultGroup = useAppStore((s) => s.optimisticUpdateVaultGroup);
  const optimisticUpdateVaultItem = useAppStore((s) => s.optimisticUpdateVaultItem);

  const activeVaultGroupId = useNavigationStore((s) => s.activeVaultGroupId);

  // Group Map
  const groupMap = React.useMemo(() => {
    return new Map(vaultGroups.map((g) => [g.id, g]));
  }, [vaultGroups]);

  // Current Folder Title
  const activeFolderTitle = React.useMemo(() => {
    if (!activeVaultGroupId) return "Vault Root";
    return groupMap.get(activeVaultGroupId)?.title || "Vault Folder";
  }, [activeVaultGroupId, groupMap]);

  // Relevant Subgroups & Items for the active folder context
  const [localGroups, setLocalGroups] = React.useState<VaultGroupRow[]>([]);
  const [localItems, setLocalItems] = React.useState<VaultItemRow[]>([]);

  React.useEffect(() => {
    let rawGroups: VaultGroupRow[] = [];
    if (!activeVaultGroupId) {
      const childGroupIds = new Set(vaultParentLinks.map((l) => l.child_id));
      rawGroups = vaultGroups.filter((g) => !childGroupIds.has(g.id));
    } else {
      const childIds = vaultParentLinks
        .filter((l) => l.parent_id === activeVaultGroupId)
        .map((l) => l.child_id);
      rawGroups = childIds.map((id) => groupMap.get(id)).filter(Boolean) as VaultGroupRow[];
    }
    const sortedGroups = [...rawGroups].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    let rawItems: VaultItemRow[] = [];
    if (!activeVaultGroupId) {
      const linkedItemIds = new Set(vaultGroupItemLinks.map((l) => l.item_id));
      rawItems = vaultItems.filter((i) => !linkedItemIds.has(i.id));
    } else {
      const itemIds = vaultGroupItemLinks
        .filter((l) => l.group_id === activeVaultGroupId)
        .map((l) => l.item_id);
      const itemMap = new Map(vaultItems.map((i) => [i.id, i]));
      rawItems = itemIds.map((id) => itemMap.get(id)).filter(Boolean) as VaultItemRow[];
    }
    const sortedItems = [...rawItems].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    setLocalGroups(sortedGroups);
    setLocalItems(sortedItems);
  }, [activeVaultGroupId, vaultGroups, vaultParentLinks, vaultItems, vaultGroupItemLinks, groupMap]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalGroups((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex).map((g, idx) => ({
          ...g,
          display_order: idx,
        }));

        reordered.forEach((g) => {
          optimisticUpdateVaultGroup(g.id, { display_order: g.display_order });
          fetch("/api/vault/groups", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: g.id, display_order: g.display_order }),
          });
        });

        return reordered;
      });
    }
  };

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
          ...item,
          display_order: idx,
        }));

        reordered.forEach((item) => {
          optimisticUpdateVaultItem(item.id, { display_order: item.display_order });
          fetch("/api/vault/items", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: item.id, display_order: item.display_order }),
          });
        });

        return reordered;
      });
    }
  };

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          type="button"
          onClick={() => useNavigationStore.getState().goBack()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-base font-bold">Organize &amp; Reorder</h1>
          <p className="text-xs text-muted-foreground truncate">{activeFolderTitle} — drag items or sub-folders</p>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Reorder Subfolders */}
        {localGroups.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sub-Folders ({localGroups.length})
            </h2>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
              <SortableContext items={localGroups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {localGroups.map((group) => (
                    <SortableItem key={group.id} id={group.id} title={group.title} isGroup={true} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Reorder Items */}
        {localItems.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Items ({localItems.length})
            </h2>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
              <SortableContext items={localItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {localItems.map((item) => (
                    <SortableItem key={item.id} id={item.id} title={item.title} isGroup={false} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {localGroups.length === 0 && localItems.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No items or sub-folders to reorder in this location.
          </div>
        )}
      </div>
    </div>
  );
}
