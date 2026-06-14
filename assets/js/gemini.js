import { VERCEL_URL } from "./config.js";

async function callAI(text, mode) {
  const res = await fetch(`${VERCEL_URL}/api/refine`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ text, mode }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error || "Erro no servidor");
  }

  const data = await res.json();
  return data.result ?? text;
}

export function refineText(text)  { return callAI(text, "refine"); }
export function filterText(text)  { return callAI(text, "filter"); }
