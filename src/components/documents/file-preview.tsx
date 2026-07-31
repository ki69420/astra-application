"use client";
import * as React from "react";
import { Eye, Download, FileText, Image as ImageIcon, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PdfViewer } from "./pdf-viewer";
import { getCachedDocumentBlob, setCachedDocumentBlob } from "@/lib/document-cache";

interface FilePreviewProps {
  documentId: string;
  fileName?: string;
  isImage?: boolean;
}

export function FilePreview({ documentId, fileName = "Document", isImage = false }: FilePreviewProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeUrl, setActiveUrl] = React.useState<string>(`/api/documents/${documentId}/view`);
  const [cachedBlob, setCachedBlob] = React.useState<Blob | null>(null);

  const downloadUrl = `/api/documents/${documentId}/download`;

  React.useEffect(() => {
    let isMounted = true;
    let createdUrl: string | null = null;

    async function loadCachedFile() {
      if (!documentId) return;

      // 1. Check IndexedDB device storage first
      const localBlob = await getCachedDocumentBlob(documentId);
      if (localBlob && isMounted) {
        setCachedBlob(localBlob);
        createdUrl = URL.createObjectURL(localBlob);
        setActiveUrl(createdUrl);
        return;
      }

      // 2. Fetch from server and store into IndexedDB
      try {
        const res = await fetch(`/api/documents/${documentId}/view`);
        if (!res.ok) return;
        const freshBlob = await res.blob();
        if (!isMounted) return;

        await setCachedDocumentBlob(documentId, freshBlob);
        setCachedBlob(freshBlob);
        createdUrl = URL.createObjectURL(freshBlob);
        setActiveUrl(createdUrl);
      } catch {
        // Fallback to default endpoint if offline fetch fails
      }
    }

    loadCachedFile();

    return () => {
      isMounted = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [documentId]);

  const handleShare = async () => {
    try {
      let blob = cachedBlob;
      if (!blob) {
        const res = await fetch(downloadUrl);
        if (!res.ok) return;
        blob = await res.blob();
        setCachedDocumentBlob(documentId, blob);
      }

      const mimeType = isImage ? (blob.type || "image/jpeg") : (blob.type || "application/pdf");
      let finalFileName = fileName;
      if (!finalFileName.includes(".")) {
        finalFileName += isImage ? ".jpg" : ".pdf";
      }

      const file = new File([blob], finalFileName, { type: mimeType });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: finalFileName });
      }
    } catch {
      // Ignored if user cancels share
    }
  };

  const canNativeShare =
    typeof navigator !== "undefined" &&
    !!navigator.canShare &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div className="flex items-center justify-between w-full gap-2 flex-wrap sm:flex-nowrap">
      {/* Left Container: Thumbnail + Preview Button */}
      <div className="flex items-center gap-2 min-w-0">
        {isImage && (
          <div
            onClick={() => setIsOpen(true)}
            className="relative h-12 w-12 rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity shrink-0 group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeUrl}
              alt={fileName}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Eye className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        )}

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium">
              {isImage ? (
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-primary" />
              )}
              Preview {isImage ? "Image" : "PDF"}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-3xl w-[95vw] h-[85vh] flex flex-col p-4">
            <DialogHeader className="flex flex-row items-center justify-between gap-2 border-b pb-3">
              <DialogTitle className="text-sm font-semibold truncate flex items-center gap-2 min-w-0">
                <Eye className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{fileName}</span>
              </DialogTitle>
              <div className="flex items-center gap-2 mr-6 shrink-0">
                {/* <Button variant="outline" size="sm" className="h-8 text-xs gap-1" asChild>
                  <a href={activeUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in Tab
                  </a>
                </Button> */}
                {canNativeShare && (
                  <Button variant="outline" size="sm" onClick={handleShare} className="h-8 text-xs gap-1">
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </Button>
                )}
                <Button size="sm" className="h-8 text-xs gap-1" asChild>
                  <a href={downloadUrl} download={fileName} target="_self">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 w-full h-full min-h-0 bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center p-2 relative">
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeUrl}
                  alt={fileName}
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : (
                <PdfViewer url={activeUrl} />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Right Container: Download Action */}
      <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0" asChild>
        <a href={downloadUrl} download={fileName} target="_self">
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      </Button>
    </div>
  );
}
