"use client";
import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { NavButton } from "@/components/ui/nav-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, ArrowLeft, Paperclip, Loader2 } from "lucide-react";
import { FilePreview } from "@/components/documents/file-preview";
import { formatDisplayDate } from "@/lib/date-utils";
import { useAppStore } from "@/lib/store/use-app-store";

type CFV = {
  id: string;
  field: { key: string; label: string; field_type: string; display_order: number };
  value_text: string | null;
  value_number: number | null;
  value_decimal: unknown;
  value_boolean: boolean | null;
  value_date: Date | null;
  value_datetime: Date | null;
  value_json: unknown;
  document_id: string | null;
};

type StudentDetailData = {
  id: string;
  name: string;
  created_at: Date | string;
  custom_field_values: CFV[];
};

function displayValue(cfv: CFV): React.ReactNode {
  if (cfv.value_text !== null) return cfv.value_text;
  if (cfv.value_number !== null) return String(cfv.value_number);
  if (cfv.value_decimal !== null) return String(cfv.value_decimal);
  if (cfv.value_boolean !== null) return cfv.value_boolean ? "Yes" : "No";
  if (cfv.value_date !== null) return formatDisplayDate(cfv.value_date);
  if (cfv.value_datetime !== null)
    return format(new Date(cfv.value_datetime), "dd MMM yyyy HH:mm");
  if (cfv.value_json !== null)
    return Array.isArray(cfv.value_json)
      ? (cfv.value_json as string[]).join(", ")
      : String(cfv.value_json);
  if (cfv.document_id)
    return (
      <FilePreview
        documentId={cfv.document_id}
        fileName={cfv.field.label}
        isImage={cfv.field.field_type === "IMAGE"}
      />
    );
  return "—";
}

function hasDisplayableValue(cfv: CFV): boolean {
  if (cfv.value_boolean !== null) {
    return cfv.value_boolean === true;
  }
  if (cfv.value_text !== null) {
    return cfv.value_text.trim() !== "";
  }
  if (cfv.value_number !== null) return true;
  if (cfv.value_decimal !== null) return true;
  if (cfv.value_date !== null) return true;
  if (cfv.value_datetime !== null) return true;
  if (cfv.value_json !== null) {
    if (Array.isArray(cfv.value_json)) return cfv.value_json.length > 0;
    return true;
  }
  if (cfv.document_id) return true;
  return false;
}

export function StudentDetailView({
  studentId,
  initialStudent,
}: {
  studentId: string;
  initialStudent?: StudentDetailData;
}) {
  const storeStudents = useAppStore((s) => s.students);
  const storeCustomFields = useAppStore((s) => s.customFields);
  const isInitialized = useAppStore((s) => s.isInitialized);

  const [fetchedStudent, setFetchedStudent] = React.useState<StudentDetailData | null>(null);
  const [loading, setLoading] = React.useState(false);

  const storeStudent = isInitialized
    ? storeStudents.find((s) => s.id === studentId)
    : null;

  const student = storeStudent || initialStudent || fetchedStudent;

  React.useEffect(() => {
    if (!student && studentId) {
      setLoading(true);
      fetch(`/api/students/${studentId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setFetchedStudent({
              id: data.id,
              name: data.name,
              created_at: data.created_at,
              custom_field_values: data.custom_field_values || [],
            });
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [student, studentId]);

  const orderMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const f of storeCustomFields) {
      map.set(f.key, f.display_order ?? 999);
    }
    return map;
  }, [storeCustomFields]);

  const cfvList: CFV[] = React.useMemo(() => {
    if (storeStudent && storeStudent.values) {
      return Object.values(storeStudent.values).map((v) => ({
        id: v.field.key,
        field: {
          key: v.field.key,
          label: v.field.label,
          field_type: v.field.field_type,
          display_order: orderMap.get(v.field.key) ?? 999,
        },
        value_text: v.value_text ?? null,
        value_number: v.value_number ?? null,
        value_decimal: v.value_decimal ?? null,
        value_boolean: v.value_boolean ?? null,
        value_date: (v.value_date ? new Date(v.value_date) : null) as Date | null,
        value_datetime: (v.value_datetime ? new Date(v.value_datetime) : null) as Date | null,
        value_json: v.value_json ?? null,
        document_id: v.document_id ?? null,
      }));
    }
    const fallbackValues = initialStudent?.custom_field_values || fetchedStudent?.custom_field_values;
    if (fallbackValues) {
      return fallbackValues.map((v) => ({
        ...v,
        field: {
          ...v.field,
          key: v.field.key || v.id,
          display_order: orderMap.get(v.field.key) ?? v.field.display_order ?? 999,
        },
      }));
    }
    return [];
  }, [storeStudent, student, orderMap]);

  const allDisplayable = React.useMemo(() => {
    return cfvList
      .filter(hasDisplayableValue)
      .sort(
        (a, b) =>
          (a.field.display_order ?? 999) - (b.field.display_order ?? 999) ||
          a.field.label.localeCompare(b.field.label),
      );
  }, [cfvList]);

  const detailValues = React.useMemo(() => {
    return allDisplayable.filter(
      (v) => v.field.field_type !== "FILE" && v.field.field_type !== "IMAGE",
    );
  }, [allDisplayable]);

  const attachmentValues = React.useMemo(() => {
    return allDisplayable.filter(
      (v) => v.field.field_type === "FILE" || v.field.field_type === "IMAGE",
    );
  }, [allDisplayable]);

  if (!student && loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link href="/students">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="text-base font-bold">Student Profile</span>
        </header>
        <div className="flex flex-col items-center justify-center py-24 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading details...</p>
        </div>
      </div>
    );
  }

  const studentName = student ? student.name : "Student Profile";
  const createdAt = student ? student.created_at : new Date();

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link href="/students">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-base font-bold truncate">{studentName}</h1>
            <p className="text-xs text-muted-foreground">
              Enrolled {format(new Date(createdAt), "dd MMM yyyy")}
            </p>
          </div>
        </div>
        <NavButton href={`/students/${studentId}/edit`}>
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </NavButton>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Basic Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Full Name" value={studentName} />
          </CardContent>
        </Card>

        {/* Student Custom Fields Details */}
        {detailValues.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Student Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {detailValues.map((value) => (
                <Row
                  key={value.id}
                  label={value.field.label}
                  value={displayValue(value)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Attachments Section */}
        {attachmentValues.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Paperclip className="h-4 w-4 text-primary" />
                Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {attachmentValues.map((value) => (
                <div key={value.id} className="py-2.5 border-b last:border-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {value.field.label}
                    </span>
                  </div>
                  <div className="w-full">
                    {displayValue(value)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}
