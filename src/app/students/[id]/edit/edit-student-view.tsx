"use client";
import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentForm } from "../../student-form";
import { formatToSlashDate } from "@/lib/date-utils";
import { useAppStore, type CustomField } from "@/lib/store/use-app-store";
import type { CustomFieldDefinition } from "@prisma/client";

type CFV = {
  field: { key: string; field_type: string };
  value_text: string | null;
  value_number: number | null;
  value_decimal: unknown;
  value_boolean: boolean | null;
  value_date: Date | null;
  value_datetime: Date | null;
  value_json: unknown;
  document_id: string | null;
};

type InitialStudentData = {
  id: string;
  name: string;
  custom_field_values: CFV[];
};

function extractCFVValue(cfv: CFV) {
  const { field_type } = cfv.field;
  switch (field_type) {
    case "BOOLEAN":
      return cfv.value_boolean;
    case "CHECKBOX":
    case "MULTI_SELECT":
      if (Array.isArray(cfv.value_json)) return cfv.value_json;
      if (typeof cfv.value_json === "string") {
        try {
          const parsed = JSON.parse(cfv.value_json);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          return cfv.value_json.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
      if (cfv.value_text) return [cfv.value_text];
      return [];
    case "NUMBER":
      return cfv.value_number;
    case "DECIMAL":
      return cfv.value_decimal != null ? Number(cfv.value_decimal) : null;
    case "DATE":
      return cfv.value_date ? formatToSlashDate(cfv.value_date) : null;
    case "DATETIME":
    case "TIME":
      return cfv.value_datetime ? new Date(cfv.value_datetime).toISOString() : null;
    case "FILE":
    case "IMAGE":
      return cfv.document_id;
    default:
      return cfv.value_text ?? "";
  }
}

export function EditStudentView({
  studentId,
  initialStudent,
  initialCustomFields,
}: {
  studentId: string;
  initialStudent: InitialStudentData;
  initialCustomFields: CustomFieldDefinition[];
}) {
  const storeStudents = useAppStore((s) => s.students);
  const storeCustomFields = useAppStore((s) => s.customFields);
  const isInitialized = useAppStore((s) => s.isInitialized);

  const storeStudent = isInitialized
    ? storeStudents.find((s) => s.id === studentId)
    : null;

  const studentName = storeStudent ? storeStudent.name : initialStudent.name;

  const activeCustomFields: CustomFieldDefinition[] = React.useMemo(() => {
    if (isInitialized && storeCustomFields.length > 0) {
      return (storeCustomFields as CustomField[]).map((f) => ({
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
    }
    return initialCustomFields;
  }, [isInitialized, storeCustomFields, initialCustomFields]);

  const defaultValues: Record<string, unknown> = React.useMemo(() => {
    const vals: Record<string, unknown> = { name: studentName };

    if (storeStudent && storeStudent.values) {
      for (const [key, v] of Object.entries(storeStudent.values)) {
        vals[key] = extractCFVValue({
          field: { key: v.field.key, field_type: v.field.field_type },
          value_text: v.value_text ?? null,
          value_number: v.value_number ?? null,
          value_decimal: v.value_decimal ?? null,
          value_boolean: v.value_boolean ?? null,
          value_date: (v.value_date ? new Date(v.value_date) : null) as Date | null,
          value_datetime: (v.value_datetime ? new Date(v.value_datetime) : null) as Date | null,
          value_json: v.value_json ?? null,
          document_id: v.document_id ?? null,
        });
      }
    } else {
      for (const cfv of initialStudent.custom_field_values) {
        vals[cfv.field.key] = extractCFVValue(cfv);
      }
    }

    return vals;
  }, [storeStudent, initialStudent, studentName]);

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href={`/students/${studentId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-base font-bold">Edit Student</h1>
          <p className="text-xs text-muted-foreground truncate">{studentName}</p>
        </div>
      </header>
      <StudentForm
        customFields={activeCustomFields}
        defaultValues={defaultValues}
        studentId={studentId}
      />
    </div>
  );
}
