"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthForm } from "./auth-form";
import { ChatView } from "./chat-view";
import { UserMenu } from "./user-menu";

interface User {
  userId: number;
  email: string;
}

export function AppShell() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3" aria-live="polite">
          <span
            className="inline-block w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"
            aria-hidden="true"
          />
          <p className="text-text-muted text-lg font-medium tracking-wide">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6 overflow-x-hidden relative">
        {/* decorative gradient orbs */}
        <div
          className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none opacity-15"
          style={{
            background:
              "radial-gradient(circle, var(--color-primary), transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none opacity-10"
          style={{
            background:
              "radial-gradient(circle, var(--color-accent-orange), transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none opacity-10"
          style={{
            background:
              "radial-gradient(circle, var(--color-cta), transparent 70%)",
          }}
          aria-hidden="true"
        />
        <AuthForm onSuccess={checkAuth} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Navbar
        email={user.email}
        onLogout={() => setUser(null)}
        onAuthChange={checkAuth}
      />
      <main
        id="main-content"
        className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6 py-6 min-h-0"
      >
        <ChatView />
      </main>
    </div>
  );
}

function Navbar({
  email,
  onLogout,
  onAuthChange,
}: {
  email: string;
  onLogout: () => void;
  onAuthChange: () => void;
}) {
  return (
    <nav
      className="shrink-0 sticky top-0 z-50 backdrop-blur-xl border-b"
      style={{
        background: "rgba(10, 10, 15, 0.85)",
        borderColor: "var(--color-border-subtle)",
      }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
        <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{
              background: "var(--color-cta)",
              boxShadow: "0 0 8px rgba(16,185,129,0.5)",
            }}
            aria-hidden="true"
          />
          <span className="bg-gradient-to-r from-primary-light to-cta-light bg-clip-text text-transparent">
            Next Create App
          </span>
        </h1>
        <UserMenu
          email={email}
          onLogout={onLogout}
          onAuthChange={onAuthChange}
        />
      </div>
    </nav>
  );
}
