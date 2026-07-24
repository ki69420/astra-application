"use client";
import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type HomepageField = { id: string; key: string; label: string; field_type: string };

type StudentRow = {
  id: string;
  name: string;
  created_at: Date;
  values: Record<string, {
    value_text?: string | null;
    value_number?: number | null;
    value_decimal?: unknown;
    value_boolean?: boolean | null;
    value_date?: Date | null;
    value_datetime?: Date | null;
    value_json?: unknown;
    document_id?: string | null;
    field: { key: string; label: string; field_type: string };
  }>;
};

function renderValue(value: StudentRow["values"][string] | undefined) {
  if (!value) return "—";
  if (value.value_text != null) return value.value_text;
  if (value.value_number != null) return String(value.value_number);
  if (value.value_decimal != null) return String(value.value_decimal);
  if (value.value_boolean != null) return value.value_boolean ? "Yes" : "No";
  if (value.value_date != null) return format(new Date(value.value_date), "dd MMM yyyy");
  if (value.value_datetime != null) return format(new Date(value.value_datetime), "dd MMM yyyy HH:mm");
  if (value.value_json != null)
    return Array.isArray(value.value_json) ? value.value_json.join(", ") : String(value.value_json);
  if (value.document_id) return "Attached";
  return "—";
}

export function StudentsTable({ data, homepageFields }: { data: StudentRow[]; homepageFields: HomepageField[] }) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = 15;

  const filtered = React.useMemo(
    () => data.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())),
    [data, query]
  );

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          className="pl-9"
        />
      </div>

      {slice.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No students found.</div>
      ) : (
        <div className="space-y-2">
          {slice.map((student) => (
            <Link key={student.id} href={`/students/${student.id}`} className="block">
              <Card className="mb-3 overflow-hidden active:scale-[0.99] transition-transform">
                <CardContent className="p-4">
                  <p className="font-semibold text-sm truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enrolled {format(new Date(student.created_at), "dd MMM yyyy")}
                  </p>
                  {homepageFields.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {homepageFields.map((field) => {
                        const val = renderValue(student.values[field.key]);
                        if (val === "—") return null;
                        return (
                          <Badge key={field.key} variant="secondary" className="text-xs font-normal">
                            {field.label}: {val}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">Page {page + 1} of {pages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
              Prev
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pages - 1}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
