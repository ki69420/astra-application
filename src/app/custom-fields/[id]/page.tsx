import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomFieldForm } from "../custom-field-form";

export const dynamic = "force-dynamic";

export default async function EditCustomFieldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const field = await prisma.customFieldDefinition.findFirst({ where: { id } });

  if (!field) notFound();

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href="/custom-fields"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-base font-bold">Edit Field</h1>
          <p className="text-xs text-muted-foreground truncate">{field.label}</p>
        </div>
      </header>
      <CustomFieldForm
        fieldId={field.id}
        defaultValues={{
          key: field.key,
          label: field.label,
          field_type: field.field_type as "TEXT" | "TEXTAREA" | "NUMBER" | "DECIMAL" | "DATE" | "TIME" | "BOOLEAN" | "PHONE" | "RADIO" | "CHECKBOX" | "FILE" | "IMAGE",
          show_in_homepage: field.show_in_homepage,
          options: (field.options_json as string[] | null | undefined)?.map((value) => ({ value })) ?? [],
        }}
      />
    </div>
  );
}
