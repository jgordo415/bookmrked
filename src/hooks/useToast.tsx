import React, { createContext, useContext, useState, useCallback } from "react";

type Toast = {
  id: number;
  message: string;
};

type ToastContextType = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2300);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-2.5 rounded-md border border-gold/30 bg-surface-raised px-4 py-2.5 text-sm text-ink shadow-lg shadow-black/20"
          style={{
            animation: `toast-in 250ms ease-out forwards, toast-out 250ms ease-in forwards`,
            animationDelay: `0ms, 2000ms`,
          }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
          <span className="font-mono-tag whitespace-nowrap">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
