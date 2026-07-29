"use client";
import * as React from "react";
import { Eye, Download, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FilePreviewProps {
  documentId: string;
  fileName?: string;
  isImage?: boolean;
}

export function FilePreview({ documentId, fileName = "Document", isImage = false }: FilePreviewProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const viewUrl = `/api/documents/${documentId}/view`;
  const downloadUrl = `/api/documents/${documentId}/download`;

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
            <DialogTitle className="text-sm font-semibold truncate flex items-center gap-2">
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
              <Button size="sm" className="h-8 text-xs gap-1" asChild>
                <a href={downloadUrl} download>
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
                src={viewUrl}
                alt={fileName}
                className="max-h-full max-w-full object-contain rounded"
              />
            ) : (
              <iframe
                src={viewUrl}
                title={fileName}
                className="w-full h-full border-0 rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground" asChild>
        <a href={downloadUrl} download>
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      </Button>
    </div>
  );
}
