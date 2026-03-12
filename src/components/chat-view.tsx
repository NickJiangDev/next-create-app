"use client";

import {
  useState,
  useRef,
  type FormEvent,
  useEffect,
  useCallback,
} from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
}

interface ChatSettings {
  enableSearch: boolean;
  enableThinking: boolean;
  thinkingBudget: number;
  temperature: number;
  topP: number;
}

interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

const DEFAULT_SETTINGS: ChatSettings = {
  enableSearch: false,
  enableThinking: false,
  thinkingBudget: 4000,
  temperature: 0.7,
  topP: 0.8,
};

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [expandedThinking, setExpandedThinking] = useState<Set<number>>(
    new Set(),
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  function handleNewChat() {
    if (streaming) stopStreaming();
    setMessages([]);
    setUsage(null);
    setExpandedThinking(new Set());
    inputRef.current?.focus();
  }

  function toggleThinking(idx: number) {
    setExpandedThinking((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    setUsage(null);

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setStreaming(true);

    // placeholder assistant
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", reasoning: "" },
    ]);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      // send full conversation history
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          enableSearch: settings.enableSearch,
          enableThinking: settings.enableThinking,
          thinkingBudget: settings.thinkingBudget,
          temperature: settings.temperature,
          topP: settings.topP,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: `⚠️ ${data.error || "请求失败"}`,
          };
          return copy;
        });
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) throw new Error("No reader");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;

          try {
            const json = JSON.parse(payload);

            // usage info
            if (json.usage) {
              setUsage(json.usage);
              continue;
            }

            // error from stream
            if (json.error) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                copy[copy.length - 1] = {
                  ...last,
                  content: last.content + `\n⚠️ ${json.error}`,
                };
                return copy;
              });
              continue;
            }

            // reasoning + content deltas
            if (json.reasoning || json.content) {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                copy[copy.length - 1] = {
                  ...last,
                  reasoning: (last.reasoning || "") + (json.reasoning || ""),
                  content: last.content + (json.content || ""),
                };
                return copy;
              });
            }
          } catch {
            // skip malformed
          }
        }
      }

      // auto-expand thinking for the last message if it has reasoning
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.reasoning) {
          setExpandedThinking((s) => new Set(s).add(prev.length - 1));
        }
        return prev;
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // user stopped
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (!last.content) {
            copy[copy.length - 1] = { ...last, content: "（已停止生成）" };
          }
          return copy;
        });
      } else {
        console.error("stream error:", err);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "⚠️ 网络错误，请重试",
          };
          return copy;
        });
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 gap-0 min-h-0">
      {/* toolbar */}
      <div
        className="flex items-center justify-between pb-3 border-b shrink-0"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="btn btn-ghost px-3 py-1.5 text-xs rounded-lg"
            aria-label="新对话"
          >
            <span className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-3.5 h-3.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              新对话
            </span>
          </button>
          {messages.length > 0 && (
            <span className="text-xs text-text-dim font-variant-numeric tabular-nums">
              {messages.length} 条消息
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {usage && (
            <span
              className="text-xs text-text-dim font-variant-numeric tabular-nums"
              title="Token 用量"
            >
              {usage.total_tokens?.toLocaleString()} tokens
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`btn btn-ghost px-3 py-1.5 text-xs rounded-lg ${showSettings ? "text-primary-light" : ""}`}
            aria-label="模型设置"
            aria-expanded={showSettings}
          >
            <span className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-3.5 h-3.5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                />
              </svg>
              设置
            </span>
          </button>
        </div>
      </div>

      {/* settings panel */}
      {showSettings && (
        <SettingsPanel settings={settings} onChange={setSettings} />
      )}

      {/* messages */}
      <div
        className="flex-1 overflow-y-auto space-y-4 py-4 min-h-0 chat-messages"
        style={{ overscrollBehavior: "contain" }}
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 && <EmptyState />}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] ${msg.role === "user" ? "" : "space-y-2"}`}
            >
              {/* thinking block */}
              {msg.role === "assistant" && msg.reasoning && (
                <div
                  className="rounded-xl border overflow-hidden"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "rgba(139,92,246,0.05)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleThinking(i)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary-light hover:bg-primary/5 transition-colors duration-150"
                    aria-expanded={expandedThinking.has(i)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${expandedThinking.has(i) ? "rotate-90" : ""}`}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                      />
                    </svg>
                    思考过程
                  </button>
                  {expandedThinking.has(i) && (
                    <div
                      className="px-3 pb-3 text-xs text-text-muted leading-relaxed whitespace-pre-wrap break-words border-t"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      {msg.reasoning}
                    </div>
                  )}
                </div>
              )}
              {/* content */}
              <div
                className={`px-4 py-3 rounded-2xl whitespace-pre-wrap break-words text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary/15 border border-primary/20 text-text"
                    : "bg-bg-elevated border border-border-subtle text-text"
                }`}
              >
                {msg.content || (
                  <span className="text-text-dim flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    {settings.enableThinking ? "深度思考中…" : "思考中…"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} className="!mt-0" />
      </div>

      {/* input */}
      <form
        onSubmit={handleSend}
        className="flex gap-3 pt-4 border-t shrink-0"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <label htmlFor="chat-input" className="sr-only">
          输入消息
        </label>
        <input
          ref={inputRef}
          id="chat-input"
          type="text"
          name="message"
          autoComplete="off"
          placeholder="输入你的问题…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input flex-1 px-4 py-3 min-w-0"
          disabled={streaming}
        />
        {streaming ? (
          <button
            type="button"
            onClick={stopStreaming}
            className="btn btn-danger px-5 py-3"
            aria-label="停止生成"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="btn btn-primary px-5 py-3 disabled:opacity-40"
            aria-label="发送消息"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        )}
      </form>
    </div>
  );
}

