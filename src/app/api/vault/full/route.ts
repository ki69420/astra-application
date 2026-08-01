import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [groups, parentLinks, items, groupItemLinks] = await Promise.all([
      prisma.vaultGroup.findMany({
        orderBy: [{ display_order: "asc" }, { title: "asc" }],
      }),
      prisma.vaultGroupParentChild.findMany({
        orderBy: { display_order: "asc" },
      }),
      prisma.vaultItem.findMany({
        orderBy: [{ display_order: "asc" }, { created_at: "desc" }],
        include: {
          document: true,
        },
      }),
      prisma.vaultGroupItem.findMany({
        orderBy: { display_order: "asc" },
      }),
    ]);

    return NextResponse.json({
      groups,
      parentLinks,
      items,
      groupItemLinks,
      last_updated_at: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch vault data", details: String(error) },
      { status: 500 },
    );
  }
}
