"use client";
import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { Input } from "@/components/ui/input";

interface DatePickerInputProps {
  id?: string;
  value?: string | null;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}

function parseFlexibleDate(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 8) return null;

  const formats = [
    "dd-MM-yyyy",
    "dd/MM/yyyy",
    "yyyy-MM-dd",
    "MM/dd/yyyy",
    "yyyy/MM/dd",
    "dd-MM-yy",
    "dd/MM/yy",
    "ddMMyyyy",
  ];

  for (const fmt of formats) {
    try {
      const d = parse(trimmed, fmt, new Date());
      if (isValid(d) && d.getFullYear() >= 1900 && d.getFullYear() <= 2100) {
        return d;
      }
    } catch {
      // ignore parse errors
    }
  }

  return null;
}

export function DatePickerInput({
  id,
  value,
  onChange,
  placeholder = "DD-MM-YYYY (e.g. 24-07-2026)",
}: DatePickerInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = React.useState<string>(() => {
    if (!value) return "";
    const d = new Date(value);
    return isValid(d) ? format(d, "dd-MM-yyyy") : "";
  });

  // Sync internal text ONLY when the input is NOT focused by the user
  React.useEffect(() => {
    if (document.activeElement === inputRef.current) return;

    if (!value) {
      setInputText("");
      return;
    }
    const d = new Date(value);
    if (isValid(d)) {
      setInputText(format(d, "dd-MM-yyyy"));
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (!val.trim()) {
      onChange(undefined);
      return;
    }

    const parsed = parseFlexibleDate(val);
    if (parsed) {
      onChange(parsed.toISOString());
    }
  };

  const handleInputBlur = () => {
    if (!inputText.trim()) {
      onChange(undefined);
      return;
    }
    const parsed = parseFlexibleDate(inputText);
    if (parsed) {
      setInputText(format(parsed, "dd-MM-yyyy"));
      onChange(parsed.toISOString());
    }
  };

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      placeholder={placeholder}
      value={inputText}
      onChange={handleInputChange}
      onBlur={handleInputBlur}
      className="h-11"
    />
  );
}
