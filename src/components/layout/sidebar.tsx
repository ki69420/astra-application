"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Settings, FileText, LayoutDashboard, SlidersHorizontal, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/custom-fields", label: "Custom Fields", icon: SlidersHorizontal },
  { href: "/vault", label: "Vault", icon: Shield },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen border-r bg-card flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Project Astra</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
