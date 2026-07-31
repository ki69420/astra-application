"use client";
import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useNavigationStore, resolveHrefToNavigation } from "@/lib/store/use-navigation-store";

interface NavButtonProps extends ButtonProps {
  href: string;
  loadingText?: string;
  children: React.ReactNode;
}

export function NavButton({
  href,
  children,
  className,
  variant = "default",
  size = "sm",
  ...props
}: NavButtonProps) {
  const navigateTo = useNavigationStore((s) => s.navigateTo);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const nav = resolveHrefToNavigation(href);
    navigateTo(nav.view, { studentId: nav.studentId, fieldId: nav.fieldId });
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
}
