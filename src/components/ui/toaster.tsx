"use client";
import { useToast } from "@/components/ui/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

// Configurable Toast Display Duration Variable (in milliseconds)
export const DEFAULT_TOAST_DURATION = 3000;

export function Toaster() {
  const { toasts } = useToast();
  return (
    <ToastProvider duration={DEFAULT_TOAST_DURATION}>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} durationMs={DEFAULT_TOAST_DURATION} {...props}>
          <div className="grid gap-0.5 min-w-0">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
