import { Prisma } from "@prisma/client";
import type { FieldType } from "@prisma/client";

type TypedValuePayload = {
  value_text?: string | null;
  value_number?: number | null;
  value_decimal?: number | null;
  value_boolean?: boolean | null;
  value_date?: Date | null;
  value_datetime?: Date | null;
  value_json?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
  document_id?: string | null;
};

export function hasMeaningfulValue(payload: TypedValuePayload) {
  return Object.values(payload).some(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== Prisma.JsonNull &&
      value !== "",
  );
}

export function resolveTypedValue(
  fieldType: FieldType,
  raw: unknown,
): TypedValuePayload {
  const empty: TypedValuePayload = {
    value_text: null,
    value_number: null,
    value_decimal: null,
    value_boolean: null,
    value_date: null,
    value_datetime: null,
    value_json: Prisma.JsonNull,
    document_id: null,
  };

  if (raw === undefined || raw === null || raw === "") return empty;

  switch (fieldType) {
    case "TEXT":
    case "TEXTAREA":
    case "EMAIL":
    case "PHONE":
    case "URL":
    case "SELECT":
    case "RADIO":
      return { ...empty, value_text: String(raw) };
    case "NUMBER":
      return { ...empty, value_number: parseInt(String(raw), 10) };
    case "DECIMAL":
      return { ...empty, value_decimal: parseFloat(String(raw)) };
    case "BOOLEAN":
    case "CHECKBOX":
      return { ...empty, value_boolean: Boolean(raw) };
    case "DATE":
      return { ...empty, value_date: new Date(String(raw)) };
    case "DATETIME":
    case "TIME":
      return { ...empty, value_datetime: new Date(String(raw)) };
    case "MULTI_SELECT":
      return {
        ...empty,
        value_json: (Array.isArray(raw) ? raw : [raw]) as Prisma.InputJsonValue,
      };
    case "FILE":
    case "IMAGE":
      if (typeof raw === "string" && raw.trim()) {
        return { ...empty, document_id: raw.trim() };
      }
      return empty;
    default:
      return { ...empty, value_text: String(raw) };
  }
}
