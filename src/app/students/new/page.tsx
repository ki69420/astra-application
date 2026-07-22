import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentForm } from "../student-form";

export const dynamic = "force-dynamic";

export default async function NewStudentPage() {
  const customFields = await prisma.customFieldDefinition.findMany({
    where: { is_active: true },
    orderBy: [{ display_order: "asc" }, { label: "asc" }],
  });

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href="/students"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-base font-bold">Add Student</h1>
          <p className="text-xs text-muted-foreground">Fill in the details below</p>
        </div>
      </header>
      <StudentForm customFields={customFields} />
    </div>
  );
}
