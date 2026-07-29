import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StudentDetailView } from "./student-detail-view";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await prisma.student.findFirst({
    where: { id },
    include: {
      custom_field_values: {
        include: { field: true },
        orderBy: [
          { field: { display_order: "asc" } },
          { field: { label: "asc" } },
        ],
      },
    },
  });

  if (!student) notFound();

  return <StudentDetailView studentId={id} initialStudent={student} />;
}
