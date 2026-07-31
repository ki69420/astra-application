"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft, GripVertical, Folder, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore, type VaultGroupRow, type VaultItemRow } from "@/lib/store/use-app-store";
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
            {isGroup ? "Group" : "Item"}
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
        toast({ title: "Groups reordered" });
        return reordered;
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href="/vault">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-base font-bold">Manage Vault Hierarchy</h1>
          <p className="text-xs text-muted-foreground">Drag to reorder groups and items</p>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Reorder Groups */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Reorder Groups ({localGroups.length})
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
      </div>
    </div>
  );
}
