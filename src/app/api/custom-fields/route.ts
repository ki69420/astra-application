import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const FIELD_TYPES = new Set([
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "DECIMAL",
  "DATE",
  "DATETIME",
  "TIME",
  "BOOLEAN",
  "EMAIL",
  "PHONE",
  "URL",
  "SELECT",
  "MULTI_SELECT",
  "RADIO",
  "CHECKBOX",
  "FILE",
  "IMAGE",
]);

function slugifyLabel(label: string) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

async function generateUniqueFieldKey(label: string, suppliedKey?: string) {
  const base = suppliedKey?.trim()
    ? suppliedKey.trim().toLowerCase()
    : slugifyLabel(label);
  const normalized = base
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  const seed = normalized || "field";

  let key = seed;
  let suffix = 1;

  while (true) {
    const existing = await prisma.customFieldDefinition.findUnique({
      where: { key },
    });
    if (!existing) return key;
    key = `${seed}_${suffix}`;
    suffix += 1;
  }
}

export async function GET() {
  const fields = await prisma.customFieldDefinition.findMany({
    orderBy: [{ display_order: "asc" }, { label: "asc" }],
  });

  return NextResponse.json(fields);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Record<string, unknown>;

  const errors: Record<string, string> = {};
  const suppliedKey = typeof body.key === "string" ? body.key.trim() : "";
  if (suppliedKey && !/^[a-z_]+$/.test(suppliedKey)) {
    errors.key = "Lowercase letters and underscores only";
  }
  if (!body.label) errors.label = "Label is required";
  if (!body.field_type || !FIELD_TYPES.has(body.field_type as string)) {
    errors.field_type = "Invalid field type";
  }

  if (Object.keys(errors).length) {
    return NextResponse.json({ error: errors }, { status: 422 });
  }

  const key = await generateUniqueFieldKey(
    body.label as string,
    suppliedKey || undefined,
  );
  const lastField = await prisma.customFieldDefinition.findFirst({
    orderBy: { display_order: "desc" },
    select: { display_order: true },
  });
  const nextOrder = (lastField?.display_order ?? 0) + 1;

  const field = await prisma.customFieldDefinition.create({
    data: {
      key,
      label: body.label as string,
      field_type: body.field_type as never,
      options_json: body.options_json ?? undefined,
      display_order: nextOrder,
      show_in_homepage: Boolean(body.show_in_homepage ?? false),
    },
  });

  revalidatePath("/custom-fields");
  revalidatePath("/students");
  return NextResponse.json(field, { status: 201 });
}
