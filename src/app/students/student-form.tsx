"use client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import type { CustomFieldDefinition } from "@prisma/client";
import { DynamicField } from "@/components/custom-fields/dynamic-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useAppStore, type StudentRow } from "@/lib/store/use-app-store";

type FormData = Record<string, unknown>;

interface StudentFormProps {
  customFields: CustomFieldDefinition[];
  defaultValues?: FormData;
  studentId?: string;
}

export function StudentForm({ customFields, defaultValues, studentId }: StudentFormProps) {
  const router = useRouter();
  const optimisticAddStudent = useAppStore((s) => s.optimisticAddStudent);
  const optimisticUpdateStudent = useAppStore((s) => s.optimisticUpdateStudent);
  const checkAndSyncBackground = useAppStore((s) => s.checkAndSyncBackground);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ defaultValues });

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/documents", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "File upload failed");
    }
    return res.json();
  }

  async function onSubmit(data: FormData) {
    const studentName = String(data.name || "New Student");
    const tempId = studentId || `temp-${Date.now()}`;

    // Construct local values for optimistic update
    const valuesObj: StudentRow["values"] = {};
    for (const field of customFields) {
      const rawVal = data[field.key];
      if (rawVal != null && rawVal !== "") {
        valuesObj[field.key] = {
          value_text: typeof rawVal === "string" ? rawVal : null,
          value_number: typeof rawVal === "number" ? rawVal : null,
          value_boolean: typeof rawVal === "boolean" ? rawVal : null,
          value_date: typeof rawVal === "string" ? rawVal : null,
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

  const visibleFields = customFields.filter((f) => f.is_active);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 py-4">
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

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1 h-11">
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
          ) : studentId ? "Update Student" : "Create Student"}
        </Button>
        <Button type="button" variant="outline" className="h-11 px-6" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