/* ---- Settings Panel ---- */
function SettingsPanel({
  settings,
  onChange,
}: {
  settings: ChatSettings;
  onChange: (s: ChatSettings) => void;
}) {
  return (
    <div className="card p-4 my-3 space-y-4 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* toggles */}
        <ToggleRow
          id="enable-search"
          label="联网搜索"
          description="允许模型搜索互联网获取实时信息"
          checked={settings.enableSearch}
          onChange={(v) => onChange({ ...settings, enableSearch: v })}
        />
        <ToggleRow
          id="enable-thinking"
          label="深度思考"
          description="启用推理链，展示思考过程"
          checked={settings.enableThinking}
          onChange={(v) => onChange({ ...settings, enableThinking: v })}
        />
      </div>

      {/* sliders */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <SliderRow
          id="temperature"
          label="Temperature"
          value={settings.temperature}
          min={0}
          max={2}
          step={0.1}
          onChange={(v) => onChange({ ...settings, temperature: v })}
        />
        <SliderRow
          id="top-p"
          label="Top P"
          value={settings.topP}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => onChange({ ...settings, topP: v })}
        />
        {settings.enableThinking && (
          <SliderRow
            id="thinking-budget"
            label="思考预算"
            value={settings.thinkingBudget}
            min={1000}
            max={20000}
            step={1000}
            onChange={(v) => onChange({ ...settings, thinkingBudget: v })}
            format={(v) => `${(v / 1000).toFixed(0)}k`}
          />
        )}
      </div>
    </div>
  );
}

/* ---- Toggle Row ---- */
function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
          checked ? "bg-cta" : "bg-bg-elevated border border-border-subtle"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-150 ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
          aria-hidden="true"
        />
      </button>
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-text font-medium text-sm">{label}</span>
        <span className="block text-text-dim text-xs">{description}</span>
      </label>
    </div>
  );
}

/* ---- Slider Row ---- */
function SliderRow({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const display = format
    ? format(value)
    : value.toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="text-text-muted text-xs font-medium">
          {label}
        </label>
        <span className="text-primary-light text-xs font-mono tabular-nums">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
        style={{
          background: `linear-gradient(to right, var(--color-primary) ${((value - min) / (max - min)) * 100}%, var(--color-bg-elevated) ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
    </div>
  );
}

/* ---- Empty State ---- */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50 select-none !m-0">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-12 h-12 text-primary-light"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
        />
      </svg>
      <div className="text-center space-y-1">
        <p className="text-lg font-semibold text-text-muted">向 AI 提问吧</p>
        <p className="text-xs text-text-dim">
          支持多轮对话 · 联网搜索 · 深度思考
        </p>
      </div>
    </div>
  );
}
