import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { messages, analysis, points, completedCount } = req.body;

  const system = `Você é uma consultora financeira especialista, empática e motivadora chamada Luna. 
Você acabou de analisar a fatura do cliente com estes dados:
${JSON.stringify(analysis, null, 2)}

O cliente já completou ${completedCount} desafios e tem ${points} pontos.

Responda de forma curta (máx 4 parágrafos), motivadora e prática. 
Use emojis com moderação. 
Seja específica sobre os dados da fatura quando relevante.
Encoraje o cliente a continuar os desafios e economizar.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system,
      messages,
    });

    const text = response.content.map((b) => b.text || "").join("");
    res.status(200).json({ reply: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no chat." });
  }
}
