"use client";
import React from "react";
import RootMasterAppShell from "../page";
import { useNavigationStore } from "@/lib/store/use-navigation-store";

export default function CustomFieldsRoutePage() {
  React.useEffect(() => {
    useNavigationStore.setState({ activeView: "custom-fields" });
  }, []);

  return <RootMasterAppShell />;
}
