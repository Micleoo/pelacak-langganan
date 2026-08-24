"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#0f172a",
          color: "#f8fafc",
          borderRadius: "12px",
          padding: "12px 16px",
          fontFamily: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
          fontSize: "14px",
          boxShadow: "0 10px 38px -10px rgba(15, 23, 42, 0.5), 0 10px 20px -15px rgba(15, 23, 42, 0.3)",
        },
        success: {
          iconTheme: {
            primary: "#0d9488",
            secondary: "#f8fafc",
          },
        },
        error: {
          iconTheme: {
            primary: "#e11d48",
            secondary: "#f8fafc",
          },
        },
        loading: {
          iconTheme: {
            primary: "#0d9488",
            secondary: "#f8fafc",
          },
        },
      }}
    />
  );
}