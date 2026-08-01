"use client";
import React from "react";
import RootMasterAppShell from "@/app/page";
import { useNavigationStore } from "@/lib/store/use-navigation-store";

export default function NewCustomFieldRoutePage() {
  React.useEffect(() => {
    useNavigationStore.setState({ activeView: "custom-field-new" });
  }, []);

  return <RootMasterAppShell />;
}
