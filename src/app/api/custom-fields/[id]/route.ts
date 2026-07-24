import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;

  const updateData: Prisma.CustomFieldDefinitionUpdateInput = {};
  if (body.label !== undefined) updateData.label = body.label as string;
  if (body.field_type !== undefined)
    updateData.field_type = body.field_type as never;
  if (body.options_json !== undefined) {
    updateData.options_json =
      (body.options_json as Prisma.InputJsonValue) ?? Prisma.JsonNull;
  }
  if (body.display_order !== undefined)
    updateData.display_order = Number(body.display_order);
  if (body.show_in_homepage !== undefined)
    updateData.show_in_homepage = Boolean(body.show_in_homepage);
  if (body.is_searchable !== undefined)
    updateData.is_searchable = Boolean(body.is_searchable);

  const field = await prisma.customFieldDefinition.update({
    where: { id },
    data: updateData,
  });
  revalidatePath("/custom-fields");
  revalidatePath(`/custom-fields/${id}`);
  revalidatePath("/students");
  return NextResponse.json(field);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.customFieldDefinition.delete({ where: { id } });
  revalidatePath("/custom-fields");
  revalidatePath("/students");
  return NextResponse.json({ success: true });
}
