import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, value_text, value_date, document_id, custom_field_id, group_ids } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const item = await prisma.vaultItem.create({
      data: {
        title: title.trim(),
        value_text: value_text ? String(value_text).trim() : null,
        value_date: value_date ? new Date(value_date) : null,
        document_id: document_id ? String(document_id).trim() : null,
        custom_field_id: custom_field_id ? String(custom_field_id).trim() : null,
      },
      include: {
        document: true,
        custom_field: true,
      },
    });

    if (Array.isArray(group_ids) && group_ids.length > 0) {
      await prisma.vaultGroupItem.createMany({
        data: group_ids.map((groupId: string, idx: number) => ({
          group_id: groupId,
          item_id: item.id,
          display_order: idx,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create item", details: String(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, value_text, value_date, document_id, custom_field_id, group_ids } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = String(title).trim();
    if (value_text !== undefined) updateData.value_text = value_text ? String(value_text).trim() : null;
    if (value_date !== undefined) updateData.value_date = value_date ? new Date(value_date) : null;
    if (document_id !== undefined) updateData.document_id = document_id ? String(document_id).trim() : null;
    if (custom_field_id !== undefined) updateData.custom_field_id = custom_field_id ? String(custom_field_id).trim() : null;

    const item = await prisma.vaultItem.update({
      where: { id },
      data: updateData,
      include: {
        document: true,
        custom_field: true,
      },
    });

    if (Array.isArray(group_ids)) {
      await prisma.vaultGroupItem.deleteMany({
        where: { item_id: id },
      });
      if (group_ids.length > 0) {
        await prisma.vaultGroupItem.createMany({
          data: group_ids.map((groupId: string, idx: number) => ({
            group_id: groupId,
            item_id: id,
            display_order: idx,
          })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update item", details: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const groupId = searchParams.get("groupId");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    if (groupId) {
      // Unlink item from specified group
      await prisma.vaultGroupItem.deleteMany({
        where: { group_id: groupId, item_id: id },
      });
      return NextResponse.json({ success: true, unlinked: true });
    }

    // Delete item permanently
    await prisma.vaultItem.delete({ where: { id } });
    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete item", details: String(error) },
      { status: 500 },
    );
  }
}
