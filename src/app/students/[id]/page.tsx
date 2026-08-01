"use client";
import React from "react";
import { useParams } from "next/navigation";
import RootMasterAppShell from "@/app/page";
import { useNavigationStore } from "@/lib/store/use-navigation-store";

export default function StudentDetailRoutePage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  React.useEffect(() => {
    if (id) {
      useNavigationStore.setState({ activeView: "student-detail", activeStudentId: id });
    }
  }, [id]);

  return <RootMasterAppShell />;
}
