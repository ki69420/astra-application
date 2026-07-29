import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditStudentView } from "./edit-student-view";

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

  return (
    <EditStudentView
      studentId={id}
      initialStudent={student}
      initialCustomFields={customFields}
    />
  );
}
