"use client";
import React from "react";
import { useParams } from "next/navigation";
import { StudentDetailView } from "./student-detail-view";

export default function StudentDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return <StudentDetailView studentId={id} />;
}

