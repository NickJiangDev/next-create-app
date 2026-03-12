"use client";

import { useState, type FormEvent } from "react";

export function AuthForm({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "操作失败");
        return;
      }
      onSuccess();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card w-full max-w-sm p-8 relative z-10">
      {/* top accent bar */}
      <div
        className="absolute top-0 left-8 right-8 h-0.5 rounded-full"
        style={{
          background:
            "linear-gradient(90deg, var(--color-primary), var(--color-cta))",
        }}
        aria-hidden="true"
      />

      <h2 className="text-2xl font-extrabold text-center mb-1 tracking-tight text-text">
        {mode === "login" ? "Welcome Back" : "Get Started"}
      </h2>
      <p className="text-center text-text-dim text-sm mb-6">
        {mode === "login" ? "登录以继续你的 AI 之旅" : "创建账号，开始探索"}
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label
            htmlFor="auth-email"
            className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5"
          >
            邮箱
          </label>
          <input
            id="auth-email"
            type="email"
            name="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="you@example.com…"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input w-full px-4 py-3"
            required
          />
        </div>

        <div className="mb-5">
          <label
            htmlFor="auth-password"
            className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5"
          >
            密码
          </label>
          <input
            id="auth-password"
            type="password"
            name="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            placeholder="至少 6 位…"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input w-full px-4 py-3"
            required
            minLength={6}
          />
        </div>

        {error && (
          <p
            className="text-accent-red text-sm mb-3 flex items-center gap-1.5"
            role="alert"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full py-3 text-base inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting && (
            <span
              className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              aria-hidden="true"
            />
          )}
          {submitting
            ? mode === "login"
              ? "登录中…"
              : "注册中…"
            : mode === "login"
              ? "登录"
              : "注册"}
        </button>
      </form>

      <p className="text-center text-sm mt-5 text-text-dim">
        {mode === "login" ? "还没有账号？" : "已有账号？"}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
          className="ml-1 font-semibold text-primary-light hover:text-primary transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded"
        >
          {mode === "login" ? "去注册" : "去登录"}
        </button>
      </p>
    </div>
  );
}
