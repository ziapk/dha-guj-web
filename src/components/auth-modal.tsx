"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";

type AuthModalState = { close: () => void };

const AuthModalContext = createContext<AuthModalState | null>(null);

/** Null on the full /login and /forgot-password pages; set when the form is shown as a modal over another page. */
export function useAuthModal(): AuthModalState | null {
  return useContext(AuthModalContext);
}

/**
 * Overlay for the intercepted log in / forgot password routes (`app/@modal`). The URL still changes, so closing
 * goes back in history to the page underneath, and a refresh or direct visit opens the full page instead.
 */
export function AuthModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  const close = () => router.back();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        router.back();
      }
    };
    const overflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [router]);

  return (
    <AuthModalContext.Provider value={{ close }}>
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            close();
          }
        }}
      >
        {children}
      </div>
    </AuthModalContext.Provider>
  );
}
