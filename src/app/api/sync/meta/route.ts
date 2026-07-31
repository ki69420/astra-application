import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [
      latestStudent,
      latestField,
      latestValue,
      latestDocument,
      latestVaultGroup,
      latestVaultItem,
      studentCount,
      fieldCount,
      documentCount,
      vaultGroupCount,
      vaultItemCount,
    ] = await Promise.all([
      prisma.student.findFirst({
        orderBy: { updated_at: "desc" },
        select: { updated_at: true },
      }),
      prisma.customFieldDefinition.findFirst({
        orderBy: { updated_at: "desc" },
        select: { updated_at: true },
      }),
      prisma.studentCustomFieldValue.findFirst({
        orderBy: { updated_at: "desc" },
        select: { updated_at: true },
      }),
      prisma.document.findFirst({
        where: { deleted_at: null },
        orderBy: { uploaded_at: "desc" },
        select: { uploaded_at: true },
      }),
      prisma.vaultGroup.findFirst({
        orderBy: { updated_at: "desc" },
        select: { updated_at: true },
      }),
      prisma.vaultItem.findFirst({
        orderBy: { updated_at: "desc" },
        select: { updated_at: true },
      }),
      prisma.student.count(),
      prisma.customFieldDefinition.count(),
      prisma.document.count({ where: { deleted_at: null } }),
      prisma.vaultGroup.count(),
      prisma.vaultItem.count(),
    ]);

    const timestamps = [
      latestStudent?.updated_at?.getTime() ?? 0,
      latestField?.updated_at?.getTime() ?? 0,
      latestValue?.updated_at?.getTime() ?? 0,
      latestDocument?.uploaded_at?.getTime() ?? 0,
      latestVaultGroup?.updated_at?.getTime() ?? 0,
      latestVaultItem?.updated_at?.getTime() ?? 0,
    ];

    const maxTimestamp = Math.max(...timestamps, 0);

    return NextResponse.json({
      last_updated_at: new Date(maxTimestamp).toISOString(),
      total_students: studentCount,
      total_fields: fieldCount,
      total_documents: documentCount,
      total_vault_groups: vaultGroupCount,
      total_vault_items: vaultItemCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch sync metadata", details: String(error) },
      { status: 500 },
    );
  }
}
