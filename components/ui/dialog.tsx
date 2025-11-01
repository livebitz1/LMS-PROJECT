"use client";

import React from "react";

type DialogProps = React.PropsWithChildren<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>;

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div
      data-dialog-overlay
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={() => onOpenChange?.(false)}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden
      />

      <div
        className="relative z-10 w-full max-w-2xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={["bg-white rounded-lg shadow-xl overflow-hidden", className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}

export function DialogHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={["px-6 py-4 border-b", className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={["text-lg font-semibold", className].filter(Boolean).join(' ')} {...props}>{children}</h3>;
}

export function DialogDescription({ children, className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={["text-sm text-slate-600 mt-1", className].filter(Boolean).join(' ')} {...props}>{children}</p>;
}

export function DialogFooter({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={["px-6 py-4 border-t flex justify-end gap-2", className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}

export default Dialog;
