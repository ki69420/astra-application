"use client";
import React from "react";
import { useParams } from "next/navigation";
import { EditStudentView } from "./edit-student-view";

export default function EditStudentPage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  return <EditStudentView studentId={id} />;
}
