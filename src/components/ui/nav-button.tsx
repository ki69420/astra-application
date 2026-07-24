"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

interface NavButtonProps extends ButtonProps {
  href: string;
  loadingText?: string;
  children: React.ReactNode;
}

export function NavButton({
  href,
  loadingText,
  children,
  className,
  variant = "default",
  size = "sm",
  ...props
}: NavButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [, startTransition] = React.useTransition();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-1 animate-spin shrink-0" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
