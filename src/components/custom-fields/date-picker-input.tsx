"use client";
import * as React from "react";
import { format, isValid } from "date-fns";
import { Input } from "@/components/ui/input";

interface DatePickerInputProps {
  id?: string;
  value?: string | null;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}

function formatDigitsToSlashDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";

  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseSlashDate(formatted: string): Date | null {
  const digits = formatted.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const year = parseInt(digits.slice(4, 8), 10);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > 2100) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  ) {
    return date;
  }

  return null;
}

export function DatePickerInput({
  id,
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
}: DatePickerInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = React.useState<string>(() => {
    if (!value) return "";
    const d = new Date(value);
    return isValid(d) ? format(d, "dd/MM/yyyy") : "";
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
      setInputText(format(d, "dd/MM/yyyy"));
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatDigitsToSlashDate(rawValue);
    setInputText(formatted);

    if (!formatted.trim()) {
      onChange(undefined);
      return;
    }

    const parsed = parseSlashDate(formatted);
    if (parsed) {
      onChange(parsed.toISOString());
    } else {
      onChange(undefined);
    }
  };

  const handleInputBlur = () => {
    if (!inputText.trim()) {
      onChange(undefined);
      return;
    }
    const parsed = parseSlashDate(inputText);
    if (parsed) {
      setInputText(format(parsed, "dd/MM/yyyy"));
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
      className="h-11 font-mono tracking-wide"
    />
  );
}
