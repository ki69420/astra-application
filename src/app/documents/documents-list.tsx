"use client";
import * as React from "react";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore, type DocumentRow } from "@/lib/store/use-app-store";
import { FilePreview } from "@/components/documents/file-preview";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsList({ initialDocuments }: { initialDocuments: DocumentRow[] }) {
  const storeDocuments = useAppStore((s) => s.documents);
  const storeDocumentsCount = useAppStore((s) => s.totalDocumentsCount);
  const isInitialized = useAppStore((s) => s.isInitialized);

  const displayDocuments =
    isInitialized && storeDocuments.length > 0
      ? (storeDocuments as DocumentRow[])
      : initialDocuments;

  const displayCount = isInitialized ? storeDocumentsCount : initialDocuments.length;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3">
        <h1 className="text-lg font-bold leading-tight">Documents</h1>
        <p className="text-xs text-muted-foreground">{displayCount} files stored</p>
      </header>

      <div className="px-4 py-4">
        {displayDocuments.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No documents uploaded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {displayDocuments.map((doc) => {
              const isImage = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(
                doc.extension?.toLowerCase() || ""
              );

              return (
                <Card key={doc.id} className="overflow-hidden">
                  <CardContent className="p-4 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.original_name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs font-mono">
                          {doc.extension.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(doc.size)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(doc.uploaded_at), "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>
                    <FilePreview
                      documentId={doc.id}
                      fileName={doc.original_name}
                      isImage={isImage}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
