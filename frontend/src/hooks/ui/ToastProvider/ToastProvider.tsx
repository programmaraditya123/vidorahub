"use client";

import { createContext, useContext, useMemo, useState } from "react";
import Toast, { ToastType } from "../../../components/ui/toast/Toast";
import styles from "./ToastProvider.module.scss";

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  icon?: React.ReactNode;
};

type ToastOptions = {
  type?: ToastType;
  duration?: number;     // ms
  icon?: React.ReactNode;
};

type Ctx = {
  showToast: (message: string, options?: ToastOptions) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  dismiss: (id: number) => void;
  clearAll: () => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));
  const clearAll = () => setToasts([]);

  const showToast = (message: string, options?: ToastOptions) => {
    const id = Date.now() + Math.random();
    const type = options?.type ?? "info";
    const duration = Math.max(1200, options?.duration ?? 3000);
    const icon = options?.icon ??
      (type === "success" ? "✅" : type === "error" ? "⚠️" : "ℹ️");

    setToasts(prev => [...prev, { id, message, type, duration, icon }]);
    // auto clean handled inside <Toast> via timeout; also cleanup here as fallback
    setTimeout(() => dismiss(id), duration + 50);
  };

  const api = useMemo<Ctx>(() => ({
    showToast,
    success: (msg, d) => showToast(msg, { type: "success", duration: d }),
    error:   (msg, d) => showToast(msg, { type: "error", duration: d }),
    info:    (msg, d) => showToast(msg, { type: "info", duration: d }),
    dismiss,
    clearAll,
  }), []);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className={styles.container}>
        {toasts.map(t => (
          <Toast
            key={t.id}
            id={t.id}
            message={t.message}
            type={t.type}
            duration={t.duration}
            icon={t.icon}
            onClose={dismiss}
          />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
