import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentForm } from "../../student-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { formatToSlashDate } from "@/lib/date-utils";

function extractCFVValue(cfv: {
  field: { field_type: string };
  value_text: string | null;
  value_number: number | null;
  value_decimal: unknown;
  value_boolean: boolean | null;
  value_date: Date | null;
  value_datetime: Date | null;
  value_json: unknown;
  document_id: string | null;
}) {
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
      return cfv.value_datetime ? cfv.value_datetime.toISOString() : null;
    case "FILE":
    case "IMAGE":
      return cfv.document_id;
    default:
      return cfv.value_text ?? "";
  }
}

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [student, customFields] = await Promise.all([
    prisma.student.findFirst({
      where: { id },
      include: { custom_field_values: { include: { field: true } } },
    }),
    prisma.customFieldDefinition.findMany({
      where: { is_active: true },
      orderBy: [{ display_order: "asc" }, { label: "asc" }],
    }),
  ]);

  if (!student) notFound();

  const defaultValues: Record<string, unknown> = { name: student.name };
  for (const cfv of student.custom_field_values) {
    defaultValues[cfv.field.key] = extractCFVValue(cfv);
  }

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href={`/students/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-base font-bold">Edit Student</h1>
          <p className="text-xs text-muted-foreground truncate">{student.name}</p>
        </div>
      </header>
      <StudentForm customFields={customFields} defaultValues={defaultValues} studentId={id} />
    </div>
  );
}
