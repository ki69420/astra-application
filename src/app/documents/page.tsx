import { prisma } from "@/lib/prisma";
import { DocumentsList } from "./documents-list";

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    where: { deleted_at: null },
    orderBy: { uploaded_at: "desc" },
    take: 100,
  });

  return <DocumentsList initialDocuments={documents} />;
}
