"use client";
import React from "react";
import { useParams } from "next/navigation";
import { EditCustomFieldView } from "./edit-custom-field-view";

export default function EditCustomFieldPage() {
  const params = useParams();
  const id = (params?.id as string) || "";

  return <EditCustomFieldView fieldId={id} />;
}
