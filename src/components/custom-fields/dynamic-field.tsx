"use client";
import * as React from "react";
import { Controller, type Control } from "react-hook-form";
import type { CustomFieldDefinition } from "@prisma/client";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

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

export function DynamicField({ field, control, error }: DynamicFieldProps) {
  const options = (field.options_json ?? []) as string[];

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.key}>
        {field.label}
      </Label>

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
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={field.key}
                    checked={!!f.value}
                    onCheckedChange={f.onChange}
                  />
                  <Label htmlFor={field.key} className="font-normal">
                    {field.label}
                  </Label>
                </div>
              );

            case "CHECKBOX":
              return (
                <div className="space-y-2">
                  {options.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <Checkbox
                        id={`${field.key}-${opt}`}
                        checked={
                          Array.isArray(f.value) && f.value.includes(opt)
                        }
                        onCheckedChange={(checked) => {
                          const current: string[] = Array.isArray(f.value)
                            ? f.value
                            : [];
                          f.onChange(
                            checked
                              ? [...current, opt]
                              : current.filter((v) => v !== opt),
                          );
                        }}
                      />
                      <Label
                        htmlFor={`${field.key}-${opt}`}
                        className="font-normal"
                      >
                        {opt}
                      </Label>
                    </div>
                  ))}
                </div>
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
                <RadioGroup onValueChange={f.onChange} value={f.value ?? ""}>
                  {options.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`${field.key}-${opt}`} />
                      <Label
                        htmlFor={`${field.key}-${opt}`}
                        className="font-normal"
                      >
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
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
