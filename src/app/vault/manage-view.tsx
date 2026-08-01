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
import { toast } from "@/components/ui/use-toast";

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
  const vaultItems = useAppStore((s) => s.vaultItems) || [];
  const optimisticUpdateVaultGroup = useAppStore((s) => s.optimisticUpdateVaultGroup);
  const optimisticUpdateVaultItem = useAppStore((s) => s.optimisticUpdateVaultItem);

  const [localGroups, setLocalGroups] = React.useState<VaultGroupRow[]>(vaultGroups);
  const [localItems, setLocalItems] = React.useState<VaultItemRow[]>(vaultItems);

  React.useEffect(() => {
    setLocalGroups(vaultGroups);
    setLocalItems(vaultItems);
  }, [vaultGroups, vaultItems]);

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
        const reordered = arrayMove(items, oldIndex, newIndex);
        reordered.forEach((g, idx) => {
          optimisticUpdateVaultGroup(g.id, { display_order: idx });
          fetch("/api/vault/groups", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: g.id, display_order: idx }),
          });
        });
        toast({ title: "Folders reordered" });
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
        const reordered = arrayMove(items, oldIndex, newIndex);
        reordered.forEach((item, idx) => {
          optimisticUpdateVaultItem(item.id, { display_order: idx });
          fetch("/api/vault/items", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: item.id, display_order: idx }),
          });
        });
        toast({ title: "Vault items reordered" });
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
          onClick={() => useNavigationStore.getState().navigateTo("vault")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-base font-bold">Organize &amp; Reorder Vault</h1>
          <p className="text-xs text-muted-foreground">Drag folders or items to change their display order</p>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Reorder Groups / Folders */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Reorder Folders ({localGroups.length})
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

        {/* Reorder Items */}
        {localItems.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Reorder Vault Items ({localItems.length})
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
      </div>
    </div>
  );
}
