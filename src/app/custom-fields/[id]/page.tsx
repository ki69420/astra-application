"use client";
import React from "react";
import { useParams } from "next/navigation";
import { EditCustomFieldView } from "./edit-custom-field-view";

export default function EditCustomFieldPage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return <EditCustomFieldView fieldId={id} />;
}

