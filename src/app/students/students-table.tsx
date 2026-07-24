"use client";
import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Search, Loader2, SlidersHorizontal, Plus, X, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NavButton } from "@/components/ui/nav-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

type HomepageField = { id: string; key: string; label: string; field_type: string };

type SearchableField = {
  id: string;
  key: string;
  label: string;
  field_type: string;
  options_json: unknown;
};

type StudentRow = {
  id: string;
  name: string;
  created_at: Date;
  values: Record<
    string,
    {
      value_text?: string | null;
      value_number?: number | null;
      value_decimal?: unknown;
      value_boolean?: boolean | null;
      value_date?: Date | null;
      value_datetime?: Date | null;
      value_json?: unknown;
      document_id?: string | null;
      field: { key: string; label: string; field_type: string };
    }
  >;
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

export function StudentsTable({
  data,
  totalEnrolledCount,
  homepageFields,
  searchableFields,
}: {
  data: StudentRow[];
  totalEnrolledCount: number;
  homepageFields: HomepageField[];
  searchableFields: SearchableField[];
}) {
  const router = useRouter();
  const [loadingStudentId, setLoadingStudentId] = React.useState<string | null>(null);
  const [, startTransition] = React.useTransition();
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [filters, setFilters] = React.useState<Record<string, string>>({});
  const [isFilterDialogOpen, setIsFilterDialogOpen] = React.useState(false);
  const PAGE_SIZE = 15;

  const activeFilters = React.useMemo(() => {
    return Object.entries(filters).filter(([, val]) => val && val.trim() !== "");
  }, [filters]);

  const activeFilterCount = activeFilters.length;

  const filtered = React.useMemo(() => {
    return data.filter((s) => {
      // 1. Search by name
      if (query && !s.name.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      // 2. Search by custom field filters
      for (const [key, filterVal] of activeFilters) {
        const studentValObj = s.values[key];
        const valStr = renderValue(studentValObj).toLowerCase();
        if (!valStr.includes(filterVal.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [data, query, activeFilters]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handleCardClick = (e: React.MouseEvent, id: string, href: string) => {
    e.preventDefault();
    setLoadingStudentId(id);
    startTransition(() => {
      router.push(href);
    });
  };

  const handleFilterChange = (key: string, val: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (!val || val === "ALL_OPTIONS") {
        delete next[key];
      } else {
        next[key] = val;
      }
      return next;
    });
    setPage(0);
  };

  const clearAllFilters = () => {
    setFilters({});
    setPage(0);
  };

  return (
    <div>
      {/* Page Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold leading-tight">Students</h1>
          <p className="text-xs text-muted-foreground">{totalEnrolledCount} enrolled</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters Button (before Add button) */}
          <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <SlidersHorizontal className="h-4 w-4 mr-1.5 shrink-0" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="default"
                    className="ml-1.5 px-1.5 py-0.5 text-[10px] h-4 min-w-[18px] flex items-center justify-center rounded-full"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between text-base font-bold">
                  Filter Students
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Reset
                    </Button>
                  )}
                </DialogTitle>
              </DialogHeader>

              {searchableFields.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No searchable custom fields defined yet. Go to Custom Fields and check &quot;Filterable in Students Page&quot;.
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  {searchableFields.map((field) => {
                    const options = (field.options_json ?? []) as string[];
                    const currentVal = filters[field.key] ?? "";

                    return (
                      <div key={field.id} className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {field.label}
                        </Label>

                        {field.field_type === "BOOLEAN" ? (
                          <Select
                            value={currentVal || "ALL_OPTIONS"}
                            onValueChange={(val) => handleFilterChange(field.key, val)}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL_OPTIONS">All</SelectItem>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : options.length > 0 ? (
                          <Select
                            value={currentVal || "ALL_OPTIONS"}
                            onValueChange={(val) => handleFilterChange(field.key, val)}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder={`All ${field.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL_OPTIONS">All</SelectItem>
                              {options.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder={`Filter by ${field.label}...`}
                            value={currentVal}
                            onChange={(e) => handleFilterChange(field.key, e.target.value)}
                            className="h-10"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
                <DialogClose asChild>
                  <Button type="button" className="w-full">
                    Done
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Button */}
          <NavButton href="/students/new">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </NavButton>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-4 py-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            className="pl-9 h-11"
          />
        </div>

        {/* Active Filter Badges */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-muted-foreground font-medium mr-1">Active Filters:</span>
            {activeFilters.map(([key, val]) => {
              const field = searchableFields.find((f) => f.key === key);
              const label = field ? field.label : key;
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="text-xs py-1 px-2.5 flex items-center gap-1 bg-accent hover:bg-accent/80"
                >
                  <span className="font-normal text-muted-foreground">{label}:</span>
                  <span className="font-semibold">{val}</span>
                  <button
                    type="button"
                    onClick={() => handleFilterChange(key, "")}
                    className="ml-1 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label={`Remove filter ${label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Students List */}
        {slice.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm space-y-2">
            <p>No students found matching your filters.</p>
            {(query || activeFilterCount > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  clearAllFilters();
                }}
              >
                Clear Search &amp; Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {slice.map((student) => {
              const isLoading = loadingStudentId === student.id;
              const href = `/students/${student.id}`;

              return (
                <Link
                  key={student.id}
                  href={href}
                  onClick={(e) => handleCardClick(e, student.id, href)}
                  className="block"
                >
                  <Card
                    className={`mb-3 overflow-hidden active:scale-[0.99] transition-transform ${
                      isLoading ? "border-primary/50 bg-primary/5" : ""
                    }`}
                  >
                    <CardContent className="p-4 relative">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm truncate">{student.name}</p>
                        {isLoading && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                        )}
                      </div>
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
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {pages} ({filtered.length} total)
            </p>
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
    </div>
  );
}
