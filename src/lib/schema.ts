import { z } from "zod/v4";

export const registerSchema = z.object({
  email: z.email("请输入有效邮箱"),
  password: z.string().min(6, "密码至少 6 位"),
});

export const loginSchema = registerSchema;

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "请输入旧密码"),
  newPassword: z.string().min(6, "新密码至少 6 位"),
});

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

export const chatSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, "至少需要一条消息"),
  enableSearch: z.boolean().optional().default(false),
  enableThinking: z.boolean().optional().default(false),
  thinkingBudget: z.number().min(0).max(20000).optional().default(4000),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  topP: z.number().min(0).max(1).optional().default(0.8),
});
