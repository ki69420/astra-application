"use client";
import React from "react";
import { useParams } from "next/navigation";
import { EditStudentView } from "./edit-student-view";

export default function EditStudentPage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return <EditStudentView studentId={id} />;
}

