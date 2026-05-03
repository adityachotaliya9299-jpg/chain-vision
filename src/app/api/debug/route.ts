// src/app/api/debug/route.ts
// TEMPORARY DEBUG ROUTE — delete after fixing

import { NextResponse } from "next/server";

export async function GET() {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const results: Record<string, string> = {
    groq_key_present: groqKey ? `YES (starts: ${groqKey.slice(0, 8)}...)` : "NO - not in .env.local",
    gemini_key_present: geminiKey ? `YES (starts: ${geminiKey.slice(0, 8)}...)` : "NO - not in .env.local",
  };

  // Test Groq connectivity
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: "Say: GROQ_WORKS" }],
        max_tokens: 10,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      results.groq_test = `SUCCESS: ${data?.choices?.[0]?.message?.content}`;
    } else {
      results.groq_test = `FAIL ${res.status}: ${JSON.stringify(data).slice(0, 200)}`;
    }
  } catch (e) {
    results.groq_test = `NETWORK_ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Test Gemini connectivity
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say: GEMINI_WORKS" }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      }
    );
    const data = await res.json();
    if (res.ok) {
      results.gemini_test = `SUCCESS: ${data?.candidates?.[0]?.content?.parts?.[0]?.text}`;
    } else {
      results.gemini_test = `FAIL ${res.status}: ${JSON.stringify(data).slice(0, 200)}`;
    }
  } catch (e) {
    results.gemini_test = `NETWORK_ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json(results, { status: 200 });
}