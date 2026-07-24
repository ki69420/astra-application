import { randomUUID } from "crypto";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "documents";
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "File type is not supported" },
      { status: 415 },
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File exceeds 10MB limit" },
      { status: 413 },
    );
  }

  const extension = path.extname(file.name).toLowerCase();
  const safeFileName = `${randomUUID()}${extension}`;
  const storagePath = `${safeFileName}`;
  const admin = createAdminClient();
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(SUPABASE_BUCKET)
    .upload(storagePath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 502 });
  }

  const document = await prisma.document.create({
    data: {
      file_name: safeFileName,
      original_name: file.name,
      mime_type: file.type || "application/octet-stream",
      extension: extension.replace(".", "") || "bin",
      size: file.size,
      storage_provider: "SUPABASE",
      storage_path: storagePath,
      uploaded_by: "system",
    },
  });

  revalidatePath("/documents");
  return NextResponse.json(document, { status: 201 });
}
