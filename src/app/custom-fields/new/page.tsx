import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomFieldForm } from "../custom-field-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function NewCustomFieldPage() {
  return (
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href="/custom-fields"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-base font-bold">Add Custom Field</h1>
          <p className="text-xs text-muted-foreground">Define a new dynamic field</p>
        </div>
      </header>
      <CustomFieldForm />
    </div>
  );
}
