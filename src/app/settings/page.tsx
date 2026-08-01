"use client";
import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore, type TextSize } from "@/lib/store/use-app-store";
import { Check, ChevronRight, Info, Type, Phone, GraduationCap } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useNavigationStore } from "@/lib/store/use-navigation-store";
import RootMasterAppShell from "../page";

const TEXT_SIZES: Array<{
  id: TextSize;
  title: string;
  desc: string;
  badge: string;
}> = [
  {
    id: "normal",
    title: "Normal",
    desc: "Standard text size",
    badge: "100%",
  },
  {
    id: "large",
    title: "Large",
    desc: "Comfortable big text",
    badge: "112%",
  },
  {
    id: "xlarge",
    title: "Extra Large",
    desc: "Maximum legibility",
    badge: "125%",
  },
];

export function SettingsView() {
  const textSize = useAppStore((s) => s.textSize);
  const setTextSize = useAppStore((s) => s.setTextSize);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectSize = (size: TextSize) => {
    setTextSize(size);
    toast({ title: `Text size updated to ${size.toUpperCase()}` });
  };

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3">
        <h1 className="text-lg font-bold leading-tight">Settings</h1>
        <p className="text-xs text-muted-foreground">App preferences &amp; text size controls</p>
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* Text Size Selector Card */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Type className="h-5 w-5 text-primary" />
              Text Size for Reading Comfort
            </CardTitle>
            <CardDescription className="text-xs">
              Choose a larger font size to make all text across the app easier to read.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Button Tiles for Text Size */}
            <div className="grid grid-cols-1 gap-2.5">
              {TEXT_SIZES.map((item) => {
                const isSelected = (textSize || "normal") === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSize(item.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-sm"
                        : "hover:bg-accent/50 border-border text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-tight">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>

                    <Badge variant={isSelected ? "default" : "outline"} className="text-xs font-semibold shrink-0">
                      {item.badge}
                    </Badge>
                  </button>
                );
              })}
            </div>

            {/* Live Text Preview Box */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Live Text Preview
              </p>
              <div className="p-3.5 rounded-xl bg-muted/40 border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                    Rahul Sharma
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Enrolled
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>+91 98765 43210</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Section Tile */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() => useNavigationStore.getState().navigateTo("settings-about")}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-accent/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">About App</p>
                  <p className="text-xs text-muted-foreground">App version, platform info &amp; release history</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsRoutePage() {
  React.useEffect(() => {
    useNavigationStore.setState({ activeView: "settings" });
  }, []);

  return <RootMasterAppShell />;
}
