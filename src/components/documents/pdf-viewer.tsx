"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";

interface PdfViewerProps {
  url: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfjsLib: any;
  }
}

export function PdfViewer({ url }: PdfViewerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function loadAndRenderPdf() {
      try {
        setLoading(true);
        setError(null);

        // Load PDF.js script if not loaded
        if (!window.pdfjsLib) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (!window.pdfjsLib) throw new Error("PDF renderer failed to initialize");

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const loadingTask = window.pdfjsLib.getDocument({ url });
        const pdf = await loadingTask.promise;

        if (!isMounted || !containerRef.current) return;

        containerRef.current.innerHTML = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          if (!isMounted || !containerRef.current) return;

          // Scale for mobile responsiveness
          const containerWidth = containerRef.current.clientWidth || 320;
          const unscaledViewport = page.getViewport({ scale: 1 });
          const scale = (containerWidth - 16) / unscaledViewport.width;
          const viewport = page.getViewport({ scale: Math.max(scale, 0.75) });

          const canvas = document.createElement("canvas");
          canvas.className = "mb-3 rounded shadow-sm border bg-white max-w-full mx-auto block";
          const context = canvas.getContext("2d");

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
          }

          if (containerRef.current) {
            containerRef.current.appendChild(canvas);
          }
        }

        if (isMounted) setLoading(false);
      } catch (err) {
        if (isMounted) {
          setLoading(false);
          setError("Unable to render PDF preview");
        }
      }
    }

    loadAndRenderPdf();

    return () => {
      isMounted = false;
    };
  }, [url]);

  return (
    <div className="relative w-full h-full min-h-[350px] max-h-[70vh] overflow-y-auto flex flex-col items-center p-2 bg-muted/40 rounded-lg">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 z-10 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Loading PDF Preview...</p>
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center justify-center h-48 text-center gap-2 w-full">
          <p className="text-xs text-muted-foreground">{error}</p>
          <iframe src={url} title="PDF Preview Fallback" className="w-full h-64 border rounded" />
        </div>
      ) : (
        <div ref={containerRef} className="w-full space-y-2" />
      )}
    </div>
  );
}
