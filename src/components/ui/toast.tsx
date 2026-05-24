"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={className}
    style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, maxWidth: 380, width: "100%" }}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const variantStyles = {
  default: { bg: "#fff",     border: "var(--border-mid)", icon: <Info size={15} style={{ color: "var(--blue)" }} />,   iconBg: "var(--blue-bg)" },
  success: { bg: "#fff",     border: "var(--green-border)", icon: <CheckCircle2 size={15} style={{ color: "var(--green)" }} />, iconBg: "var(--green-bg)" },
  error:   { bg: "#fff",     border: "var(--red-border)",   icon: <AlertCircle size={15} style={{ color: "var(--red)" }} />,   iconBg: "var(--red-bg)" },
  warning: { bg: "#fff",     border: "var(--amber-border)", icon: <AlertTriangle size={15} style={{ color: "var(--amber)" }} />, iconBg: "var(--amber-bg)" },
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
    variant?: "default" | "success" | "error" | "warning";
  }
>(({ variant = "default", children, ...props }, ref) => {
  const v = variantStyles[variant];
  return (
    <ToastPrimitives.Root
      ref={ref}
      style={{
        background: v.bg,
        border: `1px solid ${v.border}`,
        borderRadius: "var(--radius)",
        padding: "12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        boxShadow: "0 8px 32px rgba(15,21,53,0.15), 0 2px 8px rgba(15,21,53,0.08)",
        position: "relative",
        minWidth: 280,
      }}
      {...props}
    >
      <div style={{ width: 28, height: 28, borderRadius: "var(--radius-sm)", background: v.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        {v.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      <ToastPrimitives.Close style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2, display: "flex", alignItems: "center", flexShrink: 0 }}>
        <X size={13} />
      </ToastPrimitives.Close>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ ...props }, ref) => (
  <ToastPrimitives.Title ref={ref} style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }} {...props} />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ ...props }, ref) => (
  <ToastPrimitives.Description ref={ref} style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.4 }} {...props} />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ ...props }, ref) => (
  <ToastPrimitives.Action ref={ref} {...props} />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ ...props }, ref) => (
  <ToastPrimitives.Close ref={ref} {...props} />
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
