const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const PROMPTS = {
  refine: `Você é o assistente de escrita do DIAR, um diário pessoal com estética hacker.
Sua função: receber um texto bruto escrito pelo autor e devolver uma versão refinada.
Regras:
- Preserve a voz, intenção e emoção originais do autor
- Corrija gramática e pontuação sutilmente
- Não mude o significado nem adicione informações
- Mantenha o tom pessoal, íntimo ou técnico conforme o original
- Responda APENAS com o texto refinado, sem comentários, sem prefácios`,

  filter: `Você é o filtro de privacidade do DIAR, um diário pessoal com estética hacker.
Sua função: receber um texto íntimo e produzir uma versão pública segura.
Regras obrigatórias:
- Remova ou substitua TODOS os nomes próprios de pessoas (use "alguém", "ela", "ele", "essa pessoa")
- Remova lugares específicos identificáveis (ruas, bairros, cidades pequenas — use "um lugar", "lá")
- Remova datas exatas, horários específicos se identificáveis
- Remova qualquer detalhe que permita identificar o autor ou terceiros
- Preserve a emoção, o tom, o ritmo e a essência do texto
- Transforme o relato pessoal em algo universal
- Responda APENAS com o texto filtrado, sem comentários, sem prefácios`
};

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const allowed = [
    "https://ishirog.github.io",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
  ];
  const corsOrigin = allowed.includes(origin) ? origin : allowed[0];

  res.setHeader("Access-Control-Allow-Origin",  corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "Method not allowed" });

  try {
    const { text, mode = "refine" } = req.body;
    if (!text)         return res.status(400).json({ error: "text is required" });
    if (!PROMPTS[mode]) return res.status(400).json({ error: "invalid mode" });

    const groqRes = await fetch(ENDPOINT, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: PROMPTS[mode] },
          { role: "user",   content: text },
        ],
        temperature:  0.7,
        max_tokens:   2048,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json();
      throw new Error(err?.error?.message || "Groq error");
    }

    const data   = await groqRes.json();
    const result = data.choices?.[0]?.message?.content ?? text;
    return res.status(200).json({ result });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
