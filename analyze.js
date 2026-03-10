import Anthropic from "@anthropic-ai/sdk";

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { base64, mediaType, text } = req.body;

  const prompt = `Analise esta fatura de cartão de crédito e retorne APENAS um JSON válido (sem markdown, sem texto extra) com esta estrutura exata:
{
  "total": número (total da fatura em reais),
  "month": string (mês/ano da fatura ex: "Março/2025"),
  "top_waste": string (principal vazamento financeiro, ex: "R$ 580 em delivery — 18 pedidos!"),
  "categories": [
    {"name": string, "amount": número, "percentage": número, "transactions": número}
  ],
  "insights": [string, string, string],
  "challenges": [
    {
      "id": string,
      "emoji": string,
      "title": string,
      "description": string,
      "points": número (entre 15 e 100),
      "savings": número (economia mensal estimada em reais),
      "category": string
    }
  ]
}
Crie exatamente 5 desafios personalizados e motivadores baseados nos gastos reais.
Use categorias: Alimentação, Delivery, Streaming, Transporte, Lazer, Assinaturas, Compras, Saúde, Outros.`;

  try {
    let messages;

    if (base64) {
      messages = [
        {
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: mediaType || "application/pdf", data: base64 } },
            { type: "text", text: prompt },
          ],
        },
      ];
    } else {
      messages = [
        {
          role: "user",
          content: `${prompt}\n\nDados da fatura:\n${text?.substring(0, 8000)}`,
        },
      ];
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages,
    });

    const raw = response.content.map((b) => b.text || "").join("");
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Falha na análise. Tente novamente." });
  }
}
