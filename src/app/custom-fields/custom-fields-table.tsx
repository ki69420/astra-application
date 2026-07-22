"use client";
import { useState, useTransition, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

type Field = {
  id: string;
  label: string;
  field_type: string;
  show_in_homepage: boolean;
  display_order: number;
};

function ClientOnly({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) return null;
  return <>{children}</>;
}

function SortableCard({ field }: { field: Field }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSelfDragging,
  } = useSortable({ id: field.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isSelfDragging ? "opacity-0" : ""}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-4 flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className="text-muted-foreground/30 hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing touch-none focus-visible:outline-none shrink-0"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <Link href={`/custom-fields/${field.id}`} className="flex-1 min-w-0 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{field.label}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className="font-mono text-xs">
                  {field.field_type}
                </Badge>
                {field.show_in_homepage && (
                  <Badge variant="default" className="text-xs">Homepage</Badge>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function OverlayCard({ field }: { field: Field }) {
  return (
    <Card className="overflow-hidden shadow-2xl">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="text-muted-foreground shrink-0">
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{field.label}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="outline" className="font-mono text-xs">
              {field.field_type}
            </Badge>
            {field.show_in_homepage && (
              <Badge variant="default" className="text-xs">Homepage</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CustomFieldsTable({ fields: initialFields }: { fields: Field[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [fields, setFields] = useState(initialFields);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const activeField = activeId ? fields.find((f) => f.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    const updated = arrayMove(fields, oldIndex, newIndex);
    setFields(updated);

    const order = updated.map((f, i) => ({ id: f.id, display_order: i + 1 }));
    const res = await fetch("/api/custom-fields/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });

    if (!res.ok) {
      toast({ variant: "destructive", title: "Failed to save order" });
    } else {
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <GripVertical className="h-3.5 w-3.5" />
        Drag to reorder
      </p>
      <ClientOnly>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map((f) => (
                <SortableCard key={f.id} field={f} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeField ? <OverlayCard field={activeField} /> : null}
          </DragOverlay>
        </DndContext>
      </ClientOnly>
    </div>
  );
}
