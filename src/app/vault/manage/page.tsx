"use client";
import React from "react";
import { VaultManageView } from "../manage-view";

export default function VaultManagePage() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return <VaultManageView />;
}

