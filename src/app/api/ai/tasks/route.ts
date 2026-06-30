import { NextResponse } from "next/server";
import { z } from "zod";

const aiTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().default(""),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  due_date: z.string().nullable().optional(),
  subtasks: z.array(z.string()).default([]),
});

const aiResponseSchema = z.object({
  tasks: z.array(aiTaskSchema).min(1).max(10),
});

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Chưa cấu hình GEMINI_API_KEY." }, { status: 400 });
  }

  const body = (await request.json()) as { prompt?: string };
  const prompt = body.prompt?.trim();
  if (!prompt) return NextResponse.json({ ok: false, error: "Vui lòng nhập mô tả công việc." }, { status: 400 });

  const instruction = `Phân tích mô tả tiếng Việt sau thành JSON thuần dạng {"tasks":[{"title":"","description":"","priority":"low|medium|high|urgent","due_date":null,"subtasks":[]}]}.
Không thêm markdown. Mô tả: ${prompt}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: instruction }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ ok: false, error: `Gemini API error ${response.status}` }, { status: 502 });
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return NextResponse.json({ ok: false, error: "AI không trả về nội dung hợp lệ." }, { status: 502 });

  try {
    const parsed = aiResponseSchema.parse(JSON.parse(text));
    return NextResponse.json({ ok: true, tasks: parsed.tasks });
  } catch {
    return NextResponse.json({ ok: false, error: "AI trả về JSON không đúng cấu trúc." }, { status: 502 });
  }
}
