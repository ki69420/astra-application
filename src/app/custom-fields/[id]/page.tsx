"use client";
import React from "react";
import { useParams } from "next/navigation";
import RootMasterAppShell from "@/app/page";
import { useNavigationStore } from "@/lib/store/use-navigation-store";

export default function EditCustomFieldRoutePage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  React.useEffect(() => {
    if (id) {
      useNavigationStore.setState({ activeView: "custom-field-edit", activeFieldId: id });
    }
  }, [id]);

  return <RootMasterAppShell />;
}
