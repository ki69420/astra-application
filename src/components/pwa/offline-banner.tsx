"use client";
import * as React from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = React.useState(false);
  const [showOnlineNotification, setShowOnlineNotification] = React.useState(false);

  React.useEffect(() => {
    // Initial check
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    const handleOffline = () => {
      setIsOffline(true);
      setShowOnlineNotification(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowOnlineNotification(true);
      const timer = setTimeout(() => {
        setShowOnlineNotification(false);
      }, 2500);
      return () => clearTimeout(timer);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !showOnlineNotification) return null;

  return (
    <div className="sticky top-0 z-50 w-full transition-all duration-300 animate-in slide-in-from-top-full">
      {isOffline ? (
        <div className="bg-slate-800 text-slate-100 border-b border-slate-700 px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-semibold shadow-md">
          <WifiOff className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>Offline Mode: Viewing local data on your device</span>
        </div>
      ) : (
        <div className="bg-emerald-700 text-white px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-semibold shadow-md">
          <Wifi className="h-3.5 w-3.5 text-emerald-200 shrink-0 animate-pulse" />
          <span>Back Online: Auto-sync active</span>
        </div>
      )}
    </div>
  );
}
