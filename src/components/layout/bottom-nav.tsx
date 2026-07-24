"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, Settings, FileText, SlidersHorizontal, Loader2 } from "lucide-react";
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
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    navItems.forEach(({ href }) => {
      router.prefetch(href);
    });
  }, [router]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname === href || (href !== "/" && pathname.startsWith(href))) return;
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          const isLoading = pendingHref === href && !active;

          return (
            <Link
              key={href}
              href={href}
              onClick={(e) => handleNavClick(e, href)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors min-w-[56px] relative",
                active || isLoading
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <Icon className={cn("h-5 w-5 transition-transform active:scale-95", active && "stroke-[2.5]")} />
              )}
              <span>{label}</span>
              {isLoading && (
                <span className="absolute top-1 right-2 h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
