"use client";
import * as React from "react";
import { Eye, Download, FileText, Image as ImageIcon, ExternalLink, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PdfViewer } from "./pdf-viewer";

interface FilePreviewProps {
  documentId: string;
  fileName?: string;
  isImage?: boolean;
}

export function FilePreview({ documentId, fileName = "Document", isImage = false }: FilePreviewProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const viewUrl = `/api/documents/${documentId}/view`;
  const downloadUrl = `/api/documents/${documentId}/download`;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error("Fetch failed");
      const blob = await res.blob();

      const mimeType = isImage ? (blob.type || "image/jpeg") : (blob.type || "application/pdf");
      let finalFileName = fileName;
      if (!finalFileName.includes(".")) {
        finalFileName += isImage ? ".jpg" : ".pdf";
      }

      const file = new File([blob], finalFileName, { type: mimeType });

      // Web Share API for iOS and Android PWAs (prevents PWA webview lock-up!)
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] }) &&
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      ) {
        await navigator.share({
          files: [file],
          title: finalFileName,
        });
        setIsDownloading(false);
        return;
      }

      // Fallback for Desktop browsers or browsers without Web Share file support
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = finalFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      setIsDownloading(false);
    } catch (err) {
      setIsDownloading(false);
      if ((err as Error).name !== "AbortError") {
        window.open(downloadUrl, "_blank");
      }
    }
  };

  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      {/* Inline Thumbnail for Images */}
      {isImage && (
        <div
          onClick={() => setIsOpen(true)}
          className="relative h-14 w-14 rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity shrink-0 group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewUrl}
            alt={fileName}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Eye className="h-4 w-4 text-white" />
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
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" asChild>
                <a href={viewUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Tab
                </a>
              </Button>
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="h-8 text-xs gap-1"
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Share2 className="h-3.5 w-3.5" />
                )}
                Save / Share
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 w-full h-full min-h-0 bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center p-2 relative">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={viewUrl}
                alt={fileName}
                className="max-h-full max-w-full object-contain rounded"
              />
            ) : (
              <PdfViewer url={viewUrl} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        disabled={isDownloading}
        className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {isDownloading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        Save
      </Button>
    </div>
  );
}
