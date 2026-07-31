"use client";
import * as React from "react";
import { GraduationCap, Settings, FileText, SlidersHorizontal, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigationStore, type ActiveView } from "@/lib/store/use-navigation-store";

const navItems: Array<{ view: ActiveView; label: string; icon: React.ElementType }> = [
  { view: "students", label: "Students", icon: GraduationCap },
  { view: "custom-fields", label: "Fields", icon: SlidersHorizontal },
  { view: "vault", label: "Vault", icon: Shield },
  { view: "documents", label: "Docs", icon: FileText },
  { view: "settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const activeView = useNavigationStore((s) => s.activeView);
  const navigateTo = useNavigationStore((s) => s.navigateTo);

  const isItemActive = (view: ActiveView) => {
    if (activeView === view) return true;
    if (view === "students" && (activeView === "student-detail" || activeView === "student-edit" || activeView === "student-new")) {
      return true;
    }
    if (view === "custom-fields" && (activeView === "custom-field-edit" || activeView === "custom-field-new")) {
      return true;
    }
    if (view === "vault" && activeView === "vault-manage") {
      return true;
    }
    if (view === "settings" && activeView === "settings-about") {
      return true;
    }
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map(({ view, label, icon: Icon }) => {
          const active = isItemActive(view);

          return (
            <button
              key={view}
              type="button"
              onClick={() => navigateTo(view)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-medium transition-colors min-w-[50px] relative",
                active
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-transform active:scale-95", active && "stroke-[2.5]")} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
