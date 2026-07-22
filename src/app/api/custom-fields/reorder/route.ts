import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const { order } = (await req.json()) as {
    order: { id: string; display_order: number }[];
  };

  if (!Array.isArray(order) || order.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  await prisma.$transaction(
    order.map(({ id, display_order }) =>
      prisma.customFieldDefinition.update({
        where: { id },
        data: { display_order },
      }),
    ),
  );

  revalidatePath("/custom-fields");
  revalidatePath("/students");
  return NextResponse.json({ success: true });
}
