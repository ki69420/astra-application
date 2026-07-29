import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [students, homepageFields, searchableFields, customFields, documents] =
      await Promise.all([
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
          select: {
            id: true,
            key: true,
            label: true,
            field_type: true,
            options_json: true,
          },
        }),
        prisma.customFieldDefinition.findMany({
          orderBy: [{ display_order: "asc" }, { label: "asc" }],
        }),
        prisma.document.findMany({
          where: { deleted_at: null },
          orderBy: { uploaded_at: "desc" },
        }),
      ]);

    const studentIds = students.map((s) => s.id);
    const allFieldIds = Array.from(
      new Set([
        ...homepageFields.map((f) => f.id),
        ...searchableFields.map((f) => f.id),
      ]),
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

    const valuesByStudentId = new Map<
      string,
      Record<string, (typeof values)[number]>
    >();
    for (const val of values) {
      const entry = valuesByStudentId.get(val.student_id) ?? {};
      entry[val.field.key] = val;
      valuesByStudentId.set(val.student_id, entry);
    }

    const rows = students.map((student) => ({
      ...student,
      values: valuesByStudentId.get(student.id) ?? {},
    }));

    return NextResponse.json({
      students: rows,
      homepageFields,
      searchableFields,
      customFields,
      documents,
      last_updated_at: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch full sync data", details: String(error) },
      { status: 500 },
    );
  }
}
