import type { CustomFieldDefinition, FieldType } from "@prisma/client";

type ValidationJson = {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
};

export type FieldErrors = Record<string, string>;

export function validateDynamicFields(
  fields: CustomFieldDefinition[],
  data: Record<string, unknown>,
): FieldErrors {
  const errors: FieldErrors = {};

  for (const field of fields) {
    if (!field.is_active) continue;

    const raw = data[field.key];
    const isEmpty = raw === undefined || raw === null || raw === "";

    if (isEmpty) {
      continue;
    }

    if (isEmpty) continue;

    const v = {} as ValidationJson;
    const options = (field.options_json ?? []) as string[];
    const type = field.field_type as FieldType;

    switch (type) {
      case "TEXT":
      case "TEXTAREA": {
        const s = String(raw);
        if (v.minLength && s.length < v.minLength)
          errors[field.key] = `Minimum ${v.minLength} characters`;
        else if (v.maxLength && s.length > v.maxLength)
          errors[field.key] = `Maximum ${v.maxLength} characters`;
        else if (v.pattern && !new RegExp(v.pattern).test(s))
          errors[field.key] = "Invalid format";
        break;
      }
      case "EMAIL":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(raw)))
          errors[field.key] = "Invalid email address";
        break;
      case "PHONE":
        if (!/^\+?[\d\s\-()]{7,15}$/.test(String(raw)))
          errors[field.key] = "Invalid phone number";
        break;
      case "URL":
        try {
          new URL(String(raw));
        } catch {
          errors[field.key] = "Invalid URL";
        }
        break;
      case "NUMBER": {
        const n = Number(raw);
        if (!Number.isInteger(n)) errors[field.key] = "Must be a whole number";
        else if (v.min !== undefined && n < v.min)
          errors[field.key] = `Minimum value is ${v.min}`;
        else if (v.max !== undefined && n > v.max)
          errors[field.key] = `Maximum value is ${v.max}`;
        break;
      }
      case "DECIMAL": {
        const n = Number(raw);
        if (isNaN(n)) errors[field.key] = "Must be a number";
        else if (v.min !== undefined && n < v.min)
          errors[field.key] = `Minimum value is ${v.min}`;
        else if (v.max !== undefined && n > v.max)
          errors[field.key] = `Maximum value is ${v.max}`;
        break;
      }
      case "SELECT":
      case "RADIO":
        if (options.length && !options.includes(String(raw)))
          errors[field.key] = "Invalid option selected";
        break;
      case "MULTI_SELECT":
      case "CHECKBOX": {
        const arr = Array.isArray(raw) ? raw : [raw];
        if (options.length && arr.some((v) => !options.includes(String(v))))
          errors[field.key] = "One or more invalid options";
        break;
      }
      case "DATE":
      case "DATETIME":
      case "TIME":
        if (isNaN(new Date(String(raw)).getTime()))
          errors[field.key] = "Invalid date";
        break;
    }
  }

  return errors;
}
