"use client";
import * as React from "react";
import { Controller, type Control } from "react-hook-form";
import type { CustomFieldDefinition } from "@prisma/client";
import { ChevronDown, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DatePickerInput } from "@/components/custom-fields/date-picker-input";
import { cn } from "@/lib/utils";

interface DynamicFieldProps {
  field: CustomFieldDefinition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  error?: string;
}

function parseOptions(optionsJson: unknown): string[] {
  if (!optionsJson) return [];
  if (Array.isArray(optionsJson)) {
    return optionsJson.map((o) => String(o)).filter(Boolean);
  }
  if (typeof optionsJson === "string") {
    try {
      const parsed = JSON.parse(optionsJson);
      if (Array.isArray(parsed)) {
        return parsed.map((o) => String(o)).filter(Boolean);
      }
    } catch {
      return optionsJson.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function BooleanToggleField({
  value,
  onChange,
}: {
  value: boolean | null | undefined;
  onChange: (val: boolean | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center rounded-lg border bg-muted p-1 text-muted-foreground">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none",
            value === true
              ? "bg-primary text-primary-foreground shadow-sm"
              : "hover:text-foreground"
          )}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none",
            value === false
              ? "bg-destructive/90 text-destructive-foreground shadow-sm"
              : "hover:text-foreground"
          )}
        >
          No
        </button>
      </div>
      {value !== null && value !== undefined && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
        >
          Clear
        </Button>
      )}
    </div>
  );
}

function ExpandableRadioField({
  field,
  options,
  value,
  onChange,
}: {
  field: CustomFieldDefinition;
  options: string[];
  value: string | null | undefined;
  onChange: (val: string | null) => void;
}) {
  const selected = typeof value === "string" ? value : value ? String(value) : "";
  const [isOpen, setIsOpen] = React.useState(!selected);

  return (
    <div className="border rounded-lg overflow-hidden bg-card transition-all">
      <div
        className="flex items-center justify-between p-2.5 px-3 cursor-pointer hover:bg-accent/40 select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0 text-sm">
          <span className="font-medium">{field.label}:</span>
          {selected ? (
            <Badge variant="secondary" className="font-semibold text-xs truncate">
              {selected}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground italic">Not selected</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selected ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Deselect
            </Button>
          ) : null}
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}
          />
        </div>
      </div>

      {isOpen && (
        <div className="p-2 px-3 border-t bg-muted/20 space-y-0.5">
          {options.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">No options available</p>
          ) : (
            <RadioGroup
              value={selected}
              onValueChange={(val) => {
                if (val === selected) {
                  onChange(null);
                } else {
                  onChange(val);
                }
              }}
              className="gap-0.5"
            >
              {options.map((opt) => (
                <label
                  key={opt}
                  htmlFor={`${field.key}-${opt}`}
                  className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-accent/50 cursor-pointer select-none text-sm font-normal"
                >
                  <RadioGroupItem value={opt} id={`${field.key}-${opt}`} />
                  <span className="flex-1">{opt}</span>
                </label>
              ))}
            </RadioGroup>
          )}
        </div>
      )}
    </div>
  );
}

