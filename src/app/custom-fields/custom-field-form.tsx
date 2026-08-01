"use client";
import * as React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Plus, Trash2, Loader2, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useAppStore } from "@/lib/store/use-app-store";
import { useNavigationStore } from "@/lib/store/use-navigation-store";
import { enqueueAction } from "@/lib/sync/offline-queue";

const FIELD_TYPES = [
  "TEXT", "TEXTAREA", "NUMBER", "DECIMAL", "DATE", "TIME", "DATETIME",
  "BOOLEAN", "EMAIL", "PHONE", "URL", "RADIO", "CHECKBOX", "FILE", "IMAGE",
] as const;

const OPTION_TYPES = new Set(["SELECT", "MULTI_SELECT", "RADIO", "CHECKBOX"]);

type FieldType = (typeof FIELD_TYPES)[number];

type FormData = {
  key: string;
  label: string;
  field_type: FieldType;
  show_in_homepage: boolean;
  is_searchable: boolean;
  options: { value: string }[];
};

interface CustomFieldFormProps {
  defaultValues?: Partial<FormData>;
  fieldId?: string;
}

export function CustomFieldForm({ defaultValues, fieldId }: CustomFieldFormProps) {
  const isInitialized = useAppStore((s) => s.isInitialized);
  const optimisticAddCustomField = useAppStore((s) => s.optimisticAddCustomField);
  const optimisticUpdateCustomField = useAppStore((s) => s.optimisticUpdateCustomField);
  const checkAndSyncBackground = useAppStore((s) => s.checkAndSyncBackground);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: { show_in_homepage: false, is_searchable: false, options: [], ...defaultValues },
  });

  React.useEffect(() => {
    if (defaultValues) {
      reset({ show_in_homepage: false, is_searchable: false, options: [], ...defaultValues });
    }
  }, [defaultValues, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const fieldType = watch("field_type");
  const showOptions = OPTION_TYPES.has(fieldType);

  async function onSubmit(data: FormData) {
    const isFileOrImage = data.field_type === "FILE" || data.field_type === "IMAGE";
    const show_in_homepage = isFileOrImage ? false : Boolean(data.show_in_homepage);
    const is_searchable = isFileOrImage ? false : Boolean(data.is_searchable);

    const options_json = data.options.map((o) => o.value).filter(Boolean);
    const key = data.key?.trim() || data.label.toLowerCase().replace(/\s+/g, "_");

    const optimisticField = {
      id: fieldId || `temp-${Date.now()}`,
      key,
      label: data.label,
      field_type: data.field_type,
      show_in_homepage,
      is_searchable,
      display_order: 999,
      options_json: options_json.length ? options_json : undefined,
    };

    // 1. INSTANT Optimistic UI Update & Redirect (0ms latency!)
    if (fieldId) {
      optimisticUpdateCustomField(fieldId, optimisticField);
    } else {
      optimisticAddCustomField(optimisticField);
    }

    useNavigationStore.getState().navigateTo("custom-fields");
    toast({ title: fieldId ? "Field updated" : "Field created" });

    // 2. BACKGROUND Async save to Database or Offline Queue
    try {
      const payload = {
        key: data.key?.trim() || undefined,
        label: data.label,
        field_type: data.field_type,
        options_json: options_json.length ? options_json : undefined,
        show_in_homepage,
        is_searchable,
      };

      const url = fieldId ? `/api/custom-fields/${fieldId}` : "/api/custom-fields";
      const method = fieldId ? "PATCH" : "POST";

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await enqueueAction(fieldId ? "UPDATE_CUSTOM_FIELD" : "CREATE_CUSTOM_FIELD", url, method, payload);
      } else {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          await enqueueAction(fieldId ? "UPDATE_CUSTOM_FIELD" : "CREATE_CUSTOM_FIELD", url, method, payload);
        }
      }

      checkAndSyncBackground();
    } catch {
      const url = fieldId ? `/api/custom-fields/${fieldId}` : "/api/custom-fields";
      const method = fieldId ? "PATCH" : "POST";
      await enqueueAction(fieldId ? "UPDATE_CUSTOM_FIELD" : "CREATE_CUSTOM_FIELD", url, method, data);
    }
  }

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          type="button"
          onClick={() => useNavigationStore.getState().goBack()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-base font-bold">{fieldId ? "Edit Custom Field" : "New Custom Field"}</h1>
          <p className="text-xs text-muted-foreground">{fieldId ? "Update field configuration" : "Define a new custom attribute"}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 py-4">
        {!isInitialized && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/60 border text-xs text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
            <span>If any field settings are missing, please wait a moment — initial data is downloading in the background.</span>
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Field Definition</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="label">
                Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="label"
                placeholder="e.g. Phone Number"
                className="h-11"
                {...register("label", { required: "Label is required" })}
              />
              {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>
                Field Type <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="field_type"
                control={control}
                rules={{ required: "Field type is required" }}
                render={({ field: f }) => (
                  <Select onValueChange={f.onChange} value={f.value} disabled={!!fieldId}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.field_type && <p className="text-xs text-destructive">{errors.field_type.message}</p>}
            </div>

            {fieldType !== "FILE" && fieldType !== "IMAGE" && (
              <>
                <div className="flex items-center gap-3 py-1">
                  <Controller
                    name="show_in_homepage"
                    control={control}
                    render={({ field: f }) => (
                      <Checkbox
                        id="show_in_homepage"
                        checked={!!f.value}
                        onCheckedChange={f.onChange}
                        className="h-5 w-5"
                      />
                    )}
                  />
                  <Label htmlFor="show_in_homepage" className="text-sm leading-snug cursor-pointer">
                    Show on Student List Screen
                  </Label>
                </div>

                <div className="flex items-center gap-3 py-1">
                  <Controller
                    name="is_searchable"
                    control={control}
                    render={({ field: f }) => (
                      <Checkbox
                        id="is_searchable"
                        checked={!!f.value}
                        onCheckedChange={f.onChange}
                        className="h-5 w-5"
                      />
                    )}
                  />
                  <Label htmlFor="is_searchable" className="text-sm leading-snug cursor-pointer">
                    Enable Search &amp; Filter
                  </Label>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {showOptions && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((f, i) => (
                <div key={f.id} className="flex gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    className="h-11 flex-1"
                    {...register(`options.${i}.value`, { required: "Option cannot be empty" })}
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={() => remove(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full h-10"
                onClick={() => append({ value: "" })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1 h-11">
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
            ) : fieldId ? "Update Field" : "Create Field"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 px-6"
            onClick={() => useNavigationStore.getState().navigateTo("custom-fields")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
