"use client";
import React from "react";
import RootMasterAppShell from "../page";
import { useNavigationStore } from "@/lib/store/use-navigation-store";

export default function VaultRoutePage() {
  React.useEffect(() => {
    useNavigationStore.setState({ activeView: "vault" });
  }, []);

  return <RootMasterAppShell />;
}
