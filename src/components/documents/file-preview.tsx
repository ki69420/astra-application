"use client";
import * as React from "react";
import { Eye, Download, FileText, Image as ImageIcon, Share2, Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PdfViewer } from "./pdf-viewer";
import { getCachedOrFetchBlob, triggerLocalDownload } from "@/lib/documents/document-manager";

interface FilePreviewProps {
  documentId: string;
  fileName?: string;
  isImage?: boolean;
}

export function FilePreview({ documentId, fileName = "Document", isImage = false }: FilePreviewProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeUrl, setActiveUrl] = React.useState<string>("");
  const [cachedBlob, setCachedBlob] = React.useState<Blob | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    let createdUrl: string | null = null;

    async function loadCachedFile() {
      if (!documentId) return;
      setLoading(true);

      const blob = await getCachedOrFetchBlob(documentId);
      if (!isMounted) return;

      if (blob && blob.size > 0) {
        setCachedBlob(blob);
        createdUrl = URL.createObjectURL(blob);
        setActiveUrl(createdUrl);
      }
      setLoading(false);
    }

    loadCachedFile();

    return () => {
      isMounted = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [documentId]);

  const handleDownload = async () => {
    let blob = cachedBlob;
    if (!blob) {
      blob = await getCachedOrFetchBlob(documentId);
      if (blob) setCachedBlob(blob);
    }

    if (blob) {
      triggerLocalDownload(blob, fileName);
    } else {
      window.open(`/api/documents/${documentId}/download`, "_self");
    }
  };

  const handleShare = async () => {
    try {
      let blob = cachedBlob;
      if (!blob) {
        blob = await getCachedOrFetchBlob(documentId);
        if (blob) setCachedBlob(blob);
      }
      if (!blob) return;

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
            className="relative h-12 w-12 rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity shrink-0 group flex items-center justify-center"
          >
            {activeUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={activeUrl}
                alt={fileName}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
            )}
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
                {canNativeShare && (
                  <Button variant="outline" size="sm" onClick={handleShare} className="h-8 text-xs gap-1">
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </Button>
                )}
                <Button size="sm" onClick={handleDownload} className="h-8 text-xs gap-1">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </DialogHeader>

            <div className="flex-1 w-full h-full min-h-0 bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center p-2 relative">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs">Loading document...</span>
                </div>
              ) : activeUrl ? (
                isImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={activeUrl}
                    alt={fileName}
                    className="max-h-full max-w-full object-contain rounded"
                  />
                ) : (
                  <PdfViewer url={activeUrl} />
                )
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-center p-6 text-muted-foreground">
                  <WifiOff className="h-8 w-8 text-muted-foreground/60" />
                  <p className="text-sm font-semibold">Document not cached for offline view</p>
                  <p className="text-xs">Connect to the internet to load this document for offline storage.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Right Container: Download Action */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0"
      >
        <Download className="h-3.5 w-3.5" />
        Download
      </Button>
    </div>
  );
}
