import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CustomFieldsTable } from "./custom-fields-table";

export const revalidate = 30;

export default async function CustomFieldsPage() {
  const fields = await prisma.customFieldDefinition.findMany({
    orderBy: [{ display_order: "asc" }, { label: "asc" }],
  });

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold leading-tight">Custom Fields</h1>
          <p className="text-xs text-muted-foreground">{fields.length} fields defined</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/custom-fields/new">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Link>
        </Button>
      </header>

      <div className="px-4 py-4">
        {fields.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No custom fields yet.{" "}
            <Link href="/custom-fields/new" className="text-primary hover:underline">Add one</Link>.
          </div>
        ) : (
          <CustomFieldsTable fields={fields} />
        )}
      </div>
    </div>
  );
}
