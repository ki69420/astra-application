"use client";
import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface DatePickerInputProps {
  id?: string;
  value?: string | null;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}

function parseFlexibleDate(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const direct = new Date(trimmed);
  if (!isNaN(direct.getTime()) && direct.getFullYear() > 1900 && direct.getFullYear() < 2100) {
    return direct;
  }

  const formats = [
    "yyyy-MM-dd",
    "dd/MM/yyyy",
    "MM/dd/yyyy",
    "yyyy/MM/dd",
    "dd-MM-yyyy",
    "MM-dd-yyyy",
    "d MMMM yyyy",
    "MMM d yyyy",
  ];

  for (const fmt of formats) {
    try {
      const d = parse(trimmed, fmt, new Date());
      if (isValid(d) && d.getFullYear() > 1900 && d.getFullYear() < 2100) {
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
  placeholder = "YYYY-MM-DD or pick date",
}: DatePickerInputProps) {
  const [inputText, setInputText] = React.useState<string>(() => {
    if (!value) return "";
    const d = new Date(value);
    return isValid(d) ? format(d, "yyyy-MM-dd") : "";
  });
  const [isOpen, setIsOpen] = React.useState(false);

  // Sync internal input string when external value changes
  React.useEffect(() => {
    if (!value) {
      setInputText("");
      return;
    }
    const d = new Date(value);
    if (isValid(d)) {
      setInputText(format(d, "yyyy-MM-dd"));
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
      setInputText(format(parsed, "yyyy-MM-dd"));
      onChange(parsed.toISOString());
    }
  };

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const d = new Date(value);
    return isValid(d) ? d : undefined;
  }, [value]);

  return (
    <div className="relative flex items-center w-full">
      <Input
        id={id}
        type="text"
        placeholder={placeholder}
        value={inputText}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="pr-10 h-11"
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 bottom-0 h-full px-3 text-muted-foreground hover:text-foreground"
            aria-label="Pick date from calendar"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                const iso = date.toISOString();
                setInputText(format(date, "yyyy-MM-dd"));
                onChange(iso);
              } else {
                setInputText("");
                onChange(undefined);
              }
              setIsOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
