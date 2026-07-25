import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { NavButton } from "@/components/ui/nav-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, ArrowLeft, Download } from "lucide-react";
import React from "react";

type CFV = {
  id: string;
  field: { label: string; field_type: string; display_order: number };
  value_text: string | null;
  value_number: number | null;
  value_decimal: unknown;
  value_boolean: boolean | null;
  value_date: Date | null;
  value_datetime: Date | null;
  value_json: unknown;
  document_id: string | null;
};

function displayValue(cfv: CFV): React.ReactNode {
  if (cfv.value_text !== null) return cfv.value_text;
  if (cfv.value_number !== null) return String(cfv.value_number);
  if (cfv.value_decimal !== null) return String(cfv.value_decimal);
  if (cfv.value_boolean !== null) return cfv.value_boolean ? "Yes" : "No";
  if (cfv.value_date !== null)
    return format(new Date(cfv.value_date), "dd MMM yyyy");
  if (cfv.value_datetime !== null)
    return format(new Date(cfv.value_datetime), "dd MMM yyyy HH:mm");
  if (cfv.value_json !== null)
    return Array.isArray(cfv.value_json)
      ? (cfv.value_json as string[]).join(", ")
      : String(cfv.value_json);
  if (cfv.document_id)
    return (
      <a
        href={`/api/documents/${cfv.document_id}/download`}
        className="flex items-center gap-1 text-primary hover:underline"
      >
        <Download className="h-3 w-3" />
        Download {cfv.field.field_type === "IMAGE" ? "Image" : "File"}
      </a>
    );
  return "—";
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await prisma.student.findFirst({
    where: { id },
    include: {
      custom_field_values: {
        include: { field: true },
        orderBy: [
          { field: { display_order: "asc" } },
          { field: { label: "asc" } },
        ],
      },
    },
  });

  if (!student) notFound();

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

  const customValues = [...(student.custom_field_values as CFV[])]
    .filter(hasDisplayableValue)
    .sort(
      (a, b) =>
        (a.field.display_order ?? 0) - (b.field.display_order ?? 0) ||
        a.field.label.localeCompare(b.field.label),
    );

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            asChild
          >
            <Link href="/students">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-base font-bold truncate">{student.name}</h1>
            <p className="text-xs text-muted-foreground">
              Enrolled {format(new Date(student.created_at), "dd MMM yyyy")}
            </p>
          </div>
        </div>
        <NavButton href={`/students/${student.id}/edit`}>
          <Pencil className="h-4 w-4 mr-1" />
          Edit
        </NavButton>
      </header>

      <div className="px-4 py-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Basic Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Full Name" value={student.name} />
          </CardContent>
        </Card>

        {customValues.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Student Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customValues.map((value) => (
                <Row
                  key={value.id}
                  label={value.field.label}
                  value={displayValue(value)}
                />
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
