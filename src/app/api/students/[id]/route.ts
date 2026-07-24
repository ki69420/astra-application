import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasMeaningfulValue, resolveTypedValue } from "@/lib/field-value-resolver";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const student = await prisma.student.findFirst({
    where: { id },
    include: {
      custom_field_values: {
        include: { field: true },
      },
    },
  });
  if (!student)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(student);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;

  const customFields = await prisma.customFieldDefinition.findMany({
    where: { is_active: true },
  });

  const customFieldKeys = new Set(customFields.map((f) => f.key));
  const customData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (customFieldKeys.has(k)) customData[k] = v;
  }

  const updateData: Prisma.StudentUpdateInput = {};
  if (body.name) updateData.name = body.name as string;

  const student = await prisma.student.update({
    where: { id },
    data: updateData,
  });

  if (Object.keys(customData).length > 0) {
    const fieldMap = new Map(customFields.map((f) => [f.key, f]));
    await Promise.all(
      Object.entries(customData)
        .filter(
          ([, value]) => value !== undefined && value !== null && value !== "",
        )
        .flatMap(([key, value]) => {
          const field = fieldMap.get(key)!;
          const typed = resolveTypedValue(field.field_type, value);
          if (!hasMeaningfulValue(typed)) return [];
          return [
            prisma.studentCustomFieldValue.upsert({
              where: {
                student_id_field_id: { student_id: id, field_id: field.id },
              },
              create: { student_id: id, field_id: field.id, ...typed },
              update: typed,
            }),
          ];
        }),
    );
  }

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return NextResponse.json(student);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.student.delete({ where: { id } });
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return NextResponse.json({ success: true });
}
