"use client";
import React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
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
  initialField?: InitialField;
}) {
  const customFields = useAppStore((s) => s.customFields);
  const isInitialized = useAppStore((s) => s.isInitialized);

  const [fetchedField, setFetchedField] = React.useState<InitialField | null>(null);
  const [loading, setLoading] = React.useState(false);

  const storeField = isInitialized
    ? customFields.find((f) => f.id === fieldId)
    : null;

  const field = storeField ?? initialField ?? fetchedField;

  React.useEffect(() => {
    if (!field && fieldId) {
      setLoading(true);
      fetch(`/api/custom-fields/${fieldId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setFetchedField(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [field, fieldId]);

  if (!field) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link href="/custom-fields">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <span className="text-base font-bold">Edit Field</span>
        </header>
        <div className="px-4 py-16 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Downloading field settings</p>
            <p className="text-xs text-muted-foreground">Please wait a moment — data is syncing in the background.</p>
          </div>
        </div>
      </div>
    );
  }

  const fieldLabel = field.label;

  return (
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
  );
}
