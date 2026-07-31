"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import type { CustomFieldDefinition } from "@prisma/client";
import { DynamicField } from "@/components/custom-fields/dynamic-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Trash2, RefreshCw, ArrowLeft } from "lucide-react";
import { useAppStore, type StudentRow } from "@/lib/store/use-app-store";
import { useNavigationStore } from "@/lib/store/use-navigation-store";
import { enqueueAction } from "@/lib/sync/offline-queue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type FormData = Record<string, unknown>;

interface StudentFormProps {
  customFields: CustomFieldDefinition[];
  defaultValues?: FormData;
  studentId?: string;
}

export function StudentForm({ customFields, defaultValues, studentId }: StudentFormProps) {
  const router = useRouter();
  const isInitialized = useAppStore((s) => s.isInitialized);
  const optimisticAddStudent = useAppStore((s) => s.optimisticAddStudent);
  const optimisticUpdateStudent = useAppStore((s) => s.optimisticUpdateStudent);
  const optimisticDeleteStudent = useAppStore((s) => s.optimisticDeleteStudent);
  const optimisticAddDocument = useAppStore((s) => s.optimisticAddDocument);
  const checkAndSyncBackground = useAppStore((s) => s.checkAndSyncBackground);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ defaultValues });

  React.useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  async function uploadFile(file: File) {
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

  async function onSubmit(data: FormData) {
    const studentName = String(data.name || "New Student");
    const tempId = studentId || `temp-${Date.now()}`;

    // Construct local values for optimistic update
    const valuesObj: StudentRow["values"] = {};
    for (const field of customFields) {
      const rawVal = data[field.key];
      if (rawVal != null && rawVal !== "") {
        if (Array.isArray(rawVal) && rawVal.length === 0) continue;
        valuesObj[field.key] = {
          value_text: typeof rawVal === "string" ? rawVal : null,
          value_number: typeof rawVal === "number" ? rawVal : null,
          value_boolean: typeof rawVal === "boolean" ? rawVal : null,
          value_date: typeof rawVal === "string" ? rawVal : null,
          value_json: Array.isArray(rawVal) ? rawVal : null,
          field: { key: field.key, label: field.label, field_type: field.field_type },
        };
      }
    }

    // 1. INSTANT Optimistic UI Update & Redirect (0ms latency!)
    if (studentId) {
      optimisticUpdateStudent(studentId, studentName, valuesObj);
    } else {
      optimisticAddStudent({
        id: tempId,
        name: studentName,
        created_at: new Date().toISOString(),
        values: valuesObj,
      });
    }

    useNavigationStore.getState().navigateTo("students");
    toast({ title: studentId ? "Student updated" : "Student created" });

    // 2. BACKGROUND Async save to Database or Offline Queue
    try {
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value instanceof File) {
          const uploaded = await uploadFile(value);
          payload[key] = uploaded.id;
        } else {
          payload[key] = value;
        }
      }

      const url = studentId ? `/api/students/${studentId}` : "/api/students";
      const method = studentId ? "PATCH" : "POST";

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await enqueueAction(studentId ? "UPDATE_STUDENT" : "CREATE_STUDENT", url, method, payload);
      } else {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          await enqueueAction(studentId ? "UPDATE_STUDENT" : "CREATE_STUDENT", url, method, payload);
        }
      }

      // Re-sync background timestamp
      checkAndSyncBackground();
    } catch {
      // Offline fallback
      const url = studentId ? `/api/students/${studentId}` : "/api/students";
      const method = studentId ? "PATCH" : "POST";
      await enqueueAction(studentId ? "UPDATE_STUDENT" : "CREATE_STUDENT", url, method, data);
    }
  }

  const handleDelete = async () => {
    if (!studentId) return;

    // 1. INSTANT Optimistic Delete & Redirect
    optimisticDeleteStudent(studentId);
    useNavigationStore.getState().navigateTo("students");
    toast({ title: "Student deleted" });

    // 2. BACKGROUND Async DB Delete or Offline Queue
    try {
      const url = `/api/students/${studentId}`;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await enqueueAction("DELETE_STUDENT", url, "DELETE", null);
      } else {
        const res = await fetch(url, { method: "DELETE" });
        if (!res.ok) {
          await enqueueAction("DELETE_STUDENT", url, "DELETE", null);
        }
      }
      checkAndSyncBackground();
    } catch {
      await enqueueAction("DELETE_STUDENT", `/api/students/${studentId}`, "DELETE", null);
    }
  };

  const storeCustomFields = useAppStore((s) => s.customFields);

  const visibleFields: CustomFieldDefinition[] = React.useMemo(() => {
    if (customFields && customFields.length > 0) {
      return customFields.filter((f) => f.is_active);
    }
    return (storeCustomFields || []).map((f) => ({
      id: f.id,
      key: f.key,
      label: f.label,
      field_type: f.field_type as never,
      show_in_homepage: f.show_in_homepage,
      is_searchable: f.is_searchable,
      display_order: f.display_order,
      options_json: f.options_json as never,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }));
  }, [customFields, storeCustomFields]);

  return (
    <div>
      {!studentId && (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            type="button"
            onClick={() => useNavigationStore.getState().navigateTo("students")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-base font-bold">Add New Student</h1>
            <p className="text-xs text-muted-foreground">Fill in student profile &amp; custom fields</p>
          </div>
        </header>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 py-4">
      {!isInitialized && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/60 border text-xs text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
          <span>If any custom fields are missing, please wait a moment — initial data is downloading in the background.</span>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Student Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter full name"
              className="h-11"
              {...register("name", { required: "Name is required" })}
            />
            {errors["name"] && (
              <p className="text-xs text-destructive">{errors["name"]?.message as string}</p>
            )}
          </div>

          {visibleFields.map((field) => (
            <DynamicField
              key={field.id}
              field={field}
              control={control}
              error={errors[field.key]?.message as string | undefined}
            />
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1 h-11">
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
          ) : studentId ? "Update Student" : "Create Student"}
        </Button>

        {studentId && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" className="h-11 px-4">
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Student</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this student profile? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Student
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <Button
          type="button"
          variant="outline"
          className="h-11 px-5"
          onClick={() => useNavigationStore.getState().goBack()}
        >
          Cancel
        </Button>
      </div>
    </form>
  </div>
  );
}
