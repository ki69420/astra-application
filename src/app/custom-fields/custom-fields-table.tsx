"use client";
import * as React from "react";
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
  DragOverEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronRight, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useNavigationStore } from "@/lib/store/use-navigation-store";
import { NavButton } from "@/components/ui/nav-button";
import { Button } from "@/components/ui/button";

import { useAppStore, type CustomField } from "@/lib/store/use-app-store";

function ClientOnly({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) return null;
  return <>{children}</>;
}

function SortableCard({ field, isReorderMode, onTriggerReorder }: { field: CustomField; isReorderMode: boolean; onTriggerReorder: () => void }) {
  const [isPressed, setIsPressed] = useState(false);
  const holdTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const startPosRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSelfDragging,
  } = useSortable({ id: field.id });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isReorderMode && !isPressed) {
      useNavigationStore.getState().navigateTo("custom-field-edit", { fieldId: field.id });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startPosRef.current = { x: e.clientX, y: e.clientY };

    if (!isReorderMode) {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      holdTimerRef.current = setTimeout(() => {
        setIsPressed(true);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try { navigator.vibrate([40, 30, 40]); } catch {}
        }
        onTriggerReorder();
      }, 350);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!holdTimerRef.current || isPressed) return;
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
    setIsPressed(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`transition-all duration-200 ${
        isReorderMode ? "animate-jiggle" : ""
      } ${isSelfDragging ? "opacity-30" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <Card className={`overflow-hidden transition-all duration-200 ${
        isReorderMode ? "border-primary/40 bg-primary/5 shadow-md ring-1 ring-primary/30" : "hover:border-primary/50"
      }`}>
        <CardContent className="p-4 flex items-center justify-between gap-3" onClick={handleClick}>
          <div className="flex items-center gap-3 min-w-0">
            {isReorderMode && (
              <div
                className="text-primary shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-primary/10 touch-none"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-5 w-5" />
              </div>
            )}
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
          </div>
          {!isReorderMode && (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OverlayCard({ field }: { field: CustomField }) {
  return (
    <Card className="overflow-hidden shadow-2xl border-primary ring-2 ring-primary">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="text-primary shrink-0">
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

export function CustomFieldsTable({ fields: initialFields = [] }: { fields?: CustomField[] }) {
  const storeCustomFields = useAppStore((s) => s.customFields);
  const optimisticReorderCustomFields = useAppStore((s) => s.optimisticReorderCustomFields);
  const isInitialized = useAppStore((s) => s.isInitialized);

  const displayFields = (isInitialized && storeCustomFields.length > 0)
    ? storeCustomFields
    : initialFields;

  const [fields, setFields] = useState(displayFields);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);

  React.useEffect(() => {
    if (displayFields.length > 0) {
      setFields(displayFields);
    }
  }, [displayFields]);

  const normalSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const reorderSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 1 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 1 } }),
  );

  const sensors = isReorderMode ? reorderSensors : normalSensors;

  const activeField = activeId ? fields.find((f) => f.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    }
  }

  const unlockScroll = () => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
  };

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setFields((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    unlockScroll();

    optimisticReorderCustomFields(fields);

    const order = fields.map((f, i) => ({ id: f.id, display_order: i + 1 }));
    const res = await fetch("/api/custom-fields/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });

    if (!res.ok) {
      toast({ variant: "destructive", title: "Failed to save order" });
    }
  }

  function handleDragCancel() {
    setActiveId(null);
    unlockScroll();
    if (displayFields.length > 0) setFields(displayFields);
  }

  const toggleReorderMode = () => {
    const nextState = !isReorderMode;
    setIsReorderMode(nextState);
    if (nextState && typeof navigator !== "undefined" && navigator.vibrate) {
      try { navigator.vibrate([40, 30, 40]); } catch {}
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold leading-tight">Student Profile Fields</h1>
          <p className="text-xs text-muted-foreground">{fields.length} profile fields setup</p>
        </div>
        <div className="flex items-center gap-2">
          {isReorderMode ? (
            <Button size="sm" variant="default" className="bg-primary text-primary-foreground font-semibold px-4" onClick={toggleReorderMode}>
              Done ✓
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" className="text-xs" onClick={toggleReorderMode}>
                Reorder
              </Button>
              <NavButton href="/custom-fields/new">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </NavButton>
            </>
          )}
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {fields.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No custom fields defined yet.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Display Order
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isReorderMode ? "Reorder Mode Active — Drag cards to rearrange" : "Hold any card or tap Reorder to rearrange"}
                </p>
              </div>
            </div>
            <ClientOnly>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {fields.map((f) => (
                      <SortableCard
                        key={f.id}
                        field={f}
                        isReorderMode={isReorderMode}
                        onTriggerReorder={() => setIsReorderMode(true)}
                      />
                    ))}
                  </div>
                </SortableContext>
                <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
                  {activeField ? <OverlayCard field={activeField} /> : null}
                </DragOverlay>
              </DndContext>
            </ClientOnly>
          </>
        )}
      </div>
    </div>
  );
}
