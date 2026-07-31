"use client";
import React from "react";
import { VaultView } from "./vault-view";

export default function VaultPage() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return <VaultView />;
}

