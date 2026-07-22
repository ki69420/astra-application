import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 30;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  const documents = await prisma.document.findMany({
    where: { deleted_at: null },
    orderBy: { uploaded_at: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3">
        <h1 className="text-lg font-bold leading-tight">Documents</h1>
        <p className="text-xs text-muted-foreground">{documents.length} files stored</p>
      </header>

      <div className="px-4 py-4">
        {documents.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No documents uploaded yet.</div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.original_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs font-mono">
                        {doc.extension.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatBytes(doc.size)}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(doc.uploaded_at), "dd MMM yyyy")}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild>
                    <a href={`/api/documents/${doc.id}/download`} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
