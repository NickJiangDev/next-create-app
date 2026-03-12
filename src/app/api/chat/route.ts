import { currentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { chatSchema } from "@/lib/schema";

function jsonError(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return jsonError("请先登录", 401);

    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const {
      messages,
      enableSearch,
      enableThinking,
      thinkingBudget,
      temperature,
      topP,
    } = parsed.data;

    // Build request body with qwen-specific params
    const requestBody: Record<string, unknown> = {
      model: env.ai.model(),
      messages,
      stream: true,
      stream_options: { include_usage: true },
      temperature,
      top_p: topP,
      enable_search: enableSearch,
      enable_thinking: enableThinking,
    };

    if (enableThinking) {
      requestBody.thinking_budget = thinkingBudget;
    }

    const upstream = await fetch(`${env.ai.baseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.ai.apiKey()}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error("AI upstream error:", upstream.status, text);
      return jsonError("AI 服务异常", 502);
    }

    if (!upstream.body) {
      return jsonError("AI 返回为空", 502);
    }

    // Transform upstream SSE → our custom SSE format (reasoning + content + usage)
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";

    const readable = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }

            try {
              const json = JSON.parse(payload);

              // usage info (usually in the last chunk)
              if (json.usage) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ usage: json.usage })}\n\n`,
                  ),
                );
              }

              if (!json.choices?.length) continue;

              const delta = json.choices[0].delta || {};
              const event: Record<string, unknown> = {};

              if (delta.reasoning_content != null) {
                event.reasoning = delta.reasoning_content;
              }
              if (delta.content != null) {
                event.content = delta.content;
              }

              if (Object.keys(event).length > 0) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
                );
              }
            } catch {
              // skip malformed JSON
            }
          }
        } catch (err) {
          console.error("stream transform error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "流式传输中断" })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("chat error:", err);
    return jsonError("服务器错误", 500);
  }
}
