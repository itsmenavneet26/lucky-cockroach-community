"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type Tone = "success" | "error" | "info";

type Toast = {
  id: string;
  tone: Tone;
  title?: string;
  message: string;
  duration: number;
};

type ToastInput = Omit<Toast, "id" | "duration"> & { duration?: number };

type ToastContextValue = {
  toast: (t: ToastInput) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICON: Record<Tone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const TONE_CLASSES: Record<Tone, string> = {
  success:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  error: "border-danger/40 bg-danger/10 text-danger",
  info: "border-accent/30 bg-accent-soft text-ink",
};

let toastSeq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((t: ToastInput) => {
    const id = `t${++toastSeq}`;
    const duration = t.duration ?? (t.tone === "error" ? 5500 : 3500);
    setToasts((prev) => [...prev, { ...t, id, duration }]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message, title) => toast({ tone: "success", message, title }),
      error: (message, title) => toast({ tone: "error", message, title }),
      info: (message, title) => toast({ tone: "info", message, title }),
      dismiss,
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[1000] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const handle = window.setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => window.clearTimeout(handle);
  }, [toast.id, toast.duration, onDismiss]);

  const Icon = ICON[toast.tone];
  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius)] border px-3.5 py-2.5 shadow-lg backdrop-blur ${TONE_CLASSES[toast.tone]}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="flex-1 text-[13px] leading-snug">
        {toast.title ? (
          <p className="font-semibold">{toast.title}</p>
        ) : null}
        <p className={toast.title ? "opacity-90" : ""}>{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="shrink-0 rounded p-1 opacity-70 hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}

/** Read a server-action result and show an error toast if it failed.
 *  Returns true on success so callers can branch. */
export function useActionToast() {
  const { error: toastError } = useToast();
  return useCallback(
    (
      result: { ok: boolean; error?: string } | null | undefined,
      fallback = "Something didn't work. Please try again.",
    ): boolean => {
      if (!result) {
        toastError(fallback);
        return false;
      }
      if (!result.ok) {
        toastError(result.error || fallback);
        return false;
      }
      return true;
    },
    [toastError],
  );
}
