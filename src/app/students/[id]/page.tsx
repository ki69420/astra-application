"use client";
import React from "react";
import { useParams } from "next/navigation";
import { StudentDetailView } from "./student-detail-view";

export default function StudentDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  return <StudentDetailView studentId={id} />;
}
