import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const doc = await prisma.document.findFirst({
    where: { id, deleted_at: null },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createAdminClient();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "documents";
  const { data, error } = await admin.storage
    .from(bucket)
    .download(doc.storage_path);

  if (error || !data) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const arrayBuffer = await data.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": doc.mime_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.original_name)}"`,
    },
  });
}
