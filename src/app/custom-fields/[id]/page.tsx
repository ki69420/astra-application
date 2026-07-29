import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditCustomFieldView } from "./edit-custom-field-view";

export default async function EditCustomFieldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const field = await prisma.customFieldDefinition.findFirst({ where: { id } });

  if (!field) notFound();

  return <EditCustomFieldView fieldId={id} initialField={field} />;
}
