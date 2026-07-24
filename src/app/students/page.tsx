import { prisma } from "@/lib/prisma";
import { StudentsTable } from "./students-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentsPage() {
  const [students, homepageFields, searchableFields] = await Promise.all([
    prisma.student.findMany({
      orderBy: { created_at: "desc" },
      select: { id: true, name: true, created_at: true },
    }),
    prisma.customFieldDefinition.findMany({
      where: { show_in_homepage: true, is_active: true },
      orderBy: [{ display_order: "asc" }, { label: "asc" }],
      select: { id: true, key: true, label: true, field_type: true },
    }),
    prisma.customFieldDefinition.findMany({
      where: { is_searchable: true, is_active: true },
      orderBy: [{ display_order: "asc" }, { label: "asc" }],
      select: { id: true, key: true, label: true, field_type: true, options_json: true },
    }),
  ]);

  const studentIds = students.map((student) => student.id);
  const allFieldIds = Array.from(
    new Set([...homepageFields.map((f) => f.id), ...searchableFields.map((f) => f.id)])
  );

  const values =
    studentIds.length > 0 && allFieldIds.length > 0
      ? await prisma.studentCustomFieldValue.findMany({
          where: {
            student_id: { in: studentIds },
            field_id: { in: allFieldIds },
          },
          include: { field: true },
        })
      : [];

  const valuesByStudentId = new Map<string, Record<string, (typeof values)[number]>>();
  for (const value of values) {
    const entry = valuesByStudentId.get(value.student_id) ?? {};
    entry[value.field.key] = value;
    valuesByStudentId.set(value.student_id, entry);
  }

  const rows = students.map((student) => ({
    ...student,
    values: valuesByStudentId.get(student.id) ?? {},
  }));

  return (
    <StudentsTable
      data={rows}
      totalEnrolledCount={students.length}
      homepageFields={homepageFields}
      searchableFields={searchableFields}
    />
  );
}
