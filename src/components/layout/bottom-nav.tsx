"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, Settings, FileText, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/custom-fields", label: "Fields", icon: SlidersHorizontal },
  { href: "/documents", label: "Docs", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    navItems.forEach(({ href }) => {
      router.prefetch(href);
    });
  }, [router]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors min-w-[56px]",
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
