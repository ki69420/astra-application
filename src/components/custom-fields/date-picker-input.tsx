"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatToSlashDate, parseSlashDateToUTCNoonISO } from "@/lib/date-utils";

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

export function DatePickerInput({
  id,
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
}: DatePickerInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = React.useState<string>(() => {
    return formatToSlashDate(value);
  });

  // Sync internal text ONLY when the input is NOT focused by the user
  React.useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    setInputText(formatToSlashDate(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatDigitsToSlashDate(rawValue);
    setInputText(formatted);

    if (!formatted.trim()) {
      onChange(undefined);
      return;
    }

    const isoString = parseSlashDateToUTCNoonISO(formatted);
    if (isoString) {
      onChange(isoString);
    } else {
      onChange(undefined);
    }
  };

  const handleInputBlur = () => {
    if (!inputText.trim()) {
      onChange(undefined);
      return;
    }
    const isoString = parseSlashDateToUTCNoonISO(inputText);
    if (isoString) {
      setInputText(formatToSlashDate(isoString));
      onChange(isoString);
    }
  };

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={inputText}
      onChange={handleInputChange}
      onBlur={handleInputBlur}
      className="h-11 font-mono tracking-wide"
    />
  );
}
