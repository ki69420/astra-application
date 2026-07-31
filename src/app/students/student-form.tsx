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
import { Loader2, Trash2, RefreshCw } from "lucide-react";
import { useAppStore, type StudentRow } from "@/lib/store/use-app-store";
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

    router.push("/students");
    toast({ title: studentId ? "Student updated" : "Student created" });

    // 2. BACKGROUND Async save to Database
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
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({
          variant: "destructive",
          title: "Save error",
          description: JSON.stringify(err.error || err),
        });
      }

      // Re-sync background timestamp
      checkAndSyncBackground();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Background save error",
        description: String(err),
      });
    }
  }

  const handleDelete = async () => {
    if (!studentId) return;

    // 1. INSTANT Optimistic Delete & Redirect
    optimisticDeleteStudent(studentId);
    router.push("/students");
    toast({ title: "Student deleted" });

    // 2. BACKGROUND Async DB Delete
    try {
      const res = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
      if (!res.ok) {
        toast({ variant: "destructive", title: "Delete error" });
      }
      checkAndSyncBackground();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Background delete error",
        description: String(err),
      });
    }
  };

  const visibleFields = customFields.filter((f) => f.is_active);

  return (
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

        <Button type="button" variant="outline" className="h-11 px-5" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
