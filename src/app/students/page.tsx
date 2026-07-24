import { NavButton } from "@/components/ui/nav-button";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StudentsTable } from "./students-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentsPage() {
  const [students, homepageFields] = await Promise.all([
    prisma.student.findMany({
      orderBy: { created_at: "desc" },
      select: { id: true, name: true, created_at: true },
    }),
    prisma.customFieldDefinition.findMany({
      where: { show_in_homepage: true, is_active: true },
      orderBy: [{ display_order: "asc" }, { label: "asc" }],
      select: { id: true, key: true, label: true, field_type: true },
    }),
  ]);

  const studentIds = students.map((student) => student.id);
  const homepageFieldIds = homepageFields.map((field) => field.id);
  const values =
    studentIds.length > 0 && homepageFieldIds.length > 0
      ? await prisma.studentCustomFieldValue.findMany({
          where: {
            student_id: { in: studentIds },
            field_id: { in: homepageFieldIds },
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
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold leading-tight">Students</h1>
          <p className="text-xs text-muted-foreground">{students.length} enrolled</p>
        </div>
        <NavButton href="/students/new">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </NavButton>
      </header>
      <div className="flex-1 px-4 py-4">
        <StudentsTable data={rows} homepageFields={homepageFields} />
      </div>
    </div>
  );
}
