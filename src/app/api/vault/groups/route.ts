import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, icon, parent_ids } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const lastGroup = await prisma.vaultGroup.findFirst({
      orderBy: { display_order: "desc" },
      select: { display_order: true },
    });
    const nextOrder = (lastGroup?.display_order ?? 0) + 1;

    const group = await prisma.vaultGroup.create({
      data: {
        title: title.trim(),
        description: description ? String(description).trim() : null,
        icon: icon ? String(icon).trim() : "Folder",
        display_order: nextOrder,
      },
    });

    if (Array.isArray(parent_ids) && parent_ids.length > 0) {
      await prisma.vaultGroupParentChild.createMany({
        data: parent_ids.map((parentId: string, idx: number) => ({
          parent_id: parentId,
          child_id: group.id,
          display_order: idx,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create group", details: String(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, description, icon, display_order, parent_ids } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = String(title).trim();
    if (description !== undefined) updateData.description = String(description).trim() || null;
    if (icon !== undefined) updateData.icon = String(icon).trim();
    if (display_order !== undefined) updateData.display_order = Number(display_order);

    const group = await prisma.vaultGroup.update({
      where: { id },
      data: updateData,
    });

    if (Array.isArray(parent_ids)) {
      await prisma.vaultGroupParentChild.deleteMany({
        where: { child_id: id },
      });
      if (parent_ids.length > 0) {
        await prisma.vaultGroupParentChild.createMany({
          data: parent_ids.map((parentId: string, idx: number) => ({
            parent_id: parentId,
            child_id: id,
            display_order: idx,
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update group", details: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const parentId = searchParams.get("parentId");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    if (parentId) {
      // Unlink group from parent
      await prisma.vaultGroupParentChild.deleteMany({
        where: { parent_id: parentId, child_id: id },
      });
      return NextResponse.json({ success: true, unlinked: true });
    }

    // Delete group permanently
    await prisma.vaultGroup.delete({ where: { id } });
    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete group", details: String(error) },
      { status: 500 },
    );
  }
}
