"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeRenderTaskRef = React.useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadingTaskRef = React.useRef<any>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function loadAndRenderPdf() {
      if (!url) return;

      try {
        setLoading(true);
        setError(null);

        loadingTaskRef.current = pdfjsLib.getDocument({ url });
        const pdf = await loadingTaskRef.current.promise;

        if (!isMounted || !containerRef.current) return;

        containerRef.current.innerHTML = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          if (!isMounted) break;

          const page = await pdf.getPage(i);
          if (!isMounted || !containerRef.current) break;

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
            activeRenderTaskRef.current = page.render({ canvasContext: context, viewport });
            await activeRenderTaskRef.current.promise;
          }

          if (containerRef.current && isMounted) {
            containerRef.current.appendChild(canvas);
          }

          // Yield main thread between pages to keep UI touch events (like close 'X') instant!
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        if (isMounted) setLoading(false);
      } catch (err) {
        if ((err as Error)?.name === "RenderingCancelledException") {
          return;
        }
        if (isMounted) {
          setLoading(false);
          setError("Unable to render PDF preview");
        }
      }
    }

    loadAndRenderPdf();

    return () => {
      isMounted = false;
      // Immediately cancel active render tasks and release main thread on modal close ('X')
      if (activeRenderTaskRef.current) {
        activeRenderTaskRef.current.cancel();
      }
      if (loadingTaskRef.current) {
        loadingTaskRef.current.destroy();
      }
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
        </div>
      ) : (
        <div ref={containerRef} className="w-full space-y-2" />
      )}
    </div>
  );
}
