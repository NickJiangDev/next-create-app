"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FormEvent,
} from "react";

export function UserMenu({
  email,
  onLogout,
  onAuthChange,
}: {
  email: string;
  onLogout: () => void;
  onAuthChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "password">("menu");
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setView("menu");
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        setView("menu");
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (view !== "menu") return;
      const items =
        menuRef.current?.querySelectorAll<HTMLButtonElement>(
          '[role="menuitem"]',
        );
      if (!items || items.length === 0) return;
      const current = document.activeElement as HTMLElement;
      const idx = Array.from(items).indexOf(current as HTMLButtonElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        items[idx < items.length - 1 ? idx + 1 : 0].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        items[idx > 0 ? idx - 1 : items.length - 1].focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        items[0].focus();
      } else if (e.key === "End") {
        e.preventDefault();
        items[items.length - 1].focus();
      }
    },
    [view],
  );

  useEffect(() => {
    if (open && view === "menu") {
      requestAnimationFrame(() => {
        menuRef.current
          ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
          ?.focus();
      });
    }
  }, [open, view]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout();
  }

  async function handleDelete() {
    if (!confirm("确定要注销账号吗？此操作不可撤销。")) return;
    const res = await fetch("/api/auth/delete", { method: "DELETE" });
    if (res.ok) onLogout();
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "修改失败");
        return;
      }
      setMsg("密码已更新");
      setOldPwd("");
      setNewPwd("");
      onAuthChange();
    } catch {
      setMsg("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen(!open);
          setView("menu");
        }}
        className="btn btn-secondary px-4 py-2 text-sm font-medium truncate max-w-[200px] transition-colors duration-150"
        aria-label="用户菜单"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {email}
      </button>

      {open && (
        <div
          ref={menuRef}
          className="card absolute right-0 mt-2 w-72 p-3 z-50"
          role="menu"
          onKeyDown={handleMenuKeyDown}
        >
          {view === "menu" ? (
            <div className="space-y-1">
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => setView("password")}
                className="btn btn-ghost w-full py-2.5 px-3 text-sm text-left rounded-lg transition-colors duration-150"
              >
                <span className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 text-primary-light"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                    />
                  </svg>
                  修改密码
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={handleLogout}
                className="btn btn-ghost w-full py-2.5 px-3 text-sm text-left rounded-lg transition-colors duration-150"
              >
                <span className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 text-accent-orange"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                    />
                  </svg>
                  退出登录
                </span>
              </button>
              <div
                className="border-t my-1"
                style={{ borderColor: "var(--color-border-subtle)" }}
                role="separator"
              />
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={handleDelete}
                className="btn btn-danger w-full py-2.5 px-3 text-sm text-left rounded-lg transition-colors duration-150"
              >
                <span className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                  注销账号
                </span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleChangePassword}
              noValidate
              className="space-y-3"
            >
              <h3 className="font-semibold text-sm text-primary-light">
                修改密码
              </h3>
              <div>
                <label
                  htmlFor="old-pwd"
                  className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1"
                >
                  旧密码
                </label>
                <input
                  id="old-pwd"
                  type="password"
                  name="oldPassword"
                  autoComplete="current-password"
                  placeholder="当前密码…"
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                  className="input w-full px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="new-pwd"
                  className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1"
                >
                  新密码
                </label>
                <input
                  id="new-pwd"
                  type="password"
                  name="newPassword"
                  autoComplete="new-password"
                  placeholder="至少 6 位…"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  className="input w-full px-3 py-2 text-sm"
                  required
                  minLength={6}
                />
              </div>
              {msg && (
                <p
                  className="text-xs"
                  role="alert"
                  style={{
                    color:
                      msg === "密码已更新"
                        ? "var(--color-cta)"
                        : "var(--color-accent-red)",
                  }}
                >
                  {msg}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex-1 py-2 text-sm disabled:opacity-50"
                >
                  {submitting ? "保存中…" : "保存"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView("menu");
                    setMsg("");
                  }}
                  className="btn btn-secondary flex-1 py-2 text-sm"
                >
                  取消
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
