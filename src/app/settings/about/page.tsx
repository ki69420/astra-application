"use client";
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, ArrowLeft } from "lucide-react";
import { useNavigationStore } from "@/lib/store/use-navigation-store";

import RootMasterAppShell from "@/app/page";

export function AboutView() {
  const changelogs = [
    {
      version: "v1.4.0",
      date: "01 August 2026",
      tag: "Current Release",
      features: [
        "Single-Shell PWA SPA Architecture: 100% offline client container with 0ms in-memory view transitions and zero server dependencies.",
        "WhatsApp-Style Offline Queue: Background auto-sync engine using IndexedDB to queue offline changes and flush them when internet reconnects.",
        "Local Document Search: Real-time search bar in Documents list for filtering stored files by name, type, or extension.",
        "0ms Local Binary Downloads: Instant PDF/image downloads generated directly from IndexedDB local Blobs.",
        "Strict Array Guards: Protected Zustand hydration from corrupted network calls during server shutdowns.",
      ],
    },
    {
      version: "v1.3.0",
      date: "31 July 2026",
      features: [
        "App-Wide Text Scaling: Senior-friendly text size customization (Normal, Large, Extra Large) saved in local storage.",
        "Admin Vault: N-level recursive folder grouping & multi-parent linking system.",
        "Drag & Drop Reordering: Touch-friendly @dnd-kit drag-and-drop hierarchy manager.",
        "Zustand State Persistence: Instant 0ms local device rehydration across force closes.",
        "IndexedDB Binary Cache: Local device storage for offline PDF and image viewing.",
      ],
    },
    {
      version: "v1.2.0",
      date: "29 July 2026",
      features: [
        "100% Client-Side Navigation: All page transitions execute in 0ms directly from Zustand memory without DB lag.",
        "Mobile PWA PDF.js Preview: PDF files render on HTML canvas without Android blue 'Open' buttons.",
        "Native Web Share API: Direct download/share prompts on iOS and Android PWAs without screen freezing.",
        "UTC Date Standardization: Date picker saves at 12:00 NOON UTC, eliminating off-by-one date shifts.",
        "Mobile Responsive Attachments: Dedicated Attachments card on student profiles.",
      ],
    },
    {
      version: "v1.1.0",
      date: "25 July 2026",
      features: [
        "Zustand State Store: Full database caching in memory for instant tab navigation.",
        "Custom Field Filtering: Multi-field search modal on students page.",
        "Expandable Radio & Checkbox Controls: Collapsible option lists with Deselect All.",
      ],
    },
    {
      version: "v1.0.0",
      date: "20 July 2026",
      features: [
        "Initial release: Students management, custom fields definitions, document storage.",
      ],
    },
  ];

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => useNavigationStore.getState().goBack()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-base font-bold">About App</h1>
          <p className="text-xs text-muted-foreground">Platform info &amp; release history</p>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* General Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">System Metadata</CardTitle>
            <CardDescription className="text-xs">Project Astra — Tuition Management System</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Current Version", "1.4.0"],
              ["Architecture", "Single-Shell PWA SPA (100% Offline)"],
              ["Database", "PostgreSQL via Supabase"],
              ["Offline Queue", "IndexedDB Action Queue (Auto-Sync)"],
              ["State Management", "Zustand Global Store (Persistent)"],
              ["Device Cache", "IndexedDB Binary Document Store"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1 border-b last:border-0">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Version History & Changelogs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Version History &amp; Changelogs
            </CardTitle>
            <CardDescription className="text-xs">System update logs and release notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {changelogs.map((log) => (
              <div key={log.version} className="border-b last:border-0 pb-3 last:pb-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">{log.version}</span>
                    {log.tag && (
                      <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4">
                        {log.tag}
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">{log.date}</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                  {log.features.map((feat, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AboutRoutePage() {
  React.useEffect(() => {
    useNavigationStore.setState({ activeView: "settings-about" });
  }, []);

  return <RootMasterAppShell />;
}
