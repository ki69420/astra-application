"use client";
import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomFieldForm } from "../custom-field-form";
import { useAppStore } from "@/lib/store/use-app-store";

type InitialField = {
  id: string;
  key: string;
  label: string;
  field_type: string;
  show_in_homepage: boolean;
  is_searchable: boolean;
  options_json: unknown;
};

export function EditCustomFieldView({
  fieldId,
  initialField,
}: {
  fieldId: string;
  initialField: InitialField;
}) {
  const customFields = useAppStore((s) => s.customFields);
  const isInitialized = useAppStore((s) => s.isInitialized);

  const storeField = isInitialized
    ? customFields.find((f) => f.id === fieldId)
    : null;

  const field = storeField ?? initialField;

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href="/custom-fields">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-base font-bold">Edit Field</h1>
          <p className="text-xs text-muted-foreground truncate">{field.label}</p>
        </div>
      </header>
      <CustomFieldForm
        fieldId={field.id}
        defaultValues={{
          key: field.key,
          label: field.label,
          field_type: field.field_type as
            | "TEXT"
            | "TEXTAREA"
            | "NUMBER"
            | "DECIMAL"
            | "DATE"
            | "TIME"
            | "BOOLEAN"
            | "PHONE"
            | "RADIO"
            | "CHECKBOX"
            | "FILE"
            | "IMAGE",
          show_in_homepage: field.show_in_homepage,
          is_searchable: field.is_searchable,
          options:
            (field.options_json as string[] | null | undefined)?.map(
              (value) => ({ value }),
            ) ?? [],
        }}
      />
    </div>
  );
}
