import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma, Prisma } from "@/lib/prisma";
import { hasMeaningfulValue, resolveTypedValue } from "@/lib/field-value-resolver";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Record<string, unknown>;

  if (!body.name)
    return NextResponse.json(
      { error: { name: "Name is required" } },
      { status: 422 },
    );

  const customFields = await prisma.customFieldDefinition.findMany({
    where: { is_active: true },
  });

  const customFieldKeys = new Set(customFields.map((f) => f.key));
  const customData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (customFieldKeys.has(k)) customData[k] = v;
  }

  const student = await prisma.student.create({
    data: {
      name: body.name as string,
    },
  });

  if (Object.keys(customData).length > 0) {
    const fieldMap = new Map(customFields.map((f) => [f.key, f]));
    const fieldValues = Object.entries(customData)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([key, value]) => {
        const field = fieldMap.get(key)!;
        const typed = resolveTypedValue(field.field_type, value);
        return hasMeaningfulValue(typed)
          ? ({
              student_id: student.id,
              field_id: field.id,
              ...typed,
            } as Prisma.StudentCustomFieldValueCreateManyInput)
          : null;
      })
      .filter(
        (value): value is Prisma.StudentCustomFieldValueCreateManyInput =>
          value !== null,
      );

    if (fieldValues.length > 0) {
      await prisma.studentCustomFieldValue.createMany({ data: fieldValues });
    }
  }

  revalidatePath("/students");
  revalidatePath(`/students/${student.id}`);
  return NextResponse.json(student, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const [students, total] = await prisma.$transaction([
    prisma.student.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: "desc" },
    }),
    prisma.student.count(),
  ]);

  return NextResponse.json({ students, total, page, limit });
}
