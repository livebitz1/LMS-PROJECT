"use client";

import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

type ToastMsg = {
  title?: string;
  description?: string;
  variant?: "destructive" | "default" | "success";
};

export function useToast() {
  const [toastMsg, setToastMsg] = useState<ToastMsg | null>(null);

  useEffect(() => {
    if (!toastMsg) return;

    const container = document.createElement("div");
    container.className = "fixed top-4 right-4 z-50";
    document.body.appendChild(container);

    const root = createRoot(container);

    const ToastEl = (
      <div
        role="status"
        className={`max-w-sm w-full p-3 rounded-md shadow-lg ring-1 ring-black/5 flex flex-col gap-1 ${
          toastMsg.variant === "destructive" ? "bg-red-600 text-white" : "bg-white text-black"
        }`}
      >
        {toastMsg.title && <div className="font-semibold text-sm">{toastMsg.title}</div>}
        {toastMsg.description && <div className="text-xs opacity-90">{toastMsg.description}</div>}
      </div>
    );

    root.render(ToastEl);

    const t = setTimeout(() => {
      try {
        root.unmount();
        document.body.removeChild(container);
      } catch {
        // ignore
      }
      setToastMsg(null);
    }, 3500);

    return () => {
      clearTimeout(t);
      try {
        root.unmount();
        if (document.body.contains(container)) document.body.removeChild(container);
      } catch {}
    };
  }, [toastMsg]);

  const toast = (msg: ToastMsg) => setToastMsg(msg);

  return { toast, toastMsg } as const;
}

export default useToast;
