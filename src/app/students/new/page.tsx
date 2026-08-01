"use client";
import React from "react";
import RootMasterAppShell from "@/app/page";
import { useNavigationStore } from "@/lib/store/use-navigation-store";

export default function NewStudentRoutePage() {
  React.useEffect(() => {
    useNavigationStore.setState({ activeView: "student-new" });
  }, []);

  return <RootMasterAppShell />;
}
