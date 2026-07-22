import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentForm } from "../../student-form";

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
    defaultValues[cfv.field.key] =
      cfv.value_text ?? cfv.value_number ?? cfv.value_decimal ?? cfv.value_boolean ??
      cfv.value_date?.toISOString() ?? cfv.value_datetime?.toISOString() ??
      cfv.value_json ?? cfv.document_id ?? "";
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