function ExpandableCheckboxField({
  field,
  options,
  value,
  onChange,
}: {
  field: CustomFieldDefinition;
  options: string[];
  value: string[] | string | null | undefined;
  onChange: (val: string[]) => void;
}) {
  const selected: string[] = React.useMemo(() => {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string" && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        return value.split(",").map((s) => s.trim()).filter(Boolean);
      }
      return [value];
    }
    return [];
  }, [value]);

  const [isOpen, setIsOpen] = React.useState(selected.length === 0);

  const handleToggleOption = (opt: string) => {
    const isChecked = selected.includes(opt);
    const next = isChecked
      ? selected.filter((v) => v !== opt)
      : [...selected, opt];
    onChange(next);
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card transition-all">
      <div
        className="flex items-center justify-between p-2.5 px-3 cursor-pointer hover:bg-accent/40 select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 min-w-0 text-sm flex-wrap">
          <span className="font-medium">{field.label}:</span>
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selected.map((val) => (
                <Badge key={val} variant="secondary" className="font-semibold text-xs">
                  {val}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">Not selected</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selected.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Deselect All
            </Button>
          ) : null}
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}
          />
        </div>
      </div>

      {isOpen && (
        <div className="p-2 px-3 border-t bg-muted/20 space-y-0.5">
          {options.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">No options available</p>
          ) : (
            options.map((opt) => {
              const isChecked = selected.includes(opt);
              return (
                <label
                  key={opt}
                  htmlFor={`${field.key}-${opt}`}
                  className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-accent/50 cursor-pointer select-none text-sm font-normal"
                >
                  <Checkbox
                    id={`${field.key}-${opt}`}
                    checked={isChecked}
                    onCheckedChange={() => handleToggleOption(opt)}
                  />
                  <span className="flex-1">{opt}</span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function DynamicField({ field, control, error }: DynamicFieldProps) {
  const options = parseOptions(field.options_json);

  return (
    <div className="space-y-1.5">
      {field.field_type !== "RADIO" && field.field_type !== "CHECKBOX" && (
        <Label htmlFor={field.key}>
          {field.label}
        </Label>
      )}

      <Controller
        name={field.key}
        control={control}
        render={({ field: f }) => {
          switch (field.field_type) {
            case "TEXT":
            case "EMAIL":
            case "PHONE":
            case "URL":
              return (
                <Input
                  id={field.key}
                  type={
                    field.field_type === "EMAIL"
                      ? "email"
                      : field.field_type === "URL"
                        ? "url"
                        : "text"
                  }
                  placeholder=""
                  {...f}
                  value={f.value ?? ""}
                />
              );

            case "TEXTAREA":
              return (
                <Textarea
                  id={field.key}
                  placeholder=""
                  {...f}
                  value={f.value ?? ""}
                />
              );

            case "NUMBER":
            case "DECIMAL":
              return (
                <Input
                  id={field.key}
                  type="number"
                  step={field.field_type === "DECIMAL" ? "0.01" : "1"}
                  placeholder=""
                  {...f}
                  value={f.value ?? ""}
                />
              );

            case "BOOLEAN":
              return (
                <BooleanToggleField
                  value={f.value as boolean | null | undefined}
                  onChange={f.onChange}
                />
              );

            case "CHECKBOX":
              return (
                <ExpandableCheckboxField
                  field={field}
                  options={options}
                  value={f.value as string[] | string | null | undefined}
                  onChange={f.onChange}
                />
              );

            case "SELECT":
              return (
                <Select onValueChange={f.onChange} value={f.value ?? ""}>
                  <SelectTrigger id={field.key}>
                    <SelectValue placeholder={`Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );

            case "MULTI_SELECT": {
              const selected: string[] = Array.isArray(f.value) ? f.value : [];
              return (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto min-h-9 flex-wrap gap-1"
                    >
                      {selected.length === 0 ? (
                        <span className="text-muted-foreground">
                          {`Select ${field.label}`}
                        </span>
                      ) : (
                        selected.map((v) => (
                          <Badge key={v} variant="secondary">
                            {v}
                          </Badge>
                        ))
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2">
                    {options.map((opt) => (
                      <div
                        key={opt}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer"
                        onClick={() => {
                          f.onChange(
                            selected.includes(opt)
                              ? selected.filter((v) => v !== opt)
                              : [...selected, opt],
                          );
                        }}
                      >
                        <Checkbox
                          checked={selected.includes(opt)}
                          onCheckedChange={() => {}}
                        />
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              );
            }

            case "RADIO":
              return (
                <ExpandableRadioField
                  field={field}
                  options={options}
                  value={f.value as string | null | undefined}
                  onChange={f.onChange}
                />
              );

            case "DATE":
            case "DATETIME":
            case "TIME":
              return (
                <DatePickerInput
                  id={field.key}
                  value={f.value}
                  onChange={f.onChange}
                />
              );

            case "FILE":
            case "IMAGE":
              return (
                <Input
                  id={field.key}
                  type="file"
                  accept={
                    field.field_type === "IMAGE"
                      ? "image/*"
                      : ".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  }
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) f.onChange(file);
                  }}
                />
              );

            default:
              return <Input id={field.key} {...f} value={f.value ?? ""} />;
          }
        }}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
